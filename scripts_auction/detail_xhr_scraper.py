"""
Auction Detail Scraper - Extracts detailed item info via XHR interception
Navigates to detail page and captures all relevant data including document links
"""

import asyncio
import json
import sys
import io
import argparse

# Force UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.async_api import async_playwright


class DetailScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml"
    
    async def scrape_detail(self, sa_no: str, bo_cd: str, maemul_ser: str = "1") -> dict:
        """
        Scrape detail page for a specific auction item.
        
        Args:
            sa_no: Internal case number (e.g., "20230130086838")
            bo_cd: Court code (e.g., "B000250")
            maemul_ser: Item sequence (e.g., "1")
        """
        result = {
            'success': False,
            'data': None,
            'error': None
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            captured_detail = {}
            document_links = {}
            
            # Capture XHR responses for detail data
            async def handle_response(response):
                nonlocal captured_detail
                url = response.url
                
                if 'Controller.on' in url or 'CommonServlet' in url:
                    try:
                        body = await response.text()
                        if body.strip().startswith('{'):
                            data = json.loads(body)
                            if 'data' in data:
                                # Merge all captured data
                                if isinstance(data['data'], dict):
                                    for key, value in data['data'].items():
                                        captured_detail[key] = value
                    except:
                        pass
            
            page.on("response", handle_response)
            
            try:
                # Navigate to search page first
                await page.goto(self.base_url, timeout=30000)
                await page.wait_for_selector("#mf_wfm_mainFrame_btn_mjrtyItrtSrch", timeout=15000)
                
                # Click search to load items
                await page.click("#mf_wfm_mainFrame_btn_mjrtyItrtSrch")
                await asyncio.sleep(3)
                
                # Find and click on the target item by saNo
                clicked = await page.evaluate(f"""
                (() => {{
                    const rows = document.querySelectorAll('tr[data-index], a[title]');
                    for (const row of rows) {{
                        const text = row.innerText || row.title || '';
                        if (row.offsetParent !== null) {{
                            row.dispatchEvent(new MouseEvent('dblclick', {{
                                bubbles: true,
                                cancelable: true,
                                view: window
                            }}));
                            return true;
                        }}
                    }}
                    return false;
                }})()
                """)
                
                await asyncio.sleep(4)
                
                # Extract visible detail data from DOM
                detail_data = await page.evaluate("""
                (() => {
                    const result = {
                        caseNo: '',
                        court: '',
                        department: '',
                        itemType: '',
                        address: '',
                        minPrice: '',
                        appraisalPrice: '',
                        deposit: '',
                        auctionDate: '',
                        auctionLocation: '',
                        resultDate: '',
                        buildingInfo: '',
                        landInfo: '',
                        appraisalSummary: '',
                        remarks: '',
                        saleSpecLink: '',
                        statusReportLink: '',
                        appraisalReportLink: ''
                    };
                    
                    // Get text content from the detail section
                    const pageText = document.body.innerText;
                    
                    // Parse specific fields from tables
                    const tables = document.querySelectorAll('table');
                    for (const table of tables) {
                        const text = table.innerText;
                        const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const nextLine = lines[i + 1] || '';
                            
                            if (line === '사건번호') result.caseNo = nextLine;
                            if (line === '물건종류' || line === '물건용도') result.itemType = nextLine;
                            if (line.includes('감정평가액')) result.appraisalPrice = nextLine;
                            if (line.includes('최저매각가격')) result.minPrice = nextLine;
                            if (line.includes('매수신청보증금')) result.deposit = nextLine;
                            if (line === '매각기일') result.auctionDate = nextLine;
                            if (line.includes('소재지')) result.address = nextLine;
                            if (line === '입찰장소') result.auctionLocation = nextLine;
                        }
                    }
                    
                    // Find appraisal summary (감정평가요항표)
                    const appraisalMatch = pageText.match(/감정평가요항표.*?\\n([\\s\\S]*?)(?=\\n\\n|$)/);
                    if (appraisalMatch) {
                        result.appraisalSummary = appraisalMatch[1].substring(0, 500).trim();
                    }
                    
                    // Find remarks/notes
                    const remarksMatch = pageText.match(/물건비고.*?\\n([\\s\\S]*?)(?=\\n\\n|$)/);
                    if (remarksMatch) {
                        result.remarks = remarksMatch[1].substring(0, 500).trim();
                    }
                    
                    // Get court info
                    const courtMatch = pageText.match(/(서울[가-힣]+지방법원|[가-힣]+지방법원|[가-힣]+지원)/);
                    if (courtMatch) result.court = courtMatch[1];
                    
                    const deptMatch = pageText.match(/경매(\\d+)계/);
                    if (deptMatch) result.department = '경매' + deptMatch[1] + '계';
                    
                    // Get building info
                    const buildingMatch = pageText.match(/\\[집합건물[^\\]]+\\]|\\[건물[^\\]]+\\]/);
                    if (buildingMatch) result.buildingInfo = buildingMatch[0];
                    
                    const landMatch = pageText.match(/\\[토지[^\\]]+\\]/);
                    if (landMatch) result.landInfo = landMatch[0];
                    
                    return result;
                })()
                """)
                
                # Try to get document links by checking button actions
                doc_links = await page.evaluate(f"""
                (() => {{
                    const links = {{}};
                    
                    // Generate document viewer URLs based on known patterns
                    const saNo = '{sa_no}';
                    const boCd = '{bo_cd}';
                    const maemulSer = '{maemul_ser}';
                    
                    // Base viewer URL for court documents
                    const viewerBase = 'https://ecfs.scourt.go.kr/sgvo/websquare/websquare.html?w2xPath=/sgvo/ui/sgvo200/SGVO201M01.xml';
                    
                    // Note: These URLs require proper paramData encoding which is session-specific
                    // For now, store the reference parameters
                    links.saleSpec = {{
                        description: '매각물건명세서',
                        params: {{ saNo, boCd, maemulSer, docType: 'saleSpec' }}
                    }};
                    
                    links.statusReport = {{
                        description: '현황조사서',
                        params: {{ saNo, boCd, maemulSer, docType: 'statusReport' }}
                    }};
                    
                    links.appraisalReport = {{
                        description: '감정평가서',
                        params: {{ saNo, boCd, maemulSer, docType: 'appraisal' }}
                    }};
                    
                    return links;
                }})()
                """)
                
                # Combine all data
                result['success'] = True
                result['data'] = {
                    **detail_data,
                    'documentLinks': doc_links,
                    'capturedXhr': captured_detail,
                    'params': {
                        'saNo': sa_no,
                        'boCd': bo_cd,
                        'maemulSer': maemul_ser
                    }
                }
                
            except Exception as e:
                result['error'] = str(e)
            
            await browser.close()
        
        return result


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--saNo', type=str, required=True, help='Internal case number')
    parser.add_argument('--boCd', type=str, required=True, help='Court code')
    parser.add_argument('--maemulSer', type=str, default='1', help='Item sequence')
    args = parser.parse_args()
    
    scraper = DetailScraper()
    result = await scraper.scrape_detail(args.saNo, args.boCd, args.maemulSer)
    
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
