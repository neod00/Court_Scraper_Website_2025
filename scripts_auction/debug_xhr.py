import asyncio
import json
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        captured = []
        
        async def handle_response(response):
            url = response.url
            if any(pattern in url for pattern in ['Controller.on', 'controller.on', 'searchController', 'mjrtyItrt']):
                try:
                    body = await response.text()
                    if body.strip().startswith('{'):
                        data = json.loads(body)
                        if 'data' in data and isinstance(data['data'], dict):
                            for key, value in data['data'].items():
                                if isinstance(value, list) and len(value) > 0:
                                    first = value[0]
                                    if isinstance(first, dict) and 'srnSaNo' in first:
                                        captured.append({'key': key, 'count': len(value)})
                except Exception as e:
                    print(f'Error: {e}')
        
        page.on('response', handle_response)
        await page.goto('https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml', timeout=30000)
        await page.wait_for_selector('#mf_wfm_mainFrame_btn_mjrtyItrtSrch', timeout=15000)
        await page.click('#mf_wfm_mainFrame_btn_mjrtyItrtSrch')
        await asyncio.sleep(10)
        await browser.close()
        
        print('Captured data sets:')
        for c in captured:
            print(f"  Key: {c['key']}, Count: {c['count']}")

asyncio.run(test())
