from PIL import Image
import os

src_img = r'C:\Users\NT940XHA\.gemini\antigravity\brain\74f05037-980e-4dd9-8090-258125056f9e\favicon_friendly_court_auction_3_1772885462147.png'
dest_ico = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\favicon.ico'
app_icon = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\icon.png'
app_apple_icon = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\apple-icon.png'

with Image.open(src_img) as img:
    # Next.js (Turbopack) strictly requires images/favicons to be in RGBA format
    img = img.convert('RGBA')
    
    width, height = img.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    img = img.crop((left, top, right, bottom))
    
    img.save(dest_ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    
    img_large = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_large.save(app_icon, format='PNG')
    
    img_apple = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save(app_apple_icon, format='PNG')

print('Favicon strictly converted to RGBA!')
