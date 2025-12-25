"""
Auction Search Scraper - Generalized for Seoul/Gyeonggi/Incheon and Apartment/Villa.
Uses 7-step bypass strategy and XHR interception.
"""

import asyncio
import json
import sys
import io
import random
import argparse
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class AuctionSearchScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
        self.target_xhr_pattern = "searchControllerMain.on"
        
    async def _apply_stealth(self, page):
        """Step 1 & 2: Manual Stealth and Fingerprinting Spoofing"""
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => [4, 8, 16][Math.floor(Math.random() * 3)] });
            window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5], });
        """)

    async def _human_delay(self, min_ms=500, max_ms=1500):
        """Step 3: Behavioral Simulation - Random delays"""
        await asyncio.sleep(random.uniform(min_ms, max_ms) / 1000)

    def generate_detail_link(self, item: dict) -> str:
        sa_no = item.get('saNo', '')
        bo_cd = item.get('boCd', '')
        maemul_ser = item.get('maemulSer', '1')
        if sa_no and bo_cd:
            return f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml&saNo={sa_no}&boCd={bo_cd}&maemulSer={maemul_ser}"
        return ""

    async def scrape(self, region="서울특별시", category="아파트", start_date=None, end_date=None) -> list:
        today = datetime.now()
        if not start_date:
            start_date = today.strftime("%Y%m%d")
        if not end_date:
            end_date = (today + timedelta(days=7)).strftime("%Y%m%d")
        
        captured_data = None
        results = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                args=['--window-position=-2400,-2400']
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            await self._apply_stealth(page)

            async def handle_response(response):
                nonlocal captured_data
                try:
                    url = response.url
                    if self.target_xhr_pattern in url:
                        body = await response.text()
                        if body.strip().startswith('{'):
                            data = json.loads(body)
                            if 'data' in data and isinstance(data['data'], dict):
                                if 'dlt_srchResult' in data['data']:
                                    captured_data = data['data']['dlt_srchResult']
                except: pass

            page.on("response", handle_response)

            print(f"Searching: [{region}] [{category}] from {start_date} to {end_date}...", file=sys.stderr)
            await page.goto(self.base_url, timeout=45000)
            await self._human_delay(2000, 3000)

            # --- Apply Filters ---
            # 0. Show the location-based search mode
            await page.evaluate("""
                const rb = document.getElementById('mf_wfm_mainFrame_rdo_rletCortLoc_input_1') || 
                           document.getElementById('mf_wfm_mainFrame_rdo_rletSrchChc_input_1');
                if (rb) { rb.click(); rb.dispatchEvent(new Event('change', { bubbles: true })); }
                else {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const targetLabel = labels.find(l => l.textContent.includes('소재지'));
                    if (targetLabel) targetLabel.click();
                }
            """)
            await self._human_delay(1500, 2500)

            # 1. Selection Logic Helper
            async def select_option(sel_id, text_to_include):
                await page.evaluate(f"""
                    (function() {{
                        const sel = document.getElementById('{sel_id}');
                        if (sel) {{
                            const opt = Array.from(sel.options).find(o => o.text.includes('{text_to_include}'));
                            if (opt) {{
                                sel.value = opt.value;
                                sel.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            }}
                        }}
                    }})();
                """)
                await self._human_delay(1000, 1500)

            # 1. Location
            await select_option('mf_wfm_mainFrame_sbx_rletAdongSdS', region)
            
            # 2. Type (Building -> Residential -> Category)
            await select_option('mf_wfm_mainFrame_sbx_rletLclLst', '건물')
            await select_option('mf_wfm_mainFrame_sbx_rletMclLst', '주거용')
            
            # For category mapping
            cat_text = category
            if category == "빌라":
                cat_text = "다세대" # Default to '다세대' for Villa, or optionally allow both
            
            await select_option('mf_wfm_mainFrame_sbx_rletSclLst', cat_text)

            # 3. Dates
            await page.fill("#mf_wfm_mainFrame_cal_rletPerdStr_input", start_date)
            await self._human_delay(300, 600)
            await page.fill("#mf_wfm_mainFrame_cal_rletPerdEnd_input", end_date)
            await self._human_delay()

            # 4. Search
            print("Clicking search...", file=sys.stderr)
            await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch", force=True)
            
            for _ in range(40):
                if captured_data: break
                await asyncio.sleep(0.5)
            
            await asyncio.sleep(2)
            await browser.close()

        if captured_data:
            seen = set()
            for item in captured_data:
                sa_no = item.get('saNo', '')
                maemul_ser = item.get('maemulSer', '1')
                key = f"{sa_no}_{maemul_ser}"
                if key in seen: continue
                seen.add(key)
                
                results.append({
                    'caseNo': item.get('srnSaNo', ''),
                    'court': item.get('jiwonNm', ''),
                    'department': item.get('jpDeptNm', ''),
                    'itemType': item.get('dspslUsgNm', ''),
                    'address': item.get('printSt', item.get('hjguSido', '') + ' ' + item.get('hjguSigu', '') + ' ' + item.get('buldNm', '')),
                    'minPrice': item.get('minmaePrice', '0'),
                    'appraisalPrice': item.get('gamevalAmt', '0'),
                    'auctionDate': item.get('maeGiil', ''),
                    'status': item.get('maeStsNm', ''),
                    'detailLink': self.generate_detail_link(item),
                    'saNo': sa_no,
                    'boCd': item.get('boCd', ''),
                    'maemulSer': maemul_ser
                })
        
        return results

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", default="서울특별시")
    parser.add_argument("--category", default="아파트")
    parser.add_argument("--start", help="YYYYMMDD")
    parser.add_argument("--end", help="YYYYMMDD")
    parser.add_argument("--output", help="Output file", default="auction_results.json")
    args = parser.parse_args()

    scraper = AuctionSearchScraper()
    items = await scraper.scrape(region=args.region, category=args.category, start_date=args.start, end_date=args.end)
    
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"Scraping completed. {len(items)} items saved.")

if __name__ == "__main__":
    asyncio.run(main())
