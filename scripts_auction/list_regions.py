import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_rad_rletSrchBtn_input_1", timeout=30000)
        
        # Click the radio label to reveal dropdown
        await page.click("label:has-text('소재지(지번주소)')")
        await asyncio.sleep(2)
        
        options = await page.evaluate("""
            () => [...document.getElementById('mf_wfm_mainFrame_sbx_rletAdongSdS').options].map(o => ({val: o.value, text: o.text}))
        """)
        
        print("--- REGION LIST ---")
        for opt in options:
            print(f"TEXT: {opt['text']}, VAL: {opt['val']}")
        print("--- END ---")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
