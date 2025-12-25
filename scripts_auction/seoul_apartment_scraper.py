"""
Seoul Apartment Scraper - Specialized for next 7 days using 7-step bypass strategy.
"""

import asyncio
import json
import sys
import io
import random
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class SeoulApartmentScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
        self.target_xhr_pattern = "searchControllerMain.on"
        
    async def _apply_stealth(self, page):
        """Step 1 & 2: Manual Stealth and Fingerprinting Spoofing"""
        await page.add_init_script("""
            // Hide webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });
            
            // Spoof hardware info
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => [4, 8, 16][Math.floor(Math.random() * 3)]
            });
            
            // Add fake chrome object
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            // Spoof plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
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

    async def scrape(self, start_date=None, end_date=None) -> list:
        today = datetime.now()
        if not start_date:
            start_date = today.strftime("%Y%m%d")
        if not end_date:
            end_date = (today + timedelta(days=7)).strftime("%Y%m%d")
        
        captured_data = None
        results = []

        async with async_playwright() as p:
            # Step 5: Fake Headless (Actual browser but off-screen)
            browser = await p.chromium.launch(
                headless=False,
                args=['--window-position=-2400,-2400']
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            await self._apply_stealth(page)

            # Step 6: XHR Interception
            async def handle_response(response):
                nonlocal captured_data
                try:
                    url = response.url
                    if self.target_xhr_pattern in url:
                        body = await response.text()
                        if body.strip().startswith('{'):
                            data = json.loads(body)
                            if 'data' in data and isinstance(data['data'], dict):
                                # Detailed search response uses 'dlt_srchResult'
                                if 'dlt_srchResult' in data['data']:
                                    captured_data = data['data']['dlt_srchResult']
                                else:
                                    # Fallback to scanning for any list with 'srnSaNo'
                                    for key, value in data['data'].items():
                                        if isinstance(value, list) and len(value) > 0:
                                            if isinstance(value[0], dict) and 'srnSaNo' in value[0]:
                                                captured_data = value
                except:
                    pass

            page.on("response", handle_response)

            # Navigate
            print(f"Navigating to {self.base_url}...", file=sys.stderr)
            await page.goto(self.base_url, timeout=45000)
            await self._human_delay(2000, 3000) # Wait for page initialization

            # --- Apply Filters ---
            print(f"Applying filters: Seoul, Apartments, {start_date} to {end_date}...", file=sys.stderr)
            
            # 0. Show the location-based search mode (CRITICAL)
            print("Clicking '소재지' radio button...", file=sys.stderr)
            await page.evaluate("""
                // Try multiple possible IDs for the location radio button
                const ids = [
                    'mf_wfm_mainFrame_rdo_rletCortLoc_input_1',
                    'mf_wfm_mainFrame_rdo_rletSrchChc_input_1'
                ];
                let rb = null;
                for (const id of ids) {
                    rb = document.getElementById(id);
                    if (rb) break;
                }
                
                if (rb) {
                    rb.click();
                    rb.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    // Try clicking by label text
                    const labels = Array.from(document.querySelectorAll('label'));
                    const targetLabel = labels.find(l => l.textContent.includes('소재지'));
                    if (targetLabel) targetLabel.click();
                }
            """)
            
            # Now wait for the location dropdown to appear
            await self._human_delay(1000, 2000)
            
            # 1. Location (Seoul)
            print("Selecting Seoul...", file=sys.stderr)
            await page.evaluate("""
                const sel = document.getElementById('mf_wfm_mainFrame_sbx_rletAdongSdS');
                if (sel) {
                    const opt = Array.from(sel.options).find(o => o.text.includes('서울'));
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            """)
            await self._human_delay()

            # 2. Type (Building -> Residential -> Apartment)
            print("Selecting Building -> Residential -> Apartment...", file=sys.stderr)
            
            # Large category: 건물 (Building)
            await page.evaluate("""
                const sel = document.getElementById('mf_wfm_mainFrame_sbx_rletLclLst');
                if (sel) {
                    const opt = Array.from(sel.options).find(o => o.text.includes('건물'));
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            """)
            await self._human_delay(1500, 2000) # Wait for cascade
            
            # Middle category: 주거용건물 (Residential Building)
            await page.evaluate("""
                const sel = document.getElementById('mf_wfm_mainFrame_sbx_rletMclLst');
                if (sel) {
                    const opt = Array.from(sel.options).find(o => o.text.includes('주거용'));
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            """)
            await self._human_delay(1500, 2000) # Wait for cascade
            
            # Small category: 아파트 (Apartment)
            await page.evaluate("""
                const sel = document.getElementById('mf_wfm_mainFrame_sbx_rletSclLst');
                if (sel) {
                    const opt = Array.from(sel.options).find(o => o.text.includes('아파트'));
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            """)
            await self._human_delay()

            # 3. Dates
            # Clear and type dates for the next 7 days
            start_input = "#mf_wfm_mainFrame_cal_rletPerdStr_input"
            end_input = "#mf_wfm_mainFrame_cal_rletPerdEnd_input"
            
            await page.fill(start_input, start_date)
            await self._human_delay(200, 500)
            await page.fill(end_input, end_date)
            await self._human_delay()

            # 4. Search Button Click
            print("Clicking search...", file=sys.stderr)
            await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
            
            # Wait for data with polling
            for _ in range(30):
                if captured_data:
                    break
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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", help="Start date (YYYYMMDD)")
    parser.add_argument("--end", help="End date (YYYYMMDD)")
    parser.add_argument("--output", help="Output file path", default="seoul_apartments.json")
    args = parser.parse_args()

    scraper = SeoulApartmentScraper()
    items = await scraper.scrape(start_date=args.start, end_date=args.end)
    
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"Scraping completed. {len(items)} items saved to {args.output}")

if __name__ == "__main__":
    asyncio.run(main())
