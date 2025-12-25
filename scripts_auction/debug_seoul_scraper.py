import asyncio
import json
import sys
from datetime import datetime, timedelta
from playwright.async_api import async_playwright

async def debug_scrape():
    today = datetime.now()
    start_date = today.strftime("%Y%m%d")
    end_date = (today + timedelta(days=14)).strftime("%Y%m%d") # Extend to 14 days for debug
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, args=['--window-position=-2400,-2400'])
        context = await browser.new_context()
        page = await context.new_page()

        async def handle_response(response):
            try:
                url = response.url
                if 'Controller' in url or '.on' in url:
                    status = response.status
                    print(f"XHR found: {url} (Status: {status})", file=sys.stderr)
                    if status == 200:
                        text = await response.text()
                        print(f"Response (first 100 chars): {text[:100]}", file=sys.stderr)
            except Exception as e:
                pass

        page.on("response", handle_response)
        
        url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
        await page.goto(url)
        await asyncio.sleep(5)
        
        # Click Location Radio
        await page.evaluate("""
            const rb = document.getElementById('mf_wfm_mainFrame_rdo_rletSrchChc_input_1') || 
                       document.getElementById('mf_wfm_mainFrame_rdo_rletCortLoc_input_1');
            if (rb) { rb.click(); rb.dispatchEvent(new Event('change', {bubbles:true})); }
        """)
        await asyncio.sleep(2)
        
        # Select Filters
        await page.evaluate("""
            function sel(id, text) {
                const el = document.getElementById(id);
                if (el) {
                    const opt = Array.from(el.options).find(o => o.text.includes(text));
                    if (opt) { el.value = opt.value; el.dispatchEvent(new Event('change', {bubbles:true})); }
                }
            }
            sel('mf_wfm_mainFrame_sbx_rletAdongSdS', '서울');
            sel('mf_wfm_mainFrame_sbx_rletLclLst', '건물');
        """)
        await asyncio.sleep(1)
        await page.evaluate("""
            function sel(id, text) {
                const el = document.getElementById(id);
                if (el) {
                    const opt = Array.from(el.options).find(o => o.text.includes(text));
                    if (opt) { el.value = opt.value; el.dispatchEvent(new Event('change', {bubbles:true})); }
                }
            }
            sel('mf_wfm_mainFrame_sbx_rletMclLst', '주거용');
        """)
        await asyncio.sleep(1)
        await page.evaluate("""
            function sel(id, text) {
                const el = document.getElementById(id);
                if (el) {
                    const opt = Array.from(el.options).find(o => o.text.includes(text));
                    if (opt) { el.value = opt.value; el.dispatchEvent(new Event('change', {bubbles:true})); }
                }
            }
            sel('mf_wfm_mainFrame_sbx_rletSclLst', '아파트');
        """)
        await asyncio.sleep(1)
        
        # Click Search
        print("Clicking search...", file=sys.stderr)
        await page.evaluate("""
            const btn = document.getElementById('mf_wfm_mainFrame_btn_gdsDtlSrch') || 
                        document.getElementById('mf_wfm_mainFrame_btnSrch');
            if (btn) btn.click();
        """)
        
        await asyncio.sleep(10)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_scrape())
