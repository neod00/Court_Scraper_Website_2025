"""
Image Extractor - Extracts Base64 images from court auction detail pages
and uploads them to Supabase Storage.
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


async def extract_image_from_detail(page, case_no: str) -> str | None:
    """
    Extract the first property image from the current detail page.
    Returns the base64 data URI or None if not found.
    """
    try:
        # Wait for images to load
        await asyncio.sleep(2)
        
        # Try to extract base64 image from the photo carousel
        image_data = await page.evaluate("""
        (() => {
            // Look for the main image container
            const imgContainers = document.querySelectorAll('[id*="imgPopup"] img, [id*="pic_"] img');
            for (const img of imgContainers) {
                if (img.src && img.src.startsWith('data:image')) {
                    return img.src;
                }
            }
            
            // Fallback: look for any base64 image
            const allImages = document.querySelectorAll('img');
            for (const img of allImages) {
                if (img.src && img.src.startsWith('data:image') && img.src.length > 1000) {
                    return img.src;
                }
            }
            
            return null;
        })()
        """)
        
        return image_data
    except Exception as e:
        print(f"Error extracting image for {case_no}: {e}")
        return None


def upload_base64_to_storage(base64_data: str, filename: str) -> str | None:
    """
    Upload a base64 image to Supabase Storage and return the public URL.
    """
    try:
        # Parse the base64 data URI
        # Format: data:image/png;base64,XXXX...
        match = re.match(r'data:image/(\w+);base64,(.+)', base64_data)
        if not match:
            print(f"Invalid base64 data format for {filename}")
            return None
        
        image_format = match.group(1)  # png, jpeg, etc.
        base64_content = match.group(2)
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_content)
        
        # Create filename with extension
        full_filename = f"{filename}.{image_format}"
        
        # Upload to Supabase Storage
        result = supabase.storage.from_(STORAGE_BUCKET).upload(
            path=full_filename,
            file=image_bytes,
            file_options={"content-type": f"image/{image_format}", "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(full_filename)
        print(f"Uploaded: {full_filename} -> {public_url[:60]}...")
        
        return public_url
        
    except Exception as e:
        print(f"Error uploading image {filename}: {e}")
        return None


async def test_image_extraction():
    """Test extracting and uploading one image."""
    print("Starting image extraction test...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Navigate to search page
        print("1. Navigating to search page...")
        await page.goto("https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml")
        await page.wait_for_selector("#mf_wfm_mainFrame_btn_gdsDtlSrch", timeout=30000)
        
        # Trigger search
        print("2. Triggering search...")
        await page.click("#mf_wfm_mainFrame_btn_gdsDtlSrch")
        await asyncio.sleep(3)
        
        # Double-click first result to open detail
        print("3. Opening detail page...")
        await page.evaluate("""
        (() => {
            const links = document.querySelectorAll('a[title*="서울"], a[title*="경기"]');
            for (const link of links) {
                if (link.offsetParent !== null) {
                    link.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));
                    return true;
                }
            }
            return false;
        })()
        """)
        await asyncio.sleep(4)
        
        # Extract image
        print("4. Extracting image...")
        image_data = await extract_image_from_detail(page, "test_case")
        
        if image_data:
            print(f"   Image found! Data length: {len(image_data)} chars")
            print(f"   First 100 chars: {image_data[:100]}...")
            
            # Test upload (if storage bucket exists)
            try:
                filename = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                url = upload_base64_to_storage(image_data, filename)
                if url:
                    print(f"\n   ✅ Upload successful!")
                    print(f"   Public URL: {url}")
            except Exception as e:
                print(f"   Upload failed (bucket may not exist): {e}")
        else:
            print("   No image found on detail page")
        
        await browser.close()


if __name__ == "__main__":
    asyncio.run(test_image_extraction())
