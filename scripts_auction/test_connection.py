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
                    # WebSquare seems to return JSON in some configurations or we intercepted a JSON bridge
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
            # Extract list - based on common WebSquare patterns, it's likely in 'data'
            # Let's try to find the list.
            try:
                # Based on the previous log: data.dlt_list or similar
                items = captured_data.get('data', {}).get('dlt_list', [])
                if not items:
                    # Alternative lookups
                    for key, value in captured_data.get('data', {}).items():
                        if isinstance(value, list) and len(value) > 0:
                            items = value
                            break
                
                print(f"\nFound {len(items)} items. Displaying first 5:")
                print("-" * 50)
                print(f"\nFound {len(items)} items. Displaying first 5:")
                print("-" * 50)
                for i, item in enumerate(items[:5]):
                    court = item.get('jiwonNm', 'N/A')
                    case_no = item.get('caseNo', 'N/A')
                    address = item.get('addr', 'N/A')
                    price = item.get('lowPrice', 'N/A')
                    status = item.get('mulStatnm', 'N/A')
                    usage = item.get('dspslUsgNm', 'N/A')
                    date = item.get('maegDate', 'N/A')
                    
                    print(f"[{i+1}] {court} {case_no}")
                    print(f"    물건: {usage}")
                    print(f"    주소: {address}")
                    print(f"    최저가: {price}")
                    print(f"    매각기일: {date}")
                    print(f"    상태: {status}")
                    print("-" * 30)
                    
            except Exception as e:
                print(f"Error parsing items: {e}")
                print("Full Data Structure keys:", captured_data.keys())
        else:
            print("Failed to capture search response.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
