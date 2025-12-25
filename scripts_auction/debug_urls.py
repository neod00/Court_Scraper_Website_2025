"""
Debug script to show all XHR URLs after search click
"""

import asyncio
import json
import sys
from playwright.async_api import async_playwright


async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        xhr_urls = []
        
        async def handle_response(response):
            url = response.url
            # Capture POST requests and JSON responses
            if response.request.method == "POST" or "json" in response.headers.get("content-type", ""):
                xhr_urls.append(url)
        
        page.on("response", handle_response)
        
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml", timeout=30000)
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_mjrtyItrtSrch", timeout=15000)
        
        # Clear and record only after click
        xhr_urls.clear()
        await page.click("#mf_wfm_mainFrame_btn_mjrtyItrtSrch")
        await asyncio.sleep(5)
        
        print("XHR URLs after search click:")
        for url in xhr_urls:
            print(f"  {url}")
        
        await browser.close()


asyncio.run(debug())
