"""
Auction Detail Fetcher - Server-side proxy to fetch detail from court site
This module provides a function to fetch detailed auction info using Playwright.
"""

import asyncio
import json
import re
from playwright.async_api import async_playwright

async def fetch_auction_detail(srn_sa_no: str, bo_cd: str = "", sa_no: str = "", maemul_ser: str = "1"):
    """
    Fetch detailed auction information by navigating to court site.
    
    Args:
        srn_sa_no: Display case number (e.g., "2022타경3289")
        bo_cd: Court office code (e.g., "B000210", optional)
        sa_no: Internal case number (e.g., "20220130003289", optional)
        maemul_ser: Item sequence (usually "1")
    
    Returns:
        dict: Detailed auction information
    """
    result = {
        "success": False,
        "data": None,
        "error": None
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Navigate to search page
            await page.goto(
                "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml",
                timeout=30000
            )
            await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=15000)
            
            # Parse case number to extract year and number
            # e.g., "2022타경3289" -> year=2022, num=3289
            match = re.match(r'(\d{4})타경(\d+)', srn_sa_no)
            if match:
                year = match.group(1)
                case_num = match.group(2)
            else:
                match = re.match(r'(\d{4})\D+(\d+)', srn_sa_no)
                if match:
                    year = match.group(1)
                    case_num = match.group(2)
                else:
                    result["error"] = f"Invalid case number format: {srn_sa_no}"
                    return result
            
            # Fill in search criteria using JavaScript
            await page.evaluate(f"""
            (() => {{
                // Set year
                const yearSelect = document.getElementById('mf_wfm_mainFrame_sbx_rletCsYear');
                if (yearSelect) {{
                    yearSelect.value = '{year}';
                    yearSelect.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }}
                
                // Set case number
                const caseInput = document.getElementById('mf_wfm_mainFrame_ibx_rletCsNo');
                if (caseInput) {{
                    caseInput.value = '{case_num}';
                    caseInput.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
                
                // Clear date filters
                const startDate = document.getElementById('mf_wfm_mainFrame_cal_rletPerdStr_input');
                const endDate = document.getElementById('mf_wfm_mainFrame_cal_rletPerdEnd_input');
                if (startDate) startDate.value = '';
                if (endDate) endDate.value = '';
            }})()
            """)
            
            # Trigger search
            await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
            await asyncio.sleep(3)
            
            # Click on the result using a more reliable selector
            # Use JavaScript to find and click on the result row
            click_success = await page.evaluate(f"""
            (() => {{
                // Find link with the case number in title or text
                const links = document.querySelectorAll('a[title*="관악"], a[title*="서울"], a[title*="경기"]');
                for (const link of links) {{
                    if (link.offsetParent !== null) {{  // Check if visible
                        link.dispatchEvent(new MouseEvent('dblclick', {{
                            bubbles: true,
                            cancelable: true,
                            view: window
                        }}));
                        return true;
                    }}
                }}
                
                // Alternative: find grid row and double-click
                const rows = document.querySelectorAll('tr[data-index]');
                if (rows.length > 0) {{
                    rows[0].dispatchEvent(new MouseEvent('dblclick', {{
                        bubbles: true,
                        cancelable: true,
                        view: window
                    }}));
                    return true;
                }}
                
                return false;
            }})()
            """)
            
            if not click_success:
                result["error"] = "Could not find clickable result"
                await browser.close()
                return result
            
            await asyncio.sleep(4)
            
            # Extract detail data from page
            detail_data = await page.evaluate("""
            (() => {
                const result = {
                    caseNumber: '',
                    itemNumber: '',
                    itemType: '',
                    appraisedPrice: '',
                    minimumPrice: '',
                    deposit: '',
                    biddingMethod: '',
                    auctionDate: '',
                    auctionLocation: '',
                    address: '',
                    note: '',
                    court: '',
                    department: '',
                    caseReceivedDate: '',
                    auctionStartDate: '',
                    claimAmount: '',
                    distributionDeadline: '',
                    images: [],
                    buildingInfo: '',
                    landInfo: ''
                };
                
                // Get all table text for parsing
                const tables = document.querySelectorAll('table');
                for (const table of tables) {
                    const text = table.innerText;
                    
                    // Parse specific fields
                    if (text.includes('사건번호') && text.includes('물건번호')) {
                        const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const nextLine = lines[i + 1] || '';
                            
                            if (line === '사건번호') result.caseNumber = nextLine;
                            if (line === '물건번호') result.itemNumber = nextLine;
                            if (line === '물건종류') result.itemType = nextLine;
                            if (line === '감정평가액') result.appraisedPrice = nextLine;
                            if (line.includes('최저매각가격')) {
                                // Parse "4,293,000원\\n(858,600원)"
                                const priceMatch = nextLine.match(/([0-9,]+)원/);
                                if (priceMatch) result.minimumPrice = priceMatch[0];
                                const depositMatch = text.match(/\\(([0-9,]+)원\\)/);
                                if (depositMatch) result.deposit = depositMatch[1] + '원';
                            }
                            if (line === '입찰방법') result.biddingMethod = nextLine;
                            if (line === '매각기일') result.auctionDate = nextLine;
                            if (line.includes('소재지')) result.address = nextLine;
                            if (line === '청구금액') result.claimAmount = nextLine;
                            if (line === '경매개시일') result.auctionStartDate = nextLine;
                            if (line === '사건접수') result.caseReceivedDate = nextLine;
                            if (line === '배당요구종기') result.distributionDeadline = nextLine;
                        }
                    }
                    
                    // Get note/특별매각조건
                    if (text.includes('물건비고')) {
                        const noteMatch = text.match(/물건비고[\\s\\S]*?\\n([가-힣0-9%\\s\\.]+특별매각[가-힣0-9%\\s\\.:]*)/);
                        if (noteMatch) result.note = noteMatch[1].trim();
                        if (!result.note) {
                            const altMatch = text.match(/물건비고[\\s\\S]*?\\n\\n([가-힣0-9%\\s\\.\\n]+)/);
                            if (altMatch) result.note = altMatch[1].substring(0, 200).trim();
                        }
                    }
                }
                
                // Parse court and department
                const pageText = document.body.innerText;
                const courtMatch = pageText.match(/(서울[가-힣]+지방법원|[가-힣]+지방법원)/);
                if (courtMatch) result.court = courtMatch[1];
                
                const deptMatch = pageText.match(/경매(\\d+)계/);
                if (deptMatch) result.department = '경매' + deptMatch[1] + '계';
                
                // Get building/land info
                const areaMatch = pageText.match(/\\[집합건물[^\\]]+\\]/);
                if (areaMatch) result.buildingInfo = areaMatch[0];
                
                // Get images (actual property photos from carousel)
                const imgs = document.querySelectorAll('img');
                result.images = Array.from(imgs)
                    .map(img => img.src)
                    .filter(src => 
                        src.includes('/photoView') || 
                        src.includes('/photo/') || 
                        src.includes('/image/')
                    );
                
                return result;
            })()
            """)
            
            result["success"] = True
            result["data"] = detail_data
            
        except Exception as e:
            result["error"] = str(e)
        
        finally:
            await browser.close()
    
    return result


# Test function
async def test():
    print("Testing detail fetcher...")
    detail = await fetch_auction_detail(
        srn_sa_no="2022타경3289",
        bo_cd="B000210",
        sa_no="20220130003289",
        maemul_ser="1"
    )
    
    print("\n=== FETCH RESULT ===")
    print(f"Success: {detail['success']}")
    if detail['error']:
        print(f"Error: {detail['error']}")
    if detail['data']:
        print("\nExtracted Data:")
        for key, value in detail['data'].items():
            if value:
                print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(test())
