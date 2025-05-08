import os
from PIL import Image

def convert_png_to_webp(root_dir):
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith(".png"):
                png_path = os.path.join(dirpath, filename)
                webp_path = os.path.splitext(png_path)[0] + ".webp"

                try:
                    with Image.open(png_path) as img:
                        img.save(webp_path, format="WEBP", lossless=False, quality=80, method=6)
                        print(f"Convertido: {png_path} -> {webp_path}")
                except Exception as e:
                    print(f"Erro ao converter {png_path}: {e}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    convert_png_to_webp(current_dir)
