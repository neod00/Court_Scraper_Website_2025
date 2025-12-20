
import asyncio
import re
from playwright.async_api import async_playwright

async def test_detail_scraping():
    print("Testing detail page scraping for advanced info...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 1. Access search page
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
        await asyncio.sleep(5)
        
        # 2. Enter detail page (Double click first row)
        # Using the same logic as auction_scraper.py
        await page.evaluate("""
        (() => {
            const links = document.querySelectorAll('a[target="_self"]');
            for (const link of links) {
                if (link.offsetParent !== null && link.title && link.title.length > 5) {
                    link.dispatchEvent(new MouseEvent('dblclick', {
                        bubbles: true, cancelable: true, view: window
                    }));
                    break;
                }
            }
        })()
        """)
        
        print("Waiting for detail page...")
        await asyncio.sleep(8) # Wait enough for XHRs to finish
        
        # 3. Extract information from the detail page tabs/sections
        data = await page.evaluate("""
        (() => {
            const result = {};
            
            // Try to find tenant info (현황조사서 or 매각물건명세서 summary)
            // Note: These are often in hidden layers or nested frames/tables
            const tables = document.querySelectorAll('table');
            result.tables_count = tables.length;
            
            // Get all text to find specific keywords
            const bodyText = document.body.innerText;
            result.has_tenant_keyword = bodyText.includes('임차인') || bodyText.includes('점유');
            result.has_history_keyword = bodyText.includes('유찰') || bodyText.includes('매각');
            
            // Look for PDF/Document links
            const buttons = document.querySelectorAll('button, a');
            result.doc_links = [];
            buttons.forEach(b => {
                const text = b.innerText || b.value || b.title || '';
                if (text.includes('매각물건명세서') || text.includes('현황조사서') || text.includes('감정평가서')) {
                    result.doc_links.push(text.trim());
                }
            });
            
            return result;
        })()
        """)
        
        print(f"Detail Page Analysis: {data}")
        
        # 4. Check if we can find specific document viewing logic
        # Usually, clicking these buttons opens a popup
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_detail_scraping())
