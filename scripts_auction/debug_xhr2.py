"""
Debug script to check XHR capture
"""

import asyncio
import json
import sys
from playwright.async_api import async_playwright


async def debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        responses_captured = []
        
        async def handle_response(response):
            url = response.url
            responses_captured.append(url[:100])
            
            if 'Controller.on' in url or 'controller.on' in url:
                print(f"[MATCH] URL: {url[:80]}...", file=sys.stderr, flush=True)
                try:
                    body = await response.text()
                    print(f"  Body length: {len(body)}", file=sys.stderr, flush=True)
                    if body.strip().startswith('{'):
                        data = json.loads(body)
                        if 'data' in data:
                            print(f"  Has 'data' key: {type(data['data'])}", file=sys.stderr, flush=True)
                except Exception as e:
                    print(f"  Error: {e}", file=sys.stderr, flush=True)
        
        page.on("response", handle_response)
        
        print("Navigating...", file=sys.stderr, flush=True)
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml", timeout=30000)
        
        print("Waiting for button...", file=sys.stderr, flush=True)
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_mjrtyItrtSrch", timeout=15000)
        
        print("Clicking search...", file=sys.stderr, flush=True)
        await page.click("#mf_wfm_mainFrame_btn_mjrtyItrtSrch")
        
        print("Waiting for data...", file=sys.stderr, flush=True)
        await asyncio.sleep(10)
        
        print(f"\nTotal responses captured: {len(responses_captured)}", file=sys.stderr, flush=True)
        await browser.close()


asyncio.run(debug())
