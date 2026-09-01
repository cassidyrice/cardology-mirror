#!/usr/bin/env python3
"""Generate static Open Graph images (1200x630) for Card Blueprints.

Outputs:
  public/og/default.png          - site-wide fallback share image
  public/og/<card-slug>.png      - one per birth card (52 total)

Brand palette: Obsidian #0F0E0D, Antique Gold #B8924D, Bone #F2EDE3.
Fonts: Instrument Serif (display), Geist Mono (eyebrow). Pass font paths
via INSTRUMENT_SERIF / GEIST_MONO env vars; falls back to DejaVu.

Run from repo root:  python3 scripts/generate_og_images.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
OBSIDIAN = (15, 14, 13)
GOLD = (184, 146, 77)
BONE = (242, 237, 227)
RED = (203, 90, 70)      # hearts/diamonds glyph tone on dark
MIST = (171, 165, 153)

SERIF = os.environ.get("INSTRUMENT_SERIF", "/tmp/fonts/InstrumentSerif.ttf")
MONO = os.environ.get("GEIST_MONO", "/tmp/fonts/GeistMono.ttf")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "og")

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
RANK_NAME = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}
SUITS = [("hearts", "\u2665"), ("clubs", "\u2663"), ("diamonds", "\u2666"), ("spades", "\u2660")]

# Suit-glyph font: first existing candidate (Linux CI, then macOS), matching
# scripts/generate_pinterest_pins.py so both renderers run on either OS.
GLYPH_CANDIDATES = [
    os.environ.get("GLYPH_FONT", ""),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Apple Symbols.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]
GLYPH_FONT = next(p for p in GLYPH_CANDIDATES if p and os.path.exists(p))


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", size)


def base_canvas():
    img = Image.new("RGB", (W, H), OBSIDIAN)
    d = ImageDraw.Draw(img)
    # subtle gold ring motif, offset right
    for r, alpha in [(420, 26), (330, 34), (240, 42)]:
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring)
        rd.ellipse([W - 160 - r, H // 2 - r, W - 160 + r, H // 2 + r],
                   outline=GOLD + (alpha,), width=2)
        img.paste(Image.alpha_composite(img.convert("RGBA"), ring).convert("RGB"), (0, 0))
        d = ImageDraw.Draw(img)
    # baseline rule
    d.line([(72, H - 96), (W - 72, H - 96)], fill=GOLD + (60,) if False else (60, 50, 36), width=2)
    return img, d


def footer(d):
    d.text((72, H - 78), "CARDBLUEPRINTS.COM", font=font(MONO, 26), fill=GOLD)
    d.text((W - 72, H - 78), "A MIRROR, NOT A FORECAST", font=font(MONO, 26), fill=MIST, anchor="ra")


def default_image():
    img, d = base_canvas()
    d.text((72, 150), "CARD BLUEPRINTS", font=font(MONO, 30), fill=GOLD)
    d.text((66, 210), "Your birth card,", font=font(SERIF, 96), fill=BONE)
    d.text((66, 318), "as a mirror.", font=font(SERIF, 96), fill=BONE)
    d.text((72, 460), "52 cards. One deterministic system. Same birthday, same card.",
           font=font(MONO, 28), fill=MIST)
    footer(d)
    img.save(os.path.join(OUT, "default.png"), optimize=True)


# --- Warm-paper card style (matches og/birth-card-calculator.png and the
# --- page OGs from scripts/generate_page_og_images.py): the actual card face
# --- from public/share-cards/faces on paper, copy on the right.
PAPER = (245, 239, 228)
INK = (43, 32, 24)
INK_SOFT = (90, 78, 64)
OXBLOOD = (142, 50, 31)
BAR_H = 22
FACES = os.path.join(os.path.dirname(__file__), "..", "public", "share-cards", "faces")


def paper_canvas():
    img = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, BAR_H], fill=OXBLOOD)
    d.rectangle([0, H - BAR_H, W, H], fill=OXBLOOD)
    return img


def paste_face(canvas, slug, center, height, angle):
    face = Image.open(os.path.join(FACES, f"{slug}.png")).convert("RGBA")
    w = round(face.width * height / face.height)
    face = face.resize((w, height), Image.LANCZOS)
    rot = face.rotate(angle, expand=True, resample=Image.BICUBIC)
    alpha = rot.split()[3].point(lambda a: min(a, 70))
    shadow = Image.new("RGBA", rot.size, (20, 17, 13, 255))
    shadow.putalpha(alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    x = center[0] - rot.width // 2
    y = center[1] - rot.height // 2
    canvas.alpha_composite(shadow, (x + 8, y + 12))
    canvas.alpha_composite(rot, (x, y))


def card_image(rank, suit, glyph):
    rank_word = RANK_NAME.get(rank, rank)
    slug = f"{rank_word.lower() if rank in RANK_NAME else rank}-of-{suit}"

    img = paper_canvas()
    paste_face(img, slug, (300, 315), 460, 8)

    d = ImageDraw.Draw(img)
    tx, y = 620, 190
    d.text((tx, y), "CARD BLUEPRINTS  ·  BIRTH CARD", font=font(SERIF, 32), fill=OXBLOOD)
    y += 52
    tf = font(SERIF, 92)
    d.text((tx, y), rank_word, font=tf, fill=INK)
    y += 98
    d.text((tx, y), f"of {suit.capitalize()}", font=tf, fill=INK)
    y += 128
    d.text((tx, y), "Meaning, love, money, shadow", font=font(SERIF, 31), fill=INK_SOFT)
    y += 42
    d.text((tx, y), "& the birth dates that carry it", font=font(SERIF, 31), fill=INK_SOFT)
    img.convert("RGB").save(os.path.join(OUT, f"{slug}.png"), optimize=True)


def joker_image():
    img = paper_canvas()
    paste_face(img, "joker", (300, 315), 460, 8)
    d = ImageDraw.Draw(img)
    tx, y = 620, 190
    d.text((tx, y), "CARD BLUEPRINTS  ·  BIRTH CARD", font=font(SERIF, 32), fill=OXBLOOD)
    y += 52
    tf = font(SERIF, 92)
    d.text((tx, y), "The Joker", font=tf, fill=INK)
    y += 128
    d.text((tx, y), "December 31 — the one birthday", font=font(SERIF, 31), fill=INK_SOFT)
    y += 42
    d.text((tx, y), "outside the 52-card map", font=font(SERIF, 31), fill=INK_SOFT)
    img.convert("RGB").save(os.path.join(OUT, "joker.png"), optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    default_image()
    joker_image()
    for suit, glyph in SUITS:
        for rank in RANKS:
            card_image(rank, suit, glyph)
    n = len(os.listdir(OUT))
    print(f"wrote {n} images to {OUT}")


if __name__ == "__main__":
    main()
