"""
Enhanced Scraper: Extract ALL available fields from XHR response
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def get_full_auction_data():
    print("Fetching full auction data from XHR...")
    
    captured_data = None
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        async def handle_response(response):
            nonlocal captured_data
            if "searchControllerMain" in response.url:
                try:
                    captured_data = await response.json()
                except:
                    pass
        
        page.on("response", handle_response)
        
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=15000)
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
        
        for _ in range(15):
            if captured_data:
                break
            await asyncio.sleep(1)
        
        await browser.close()
    
    if captured_data:
        items = captured_data.get('data', {}).get('dlt_list', [])
        if not items:
            for key, value in captured_data.get('data', {}).items():
                if isinstance(value, list) and len(value) > 0:
                    items = value
                    break
        
        # Find our target and print ALL fields
        for item in items:
            if item.get('srnSaNo') == '2022타경3289':
                print("\n=== ALL AVAILABLE FIELDS FOR 2022타경3289 ===\n")
                for key, value in sorted(item.items()):
                    if value:  # Only show non-empty values
                        print(f"{key}: {value}")
                return item
    
    return None


if __name__ == "__main__":
    asyncio.run(get_full_auction_data())
