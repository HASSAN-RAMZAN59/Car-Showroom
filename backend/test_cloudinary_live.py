import asyncio
import io
from PIL import Image, ImageDraw
from app.core.cloudinary import upload_file_to_cloudinary

async def test_cloudinary_real_image():
    print("Generating valid test image and uploading to Cloudinary...")
    # Create a real 200x200 red image using PIL
    img = Image.new('RGB', (200, 200), color=(37, 99, 235))
    d = ImageDraw.Draw(img)
    d.text((20, 90), "SK MOTORS TEST", fill=(255, 255, 255))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    url = await upload_file_to_cloudinary(img_bytes, folder="cars/photos")
    print("\n==================================================")
    print("[SUCCESS] CLOUDINARY UPLOAD SUCCESSFUL & LIVE!")
    print(f" Uploaded Secure Image URL: {url}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_cloudinary_real_image())
