import asyncio
import json
from playwright.async_api import async_playwright

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        all_data = {}
        latest_data = None
        
        async def handle_response(response):
            nonlocal latest_data
            url = response.url
            if any(x in url for x in ['Controller.on', 'controller.on', 'mjrtyItrt']):
                try:
                    body = await response.text()
                    if body.strip().startswith('{'):
                        data = json.loads(body)
                        if 'data' in data and isinstance(data['data'], dict):
                            for key, value in data['data'].items():
                                if isinstance(value, list) and len(value) > 0:
                                    first = value[0]
                                    if isinstance(first, dict) and 'srnSaNo' in first:
                                        latest_data = value
                except:
                    pass
        
        page.on('response', handle_response)
        
        await page.goto('https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml', timeout=30000)
        await page.wait_for_selector('#mf_wfm_mainFrame_btn_mjrtyItrtSrch', timeout=15000)
        
        # Page 1
        await page.click('#mf_wfm_mainFrame_btn_mjrtyItrtSrch')
        await asyncio.sleep(4)
        if latest_data:
            all_data[1] = [item.get('srnSaNo', '') for item in latest_data]
            print(f'Page 1: {len(latest_data)} items - first: {latest_data[0].get("srnSaNo") if latest_data else "none"}')
        
        # Pages 2-5
        for pg in range(2, 6):
            try:
                btn = f'#mf_wfm_mainFrame_pgl_gdsDtlSrchPage_page_{pg}'
                exists = await page.evaluate(f'() => !!document.getElementById("mf_wfm_mainFrame_pgl_gdsDtlSrchPage_page_{pg}")')
                if exists:
                    latest_data = None
                    await page.click(btn)
                    await asyncio.sleep(3)
                    if latest_data:
                        all_data[pg] = [item.get('srnSaNo', '') for item in latest_data]
                        print(f'Page {pg}: {len(latest_data)} items - first: {latest_data[0].get("srnSaNo") if latest_data else "none"}')
                    else:
                        print(f'Page {pg}: No data captured')
                else:
                    print(f'Page {pg}: Does not exist')
                    break
            except Exception as e:
                print(f'Page {pg}: Error - {e}')
        
        await browser.close()
        
        # Count unique items
        all_cases = []
        for pg, cases in all_data.items():
            all_cases.extend(cases)
        print(f'Total unique items: {len(set(all_cases))} / {len(all_cases)} total')

asyncio.run(debug())
