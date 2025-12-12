import os
import re
import requests
import json
from datetime import datetime, date, timedelta
from typing import Optional, Dict, List
from bs4 import BeautifulSoup
from urllib.parse import unquote, quote
import urllib3
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables (from .env.local in project root)
# Resolving path relative to this script file (scripts/scraper.py -> ../.env.local)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

# Supabase Setup
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Prefer Service Role Key for backend scripts to bypass RLS
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found in environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SSL Warning Disable
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CourtScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.verify = False
        self.base_url = "https://www.scourt.go.kr/portal/notice/realestate/RealNoticeList.work"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    
    def extract_seq_id(self, link_element) -> Optional[str]:
        href = link_element.get('href')
        if href:
            seq_id_match = re.search(r'seq_id=(\d+)', href)
            if seq_id_match:
                return seq_id_match.group(1)
        onclick = link_element.get('onclick', '')
        seq_id_match = re.search(r"goView\('(\d+)'\)", onclick)
        if seq_id_match:
            return seq_id_match.group(1)
        return None

    def extract_text_by_th(self, soup: BeautifulSoup, th_text: str) -> Optional[str]:
        matching_elements = soup.find_all('th', string=lambda x: x and th_text in x)
        for th_element in matching_elements:
            if th_element and th_element.find_next_sibling('td'):
                return th_element.find_next_sibling('td').get_text(strip=True)
        return None

    def get_file_info_json(self, detail_soup: BeautifulSoup) -> List[Dict]:
        """Extracts file download full parameters and returns as JSON list."""
        file_list = []
        links = detail_soup.find_all('a')
        
        # Regex to find download('server_file', 'original_file')
        download_pattern = r"download\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"

        for link in links:
            onclick = link.get('onclick', '')
            href = link.get('href', '')
            source = href if 'download(' in href else onclick if 'download(' in onclick else None

            if source:
                match = re.search(download_pattern, source)
                if match:
                    try:
                        server_filename = match.group(1)
                        original_filename = match.group(2)
                        
                        # Apply decode logic from original app.py
                        try:
                            original_filename = unquote(original_filename)
                            # Attempting euc-kr decode/encode dance only if needed, 
                            # but usually unquote is enough or we keep it raw for the frontend to handle.
                            # For safety, let's keep it as string.
                        except:
                            pass

                        file_list.append({
                            "server_filename": server_filename,
                            "original_filename": original_filename,
                            "download_method": "POST" # Court site uses POST for download
                        })
                    except Exception as e:
                        print(f"Error extracting file info: {e}")
                        continue
        return file_list

    def delete_old_records(self, days=90):
        """Deletes records older than X days based on date_posted."""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            # Disable RLS or ensure Service Key is used
            result = supabase.table("court_notices").delete().lt("date_posted", cutoff_date).execute()
            print(f"Cleanup: Deleted records older than {days} days (before {cutoff_date}).")
        except Exception as e:
            print(f"Error deleting old records: {e}")

    def scrape_and_save(self, pages_to_scrape=3):
        # 1. Cleanup old records first
        self.delete_old_records(90)
        
        print(f"Starting Scraper... Target Pages: {pages_to_scrape}")
        count_new = 0
        
        for page in range(1, pages_to_scrape + 1):
            print(f"Processing Page {page}...")
            try:
                params = {'pageIndex': page}
                response = self.session.get(self.base_url, params=params, headers=self.headers)
                response.encoding = 'euc-kr'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                table = soup.find('table', class_='tableHor')
                if not table:
                    print("Table not found on page.")
                    continue
                
                rows = table.find_all('tr')[1:]
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) < 4: continue
                    
                    # 1. Basic Info from List
                    title = cols[3].get_text(strip=True)
                    link_element = cols[3].find('a')
                    if not link_element: continue
                    
                    site_id = self.extract_seq_id(link_element)
                    if not site_id: continue
                    
                    # 2. Go to Detail Page
                    detail_url = f"https://www.scourt.go.kr/portal/notice/realestate/RealNoticeView.work?seq_id={site_id}"
                    try:
                        det_res = self.session.get(detail_url, headers=self.headers)
                        det_res.encoding = 'euc-kr'
                        det_soup = BeautifulSoup(det_res.text, 'html.parser')
                        
                        date_str = self.extract_text_by_th(det_soup, '작성일')
                        department = self.extract_text_by_th(det_soup, '부서')
                        manager = self.extract_text_by_th(det_soup, '작성자')
                        
                        # Date parsing
                        date_posted = None
                        if date_str:
                             try:
                                 dt = datetime.strptime(date_str, '%Y.%m.%d').date()
                                 date_posted = dt.isoformat()
                             except:
                                 pass
                        
                        if not date_posted: continue

                        # File Info
                        file_info_list = self.get_file_info_json(det_soup)
                        
                        # Category Guessing (Expanded)
                        category = 'etc'
                        title_lower = title  # Keep original case for now, or lower() if needed but korean chars don't matter much
                        
                        if '부동산' in title: category = 'real_estate'
                        elif any(x in title for x in ['차량', '자동차', '중기', '덤프', '굴삭기']): category = 'vehicle'
                        elif any(x in title for x in ['비품', 'TV', '에어컨', '컴퓨터', '전자']): category = 'electronics'
                        elif '채권' in title: category = 'bond'
                        elif '주식' in title: category = 'stock'
                        elif '특허' in title: category = 'patent'
                        elif '무체재산' in title: category = 'intangible'
                        elif '자산' in title: category = 'asset'
                        
                        # 3. UPSERT to Supabase
                        data = {
                            "site_id": site_id,
                            "title": title,
                            "department": department,
                            "manager": manager,
                            "date_posted": date_posted,
                            "detail_link": detail_url,
                            "file_info": file_info_list if file_info_list else None,
                            "category": category,
                            "content_text": title
                        }
                        
                        result = supabase.table("court_notices").upsert(data, on_conflict="site_id").execute()
                        
                        if result.data:
                            count_new += 1
                            
                    except Exception as e:
                        print(f"Error processing item {site_id}: {e}")
                        continue
                        
            except Exception as e:
                print(f"Page error: {e}")
        
        print(f"Scraping Finished. Processed successfully.")

if __name__ == "__main__":
    scraper = CourtScraper()
    scraper.scrape_and_save(pages_to_scrape=3)

