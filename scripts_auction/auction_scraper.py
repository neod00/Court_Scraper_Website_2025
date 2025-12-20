"""
Court Auction Scraper - Production Version with Image Extraction
Improved: Better detail page navigation and image extraction
"""

import asyncio
import base64
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

# Supabase Setup
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

STORAGE_BUCKET = "auction-images"


class AuctionScraper:
    def __init__(self):
        self.base_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"

    def parse_price(self, price_str):
        if not price_str:
            return None
        return re.sub(r'[^\d]', '', str(price_str))

    def parse_date(self, date_str):
        if not date_str or len(date_str) < 8:
            return None
        try:
            return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        except:
            return None

    def upload_base64_to_storage(self, base64_data: str, filename: str) -> str | None:
        """Upload a base64 image to Supabase Storage."""
        try:
            match = re.match(r'data:image/(\w+);base64,(.+)', base64_data)
            if not match:
                return None
            
            base64_content = match.group(2)
            image_bytes = base64.b64decode(base64_content)
            full_filename = f"{filename}.jpg"
            
            supabase.storage.from_(STORAGE_BUCKET).upload(
                path=full_filename,
                file=image_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            
            public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(full_filename)
            return public_url
            
        except Exception as e:
            print(f"      Upload error: {e}")
            return None

    def map_to_db_record(self, item, thumbnail_url=None):
        """Map raw API item to database record structure"""
        case_no = item.get('srnSaNo', '')
        col_merge = item.get('colMerge', '')
        site_id = f"auction_{col_merge}" if col_merge else f"auction_{case_no}"
        
        usage = item.get('dspslUsgNm', '물건')
        address = item.get('printSt') or item.get('bgPlaceRdAllAddr', '')
        title = f"[{usage}] {address[:50]}..." if len(address) > 50 else f"[{usage}] {address}"
        
        min_price = item.get('minmaePrice')
        appraised = item.get('gamevalAmt')
        
        yuchal_cnt = item.get('yuchalCnt', '0')
        status = f"유찰 {yuchal_cnt}회" if yuchal_cnt and int(yuchal_cnt) > 0 else "신건"
        
        category = 'real_estate'
        usage_lower = usage.lower() if usage else ''
        if '아파트' in usage_lower:
            category = 'apartment'
        elif '빌라' in usage_lower or '다세대' in usage_lower:
            category = 'villa'
        elif '오피스텔' in usage_lower:
            category = 'officetel'
        elif '상가' in usage_lower or '근린' in usage_lower:
            category = 'commercial'
        
        detail_link = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
        
        building_info = item.get('pjbBuldList') or item.get('convAddr', '')
        auction_location = item.get('maePlace', '')
        longitude = str(item.get('wgs84Xcordi', '')) if item.get('wgs84Xcordi') else None
        latitude = str(item.get('wgs84Ycordi', '')) if item.get('wgs84Ycordi') else None
        note = item.get('mulBigo', '')
        view_count = int(item.get('inqCnt', 0)) if item.get('inqCnt') else None
        result_date = self.parse_date(item.get('maegyuljGiil'))
        
        # Capture LAWD_CD (Region Code for transaction API)
        rd1_cd = item.get('rd1Cd', '')
        rd2_cd = item.get('rd2Cd', '')
        lawd_cd = f"{rd1_cd}{rd2_cd}" if rd1_cd and rd2_cd else None
        
        return {
            "site_id": site_id,
            "title": title,
            "department": item.get('jiwonNm', '') + ' ' + item.get('jpDeptNm', ''),
            "manager": case_no,
            "date_posted": datetime.now().date().isoformat(),
            "detail_link": detail_link,
            "content_text": address,
            "category": category,
            "phone": item.get('tel'),
            "source_type": "auction",
            "minimum_price": self.parse_price(min_price),
            "appraised_price": self.parse_price(appraised),
            "auction_date": self.parse_date(item.get('maeGiil')),
            "address": address,
            "status": status,
            "thumbnail_url": thumbnail_url,
            "building_info": building_info if building_info else None,
            "auction_location": auction_location if auction_location else None,
            "longitude": longitude,
            "latitude": latitude,
            "note": note if note else None,
            "view_count": view_count,
            "result_date": result_date,
            "lawd_cd": lawd_cd
        }

    async def extract_image_from_page(self, page, case_no: str) -> str | None:
        """Extract first Base64 image from the current detail page."""
        try:
            # Wait for potential image elements
            await asyncio.sleep(2)
            
            # Try specific selectors for property images
            image_data = await page.evaluate("""
            (() => {
                // Look for images with specific IDs (property photos)
                const selectors = [
                    'img[id*="reltPic"]',
                    'img[id*="gen_pic"]',  
                    'img[id*="csPic"]'
                ];
                
                for (const selector of selectors) {
                    const imgs = document.querySelectorAll(selector);
                    for (const img of imgs) {
                        if (img.src && img.src.startsWith('data:image') && img.src.length > 5000) {
                            return img.src;
                        }
                    }
                }
                
                // Fallback: any large base64 image
                const allImgs = document.querySelectorAll('img');
                for (const img of allImgs) {
                    if (img.src && img.src.startsWith('data:image') && img.src.length > 10000) {
                        return img.src;
                    }
                }
                
                return null;
            })()
            """)
            
            if image_data:
                safe_case_no = re.sub(r'[^\w\d]', '_', case_no)
                filename = f"{safe_case_no}_{datetime.now().strftime('%Y%m%d')}"
                return self.upload_base64_to_storage(image_data, filename)
            
            return None
        except Exception as e:
            print(f"      Image extraction error: {e}")
            return None

    async def scrape_auctions_with_images(self, max_items=10):
        """Main scraping function with image extraction."""
        print("Starting Auction Scraper with Image Extraction...")
        print(f"Target: {max_items} items\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            # Step 1: Get list of items from XHR
            print("Step 1: Fetching item list from search...")
            await page.goto(self.base_url)
            await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)

            all_items = []
            captured_data = None

            async def handle_response(response):
                nonlocal captured_data
                if "searchControllerMain.on" in response.url:
                    try:
                        json_data = await response.json()
                        captured_data = json_data
                    except:
                        pass

            page.on("response", handle_response)
            await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")

            for _ in range(20):
                if captured_data:
                    break
                await asyncio.sleep(0.5)

            if captured_data:
                data = captured_data.get('data', {})
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        all_items = value[:max_items]
                        break
                print(f"   Found {len(all_items)} items\n")
            else:
                print("   Failed to get items")
                await browser.close()
                return 0

            # Step 2: Process each item
            print("Step 2: Processing items with image extraction...")
            success_count = 0
            image_count = 0

            for idx, item in enumerate(all_items):
                case_no = item.get('srnSaNo', '')
                address_short = (item.get('printSt') or '')[:30]
                print(f"\n[{idx+1}/{len(all_items)}] {case_no} - {address_short}...")
                
                thumbnail_url = None
                
                try:
                    # Click to enter detail page using pixel coordinates (more reliable)
                    await page.goto(self.base_url)
                    await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=15000)
                    await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
                    await asyncio.sleep(3)
                    
                    # Double-click on the row using JavaScript
                    # We'll target the address anchor with matching text
                    target_address = (item.get('printSt') or '')[:20]
                    
                    click_result = await page.evaluate(f"""
                    (() => {{
                        // Find all address links
                        const links = document.querySelectorAll('a[target="_self"]');
                        for (const link of links) {{
                            const text = link.title || link.innerText || '';
                            if (text.includes('{target_address}') && link.offsetParent !== null) {{
                                link.dispatchEvent(new MouseEvent('dblclick', {{
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                }}));
                                return true;
                            }}
                        }}
                        // Fallback: click first visible address link
                        for (const link of links) {{
                            if (link.offsetParent !== null && link.title && link.title.length > 10) {{
                                link.dispatchEvent(new MouseEvent('dblclick', {{
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
                    
                    if click_result:
                        # Wait for detail page to load
                        await asyncio.sleep(5)
                        
                        # Scroll to reveal image section
                        await page.evaluate("window.scrollBy(0, 800)")
                        await asyncio.sleep(2)
                        
                        # Extract image
                        thumbnail_url = await self.extract_image_from_page(page, case_no)
                        
                        if thumbnail_url:
                            print(f"   ✓ Image: {thumbnail_url[:50]}...")
                            image_count += 1
                        else:
                            print(f"   ⚠ No image found")
                    else:
                        print(f"   ⚠ Could not enter detail page")
                        
                except Exception as e:
                    print(f"   ✗ Error: {str(e)[:50]}")

                # Save to database
                try:
                    record = self.map_to_db_record(item, thumbnail_url)
                    result = supabase.table("court_notices").upsert(
                        record, 
                        on_conflict="site_id,source_type"
                    ).execute()
                    
                    if result.data:
                        success_count += 1
                        print(f"   ✓ Saved to DB")
                except Exception as e:
                    print(f"   ✗ DB error: {str(e)[:50]}")

            await browser.close()

        print(f"\n{'='*50}")
        print(f"Scraping Complete!")
        print(f"Items saved: {success_count}/{len(all_items)}")
        print(f"Images extracted: {image_count}")
        return success_count


async def main():
    scraper = AuctionScraper()
    await scraper.scrape_auctions_with_images(max_items=5)


if __name__ == "__main__":
    asyncio.run(main())
