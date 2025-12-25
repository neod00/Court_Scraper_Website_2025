"""
Popular Items Scraper - Extracts popular auction items via XHR interception
"""

import asyncio
import json
import sys
import io

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.async_api import async_playwright


class PopularItemsScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml"
    
    def generate_detail_link(self, item: dict) -> str:
        sa_no = item.get('saNo', '')
        bo_cd = item.get('boCd', '')
        maemul_ser = item.get('maemulSer', '1')
        
        if sa_no and bo_cd:
            return f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml&saNo={sa_no}&boCd={bo_cd}&maemulSer={maemul_ser}"
        return ""
    
    def format_price(self, price_str: str) -> str:
        try:
            return f"{int(price_str):,}"
        except:
            return price_str or "0"
    
    def calculate_price_ratio(self, min_price: str, appraisal: str) -> str:
        try:
            min_val = int(min_price)
            app_val = int(appraisal)
            if app_val > 0:
                return f"{int((min_val / app_val) * 100)}%"
        except:
            pass
        return "-"
    
    async def scrape(self) -> list:
        """Scrape first page of popular items (10 items) with high stability."""
        captured_data = None
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            async def handle_response(response):
                nonlocal captured_data
                try:
                    url = response.url
                    # Match the actual XHR endpoint identified during debugging
                    if 'searchControllerMain.on' in url or 'searchController' in url:
                        body = await response.text()
                        if body.strip().startswith('{'):
                            data = json.loads(body)
                            if 'data' in data and isinstance(data['data'], dict):
                                for key, value in data['data'].items():
                                    if isinstance(value, list) and len(value) > 0:
                                        if isinstance(value[0], dict) and 'srnSaNo' in value[0]:
                                            captured_data = value
                except:
                    pass
            
            page.on("response", handle_response)
            
            # Navigate to the specific popular items page
            await page.goto(self.base_url, timeout=30000)
            await page.wait_for_selector("#mf_wfm_mainFrame_btn_mjrtyItrtSrch", timeout=15000)
            
            # Click search (조회) to trigger XHR
            await page.click("#mf_wfm_mainFrame_btn_mjrtyItrtSrch")
            
            # Wait for XHR response with polling for up to 10 seconds
            for _ in range(20):
                if captured_data:
                    break
                await asyncio.sleep(0.5)
            
            # Brief extra wait for stability
            await asyncio.sleep(1)
            await browser.close()
        
        # Process and map fields
        results = []
        seen = set()
        
        if captured_data:
            for item in captured_data:
                sa_no = item.get('saNo', '')
                maemul_ser = item.get('maemulSer', '1')
                key = f"{sa_no}_{maemul_ser}"
                
                if key in seen:
                    continue
                seen.add(key)
                
                min_price = item.get('minmaePrice', '')
                appraisal = item.get('gamevalAmt', '')
                
                results.append({
                    'caseNo': item.get('srnSaNo', ''),
                    'court': item.get('jiwonNm', ''),
                    'department': item.get('jpDeptNm', ''),
                    'itemType': item.get('dspslUsgNm', ''),
                    'address': item.get('printSt', ''),
                    'minPrice': self.format_price(min_price),
                    'appraisalPrice': self.format_price(appraisal),
                    'priceRatio': self.calculate_price_ratio(min_price, appraisal),
                    'failCount': item.get('yuchalCnt', '0'),
                    'interestCount': item.get('gwansMulRegCnt', item.get('inqCnt', '0')),
                    'remarks': item.get('mulBigo', ''),
                    'auctionDate': item.get('maeGiil', ''),
                    'detailLink': self.generate_detail_link(item),
                    'saNo': sa_no,
                    'boCd': item.get('boCd', ''),
                    'maemulSer': maemul_ser
                })
        
        return results


async def main():
    scraper = PopularItemsScraper()
    items = await scraper.scrape()
    # Output clean JSON for API consumption
    print(json.dumps(items, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
