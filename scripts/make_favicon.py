from PIL import Image
import os

# Use the newly transparent and cropped logo as the source
src_img = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\public\logo.png'
dest_ico = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\favicon.ico'
app_icon = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\icon.png'
app_apple_icon = r'd:\OneDrive\Business\ai automation\court_scraper\Deploy_StreamlitShare\Court_Scraper_Website_2025\src\app\apple-icon.png'

with Image.open(src_img) as img:
    # Ensure RGBA for transparency and Next.js compatibility
    img = img.convert('RGBA')
    
    width, height = img.size
    max_dim = max(width, height)
    
    # Create a new square transparent image
    square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
    
    # Paste the original image into the center
    left = (max_dim - width) // 2
    top = (max_dim - height) // 2
    square_img.paste(img, (left, top))
    
    # Save optimized icons
    square_img.save(dest_ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    
    img_large = square_img.resize((192, 192), Image.Resampling.LANCZOS)
    img_large.save(app_icon, format='PNG')
    
    img_apple = square_img.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save(app_apple_icon, format='PNG')

print('Favicon strictly regenerated from public/logo.png with transparent padding!')
