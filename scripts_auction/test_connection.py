import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to Court Auction Search Page...")
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch")

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

        print("Triggering Search...")
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")

        for _ in range(15):
            if captured_data:
                break
            await asyncio.sleep(1)

        if captured_data:
            print("Successfully captured JSON data!")
            try:
                items = captured_data.get('data', {}).get('dlt_list', [])
                if not items:
                    for key, value in captured_data.get('data', {}).items():
                        if isinstance(value, list) and len(value) > 0:
                            items = value
                            break
                
                print(f"\nFound {len(items)} items.")
                if items:
                    print("\n=== FULL FIRST ITEM (ALL FIELDS) ===")
                    print(json.dumps(items[0], ensure_ascii=False, indent=2))
                    
            except Exception as e:
                print(f"Error: {e}")
        else:
            print("Failed to capture search response.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
