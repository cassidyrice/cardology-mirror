#!/usr/bin/env python3
"""Tall product cover for the Stripe Checkout thumbnail (and anywhere a book-style
cover helps): public/og/products/deep-dive-cover.png, 1000x1400.

Stripe shows product images at roughly 60px tall on the Checkout page, so a
1200x630 OG image collapses into a beige smear. A tall cover with one big card
face and three words survives the shrink. Fonts follow generate_page_og_images.py.

    python3 scripts/generate_deep_dive_cover.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
FACES = os.path.join(ROOT, "public", "share-cards", "faces")
OUT = os.path.join(ROOT, "public", "og", "products", "deep-dive-cover.png")
SERIF = os.environ.get("INSTRUMENT_SERIF", "/tmp/fonts/InstrumentSerif.ttf")
W, H = 1000, 1400
PAPER = (246, 241, 232)
INK = (20, 17, 13)
INK_SOFT = (92, 84, 74)
OXBLOOD = (142, 50, 31)
GOLD = (217, 178, 106)


def font(size):
    return ImageFont.truetype(SERIF, size)


def main():
    img = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 26], fill=OXBLOOD)
    d.rectangle([0, H - 26, W, H], fill=OXBLOOD)
    d.rectangle([40, 40, W - 40, H - 40], outline=GOLD, width=3)

    face = Image.open(os.path.join(FACES, "5-of-diamonds.png")).convert("RGBA")
    fh = 700
    face = face.resize((round(face.width * fh / face.height), fh), Image.LANCZOS)
    x, y = (W - face.width) // 2, 120
    shadow = Image.new("RGBA", face.size, (20, 17, 13, 255))
    shadow.putalpha(face.split()[3].point(lambda a: min(a, 80)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    img.alpha_composite(shadow, (x + 12, y + 18))
    img.alpha_composite(face, (x, y))

    def centered(text, yy, f, fill):
        tw = d.textlength(text, font=f)
        d.text(((W - tw) / 2, yy), text, font=f, fill=fill)

    centered("CARD BLUEPRINTS", 870, font(38), OXBLOOD)
    centered("Birth Card", 930, font(124), INK)
    centered("Deep Dive", 1050, font(124), INK)
    centered("7-page PDF for your card  ·  $9", 1200, font(44), INK_SOFT)
    centered("cardblueprints.com", 1265, font(36), INK_SOFT)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.convert("RGB").save(OUT, optimize=True)
    print("wrote", os.path.relpath(OUT, ROOT), img.size)


if __name__ == "__main__":
    main()
