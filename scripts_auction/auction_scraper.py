"""
Court Auction Scraper - Production Version
Scrapes auction listings from courtauction.go.kr
Target categories: Apartments, Villas, Officetels, Commercial
"""

import asyncio
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

# Supabase Setup
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Category codes for target property types
CATEGORY_CODES = {
    "아파트": "0000701001",
    "빌라/다세대": "0000701002",
    "오피스텔": "0000701003",
    "상가/근린시설": "0000702001"
}

class AuctionScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
        self.items_collected = []

    def parse_price(self, price_str):
        """Convert price string to a cleaner format"""
        if not price_str:
            return None
        # Remove commas and non-numeric characters except for the number
        return re.sub(r'[^\d]', '', str(price_str))

    def parse_date(self, date_str):
        """Convert date string YYYYMMDD to YYYY-MM-DD"""
        if not date_str or len(date_str) < 8:
            return None
        try:
            return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        except:
            return None

    def build_thumbnail_url(self, item):
        """Construct thumbnail URL from item data"""
        # The court site typically has image paths in specific fields
        # This will need refinement based on actual data structure
        img_path = item.get('imgPath') or item.get('photoPath') or item.get('thumPath')
        if img_path:
            if img_path.startswith('http'):
                return img_path
            else:
                return f"https://www.courtauction.go.kr{img_path}"
        return None

    def map_to_db_record(self, item):
        """Map raw API item to database record structure"""
        # Extract case number for site_id
        case_no = item.get('srnSaNo', '')  # e.g., "2022타경3289"
        col_merge = item.get('colMerge', '')
        site_id = f"auction_{col_merge}" if col_merge else f"auction_{case_no}"
        
        # Build title from address and usage
        usage = item.get('dspslUsgNm', '물건')
        address = item.get('printSt') or item.get('bgPlaceRdAllAddr', '')
        title = f"[{usage}] {address[:50]}..." if len(address) > 50 else f"[{usage}] {address}"
        
        # Parse prices - CORRECTED FIELD NAMES
        min_price = item.get('minmaePrice')  # 최저매각가격
        appraised = item.get('gamevalAmt')   # 감정평가액
        
        # Build status from yuchalCnt (유찰횟수)
        yuchal_cnt = item.get('yuchalCnt', '0')
        status = f"유찰 {yuchal_cnt}회" if yuchal_cnt and int(yuchal_cnt) > 0 else "신건"
        
        # Determine category
        category = 'real_estate'
        usage_lower = usage.lower() if usage else ''
        if '아파트' in usage_lower:
            category = 'apartment'
        elif '빌라' in usage_lower or '다세대' in usage_lower:
            category = 'villa'
        elif '오피스텔' in usage_lower:
            category = 'officetel'
        elif '상가' in usage_lower or '근린' in usage_lower:
            category = 'commercial'
        
        # Build correct detail link using boCd and saNo
        bo_cd = item.get('boCd', '')
        sa_no = item.get('saNo', '')
        maemul_ser = item.get('maemulSer', '1')
        detail_link = f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F01.xml&boCd={bo_cd}&saNo={sa_no}&maemulSer={maemul_ser}"
        
        return {
            "site_id": site_id,
            "title": title,
            "department": item.get('jiwonNm', '') + ' ' + item.get('jpDeptNm', ''),
            "manager": None,
            "date_posted": datetime.now().date().isoformat(),
            "detail_link": detail_link,
            "content_text": address,
            "category": category,
            "phone": item.get('tel'),
            # New auction fields - CORRECTED
            "source_type": "auction",
            "minimum_price": self.parse_price(min_price),
            "appraised_price": self.parse_price(appraised),
            "auction_date": self.parse_date(item.get('maeGiil')),  # CORRECTED: maeGiil not maegDate
            "address": address,
            "status": status,
            "thumbnail_url": None  # API doesn't provide images; frontend uses placeholder
        }

    async def scrape_auctions(self, max_pages=3):
        """Main scraping function using Playwright"""
        print("Starting Auction Scraper...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            print("Navigating to Court Auction Search Page...")
            await page.goto(self.base_url)
            await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)

            all_items = []
            captured_data = None

            async def handle_response(response):
                nonlocal captured_data
                if "searchControllerMain.on" in response.url:
                    try:
                        json_data = await response.json()
                        captured_data = json_data
                    except:
                        pass

            page.on("response", handle_response)

            # Trigger initial search (default params = all)
            print("Triggering Search...")
            await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")

            # Wait for response
            for _ in range(20):
                if captured_data:
                    break
                await asyncio.sleep(0.5)

            if captured_data:
                # Find the list in the response
                data = captured_data.get('data', {})
                items = []
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        items = value
                        break
                
                print(f"Captured {len(items)} items from search.")
                all_items.extend(items)
            else:
                print("Failed to capture initial search response.")

            await browser.close()

        # Process and save items
        print(f"\nProcessing {len(all_items)} total items...")
        success_count = 0
        
        for item in all_items:
            try:
                record = self.map_to_db_record(item)
                result = supabase.table("court_notices").upsert(
                    record, 
                    on_conflict="site_id,source_type"
                ).execute()
                
                if result.data:
                    success_count += 1
            except Exception as e:
                print(f"Error saving item: {e}")
                continue

        print(f"\nScraping Complete! Successfully saved {success_count} auction items.")
        return success_count


async def main():
    scraper = AuctionScraper()
    await scraper.scrape_auctions(max_pages=3)


if __name__ == "__main__":
    asyncio.run(main())
