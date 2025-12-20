"""
Test: Click on actual data row (skip header)
"""

import asyncio
from playwright.async_api import async_playwright

async def test_click_data_row():
    print("Testing: Click on actual data row...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("1. Navigating...")
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)
        
        print("2. Clicking search...")
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
        await asyncio.sleep(5)  # Wait for grid to fully render
        
        # Find table cell with case number pattern (e.g., "2022타경3289")
        print("3. Finding case number cell...")
        cell = await page.evaluate("""
        (() => {
            const tds = document.querySelectorAll('td');
            for (const td of tds) {
                const text = td.innerText || '';
                // Match case number pattern: year + 타경 + number
                if (/\\d{4}타경\\d+/.test(text)) {
                    const rect = td.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return {
                            text: text.substring(0, 50),
                            x: rect.x + rect.width / 2,
                            y: rect.y + rect.height / 2
                        };
                    }
                }
            }
            return null;
        })()
        """)
        
        if cell:
            print(f"   Found: {cell['text']}")
            print(f"   Position: ({cell['x']:.0f}, {cell['y']:.0f})")
            
            print("\n4. Double-clicking on case number cell...")
            await page.mouse.dblclick(cell['x'], cell['y'])
            
            await asyncio.sleep(6)  # Wait for detail page
            
            # Check page content
            is_detail = await page.evaluate("""
            document.body.innerText.includes('물건기본사항') || 
            document.body.innerText.includes('감정평가액') ||
            document.body.innerText.includes('최저매각가격')
            """)
            print(f"   Detail page loaded: {is_detail}")
            
            if is_detail:
                # Scroll down to photo area
                await page.evaluate("window.scrollBy(0, 1000)")
                await asyncio.sleep(3)
                
                # Get all images
                images = await page.evaluate("""
                (() => {
                    const all = [];
                    const imgs = document.querySelectorAll('img');
                    for (const img of imgs) {
                        if (img.src.length > 100) {
                            all.push({
                                id: img.id,
                                isBase64: img.src.startsWith('data:image'),
                                len: img.src.length,
                                width: img.width,
                                height: img.height
                            });
                        }
                    }
                    return all;
                })()
                """)
                
                print(f"\n5. Found {len(images)} images:")
                for img in images:
                    print(f"   - {img['id'] or 'no-id'}: {img['width']}x{img['height']}, Base64: {img['isBase64']}, Len: {img['len']}")
                
                # Filter base64 images
                base64_imgs = [img for img in images if img['isBase64'] and img['len'] > 5000]
                print(f"\n   Base64 images (>5000 chars): {len(base64_imgs)}")
                
                if base64_imgs:
                    print("\n✅ SUCCESS! Found Base64 images that can be extracted!")
                else:
                    print("\n⚠ No large Base64 images found. Photos may require additional click.")
        else:
            print("   No case number cell found!")
        
        await browser.close()


if __name__ == "__main__":
    asyncio.run(test_click_data_row())
