import asyncio
from playwright.async_api import async_playwright

async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto('https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml', timeout=30000)
        await page.wait_for_selector('#mf_wfm_mainFrame_btn_mjrtyItrtSrch', timeout=15000)
        await page.click('#mf_wfm_mainFrame_btn_mjrtyItrtSrch')
        await asyncio.sleep(5)
        
        # Check which page buttons exist
        for i in range(1, 7):
            exists = await page.evaluate(f'() => !!document.getElementById("mf_wfm_mainFrame_pgl_gdsDtlSrchPage_page_{i}")')
            print(f'Page {i} exists: {exists}')
        
        # Also check total count  
        total = await page.evaluate('''() => {
            const el = document.querySelector('.w2pageList_label');
            return el ? el.innerText : 'not found';
        }''')
        print(f'Total label: {total}')
        
        # Check row count in table
        rows = await page.evaluate('''() => {
            const table = document.getElementById('mf_wfm_mainFrame_grd_gdsDtlSrchResult_body_table');
            return table ? table.rows.length : 0;
        }''')
        print(f'Rows in table: {rows}')
        
        await browser.close()

asyncio.run(debug())
