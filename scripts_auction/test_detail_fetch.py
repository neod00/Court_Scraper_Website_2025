"""
Test script to fetch auction detail page by triggering the detail view.
Uses WebSquare's internal navigation after clicking a search result.
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def fetch_auction_detail_page():
    """
    Click into the actual detail page and extract all available data.
    """
    print("Starting detail page fetch test...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Show browser for debugging
        context = await browser.new_context()
        page = await context.new_page()
        
        captured_detail_data = None
        
        async def handle_response(response):
            nonlocal captured_detail_data
            url = response.url
            # Capture detail-related XHR
            if "detailController" in url.lower() or "dtlController" in url.lower() or "15BM" in url:
                try:
                    data = await response.json()
                    captured_detail_data = data
                    print(f"Captured detail XHR!")
                except:
                    pass
        
        page.on("response", handle_response)
        
        # Navigate to search page
        print("1. Navigating to search page...")
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)
        
        # Trigger search
        print("2. Triggering search...")
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
        await asyncio.sleep(3)
        
        # Find and double-click on a result row to open detail
        print("3. Double-clicking first result to open detail...")
        
        try:
            # WebSquare grids usually respond to double-click for detail view
            await page.dblclick("text=서울특별시 관악구", timeout=5000)
            print("   Double-click executed")
        except Exception as e:
            print(f"   Double-click failed: {e}")
            # Try JavaScript approach
            await page.evaluate("""
            (() => {
                const links = document.querySelectorAll('a[title*="서울"]');
                if (links.length > 0) {
                    links[0].dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));
                }
            })()
            """)
        
        # Wait for detail page
        await asyncio.sleep(5)
        
        # Check if we're on detail page
        print("4. Checking if detail page loaded...")
        
        current_content = await page.evaluate("""
        (() => {
            const result = {
                url: window.location.href,
                title: document.title,
                hasDetailView: false,
                detailData: null
            };
            
            // Check for detail page indicators
            const detailIndicators = ['물건기본사항', '매각물건명세서', '현황조사서', '감정평가서'];
            const pageText = document.body.innerText;
            
            for (const indicator of detailIndicators) {
                if (pageText.includes(indicator)) {
                    result.hasDetailView = true;
                    break;
                }
            }
            
            // If we're on detail page, extract data
            if (result.hasDetailView) {
                // Get all table data
                const tables = document.querySelectorAll('table');
                let tableContents = [];
                for (const table of tables) {
                    if (table.innerText.length > 50) {
                        tableContents.push(table.innerText.substring(0, 1000));
                    }
                }
                result.detailData = {
                    tables: tableContents.slice(0, 5),
                    fullText: pageText.substring(0, 4000)
                };
                
                // Get images
                const imgs = document.querySelectorAll('img');
                result.detailData.images = Array.from(imgs)
                    .map(img => img.src)
                    .filter(src => src.includes('photo') || src.includes('image') || src.includes('pic'))
                    .slice(0, 10);
            }
            
            return result;
        })()
        """)
        
        print(f"   URL: {current_content.get('url', 'N/A')}")
        print(f"   Title: {current_content.get('title', 'N/A')}")
        print(f"   Detail View Detected: {current_content.get('hasDetailView', False)}")
        
        if current_content.get('detailData'):
            print("\n=== DETAIL DATA ===")
            if current_content['detailData'].get('tables'):
                print("Tables found:")
                for i, table in enumerate(current_content['detailData']['tables'][:2]):
                    print(f"Table {i+1}: {table[:500]}...")
        
        if captured_detail_data:
            print("\n=== CAPTURED XHR DETAIL ===")
            print(json.dumps(captured_detail_data, ensure_ascii=False, indent=2)[:2000])
        
        # Keep browser open for a moment to verify
        await asyncio.sleep(3)
        await browser.close()


async def main():
    await fetch_auction_detail_page()


if __name__ == "__main__":
    asyncio.run(main())
