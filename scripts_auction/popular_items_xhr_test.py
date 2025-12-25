"""
XHR Interception Test - Popular Auction Items (다수관심물건)
Uses Playwright's Response Interception to capture raw XML/JSON data from WebSquare5.
"""

import asyncio
import json
import re
from playwright.async_api import async_playwright


class PopularItemsXHRTest:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml"
        self.captured_responses = []
    
    def generate_detail_link(self, item: dict) -> str:
        """Generate a detail page link from item data."""
        # Court auction detail pages use specific parameters
        sa_no = item.get('saNo', '')  # Internal case number
        bo_cd = item.get('boCd', '')  # Court code
        maemul_ser = item.get('maemulSer', '1')  # Item sequence
        
        if sa_no and bo_cd:
            # WebSquare detail page URL pattern
            return f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml&saNo={sa_no}&boCd={bo_cd}&maemulSer={maemul_ser}"
        
        # Fallback: use display case number for search-based link
        srn_sa_no = item.get('srnSaNo', '')
        if srn_sa_no:
            return f"https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml&searchKeyword={srn_sa_no}"
        
        return ""
    
    def parse_xml_response(self, xml_text: str) -> list:
        """Parse WebSquare XML response to extract item data."""
        items = []
        
        # WebSquare typically uses <map> or <vector> tags for data
        # Look for repeated data patterns
        
        # Try to find JSON-like data within XML
        json_match = re.search(r'\{[^{}]*"data"[^{}]*\{.*\}.*\}', xml_text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                return data.get('data', {})
            except json.JSONDecodeError:
                pass
        
        # Parse XML structure for <map> elements (WebSquare pattern)
        map_pattern = re.compile(r'<map[^>]*>(.*?)</map>', re.DOTALL)
        for match in map_pattern.finditer(xml_text):
            item = {}
            content = match.group(1)
            
            # Extract key-value pairs from nested <key> elements
            kv_pattern = re.compile(r'<([a-zA-Z_]+)>([^<]*)</\1>')
            for kv_match in kv_pattern.finditer(content):
                key = kv_match.group(1)
                value = kv_match.group(2).strip()
                if value:
                    item[key] = value
            
            if item:
                items.append(item)
        
        return items
    
    def parse_json_response(self, json_text: str) -> list:
        """Parse JSON response to extract item data."""
        try:
            data = json.loads(json_text)
            
            # Debug: Print top-level structure
            if isinstance(data, dict):
                print(f"\n[DEBUG] Top-level keys: {list(data.keys())}")
                
                # WebSquare often uses 'data' containing nested objects
                if 'data' in data:
                    data_section = data['data']
                    if isinstance(data_section, dict):
                        print(f"[DEBUG] data section keys: {list(data_section.keys())}")
                        
                        # Look for arrays in nested 'data' object
                        for key, value in data_section.items():
                            if isinstance(value, list) and len(value) > 0:
                                print(f"[DEBUG] Found array '{key}' with {len(value)} items")
                                return value
                    elif isinstance(data_section, list):
                        return data_section
                
                # Look for array data in common keys
                for key in ['list', 'result', 'items', 'rows']:
                    if key in data and isinstance(data[key], (list, dict)):
                        return data[key] if isinstance(data[key], list) else [data[key]]
                
                # Check for nested data structures at top level
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        print(f"[DEBUG] Found array at top-level '{key}' with {len(value)} items")
                        return value
            
            return data if isinstance(data, list) else [data]
        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON parse error: {e}")
            return []
    
    async def run_test(self):
        """Main test: capture XHR responses from Popular Items page."""
        print("=" * 60)
        print("XHR Interception Test - 다수관심물건 (Popular Auction Items)")
        print("=" * 60)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            captured_data = None
            
            # Set up response interceptor
            async def handle_response(response):
                nonlocal captured_data
                url = response.url
                
                # Capture controller responses (WebSquare data endpoints)
                if any(pattern in url for pattern in [
                    'Controller.on',
                    'controller.on',
                    'searchController',
                    'mjrtyItrt'  # Popular items specific
                ]):
                    try:
                        content_type = response.headers.get('content-type', '')
                        body = await response.text()
                        
                        print(f"\n[CAPTURED] URL: {url[:80]}...")
                        print(f"[CAPTURED] Content-Type: {content_type}")
                        print(f"[CAPTURED] Body Length: {len(body)} chars")
                        
                        self.captured_responses.append({
                            'url': url,
                            'content_type': content_type,
                            'body': body[:5000]  # Truncate for display
                        })
                        
                        # Parse the response
                        if 'json' in content_type or body.strip().startswith('{'):
                            captured_data = self.parse_json_response(body)
                        elif 'xml' in content_type or body.strip().startswith('<'):
                            captured_data = self.parse_xml_response(body)
                        else:
                            # Try JSON first, then XML
                            captured_data = self.parse_json_response(body)
                            if not captured_data:
                                captured_data = self.parse_xml_response(body)
                        
                    except Exception as e:
                        print(f"[ERROR] Failed to capture: {e}")
            
            page.on("response", handle_response)
            
            # Step 1: Navigate to page
            print("\n[STEP 1] Navigating to 다수관심물건 page...")
            await page.goto(self.base_url, timeout=30000)
            await page.wait_for_selector("#mf_wfm_mainFrame_btn_mjrtyItrtSrch", timeout=15000)
            print("[OK] Page loaded")
            
            # Step 2: Click search button
            print("\n[STEP 2] Clicking search button...")
            await page.click("#mf_wfm_mainFrame_btn_mjrtyItrtSrch")
            
            # Wait for XHR responses
            for i in range(15):
                if captured_data:
                    break
                await asyncio.sleep(0.5)
            
            # Additional wait for all responses
            await asyncio.sleep(2)
            
            print(f"\n[STEP 3] Captured {len(self.captured_responses)} XHR responses")
            
            # Process and display results
            if captured_data:
                print("\n")
                print("=" * 60, flush=True)
                print("EXTRACTED DATA", flush=True)
                print("=" * 60, flush=True)
                
                if isinstance(captured_data, list):
                    print(f"Total Items: {len(captured_data)}\n", flush=True)
                    
                    for idx, item in enumerate(captured_data[:5]):  # Show first 5
                        print(f"\n--- Item {idx + 1} ---", flush=True)
                        
                        if isinstance(item, dict):
                            # Display key fields
                            display_fields = [
                                ('srnSaNo', '사건번호'),
                                ('jiwonNm', '법원'),
                                ('dspslUsgNm', '물건용도'),
                                ('printSt', '소재지'),
                                ('minmaePrice', '최저가'),
                                ('gamevalAmt', '감정가'),
                                ('mulBigo', '비고'),
                                ('inqCnt', '관심수'),
                                ('yuchalCnt', '유찰횟수')
                            ]
                            
                            for key, label in display_fields:
                                if key in item and item[key]:
                                    value = str(item[key])[:80]
                                    print(f"  {label}: {value}", flush=True)
                            
                            # Generate and display link
                            link = self.generate_detail_link(item)
                            if link:
                                print(f"  상세링크: {link}", flush=True)
                        else:
                            print(f"  Raw: {str(item)[:200]}", flush=True)
                    
                    if len(captured_data) > 5:
                        print(f"\n... and {len(captured_data) - 5} more items", flush=True)
                
                elif isinstance(captured_data, dict):
                    print("Captured Dict Keys:", list(captured_data.keys())[:10], flush=True)
                    for key, value in list(captured_data.items())[:3]:
                        print(f"  {key}: {str(value)[:100]}", flush=True)
            else:
                print("\n[WARNING] No structured data captured.", flush=True)
                print("Showing raw captured responses:", flush=True)
                for resp in self.captured_responses[:2]:
                    print(f"\n--- Response from {resp['url'][:50]}... ---", flush=True)
                    print(resp['body'][:500], flush=True)
            
            await browser.close()
        
        print("\n" + "=" * 60, flush=True)
        print("Test Complete", flush=True)
        print("=" * 60, flush=True)
        
        # Save results to JSON file
        if captured_data:
            output_file = "popular_items_result.json"
            output_data = []
            
            if isinstance(captured_data, list):
                for item in captured_data:
                    if isinstance(item, dict):
                        processed_item = {
                            '사건번호': item.get('srnSaNo', ''),
                            '법원': item.get('jiwonNm', ''),
                            '물건용도': item.get('dspslUsgNm', ''),
                            '소재지': item.get('printSt', ''),
                            '최저가': item.get('minmaePrice', ''),
                            '감정가': item.get('gamevalAmt', ''),
                            '비고': item.get('mulBigo', ''),
                            '관심수': item.get('inqCnt', ''),
                            '유찰횟수': item.get('yuchalCnt', ''),
                            '상세링크': self.generate_detail_link(item),
                            '_raw': item  # Keep raw data for debugging
                        }
                        output_data.append(processed_item)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n[SAVED] Results saved to: {output_file}", flush=True)
            print(f"[SAVED] Total items: {len(output_data)}", flush=True)
        
        return captured_data


if __name__ == "__main__":
    test = PopularItemsXHRTest()
    asyncio.run(test.run_test())
