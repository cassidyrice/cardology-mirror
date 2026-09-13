#!/usr/bin/env python3
"""Generate per-page Open Graph images (1200x630) for the main SEO pages.

Outputs (public/og/):
  what-is-cardology.png
  cardology-compatibility.png
  birth-card.png
  card-of-the-day.png
  destiny-cards.png
  birth-card/<slug>.png for every card face, including joker

Style matches public/og/birth-card-calculator.png: warm paper ground,
oxblood top/bottom bars, real card faces fanned left, serif copy right.
Fonts: Instrument Serif + Geist Mono (INSTRUMENT_SERIF / GEIST_MONO env
vars, defaulting to /tmp/fonts/*.ttf like generate_og_images.py).

Run from repo root:  python3 scripts/generate_page_og_images.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
PAPER = (245, 239, 228)
INK = (43, 32, 24)
INK_SOFT = (90, 78, 64)
OXBLOOD = (142, 50, 31)
BAR_H = 22

ROOT = os.path.join(os.path.dirname(__file__), "..")
FACES = os.path.join(ROOT, "public", "share-cards", "faces")
OUT = os.path.join(ROOT, "public", "og")
SERIF = os.environ.get("INSTRUMENT_SERIF", "/tmp/fonts/InstrumentSerif.ttf")
MONO = os.environ.get("GEIST_MONO", "/tmp/fonts/GeistMono.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


def load_face(slug, height):
    img = Image.open(os.path.join(FACES, f"{slug}.png")).convert("RGBA")
    w = round(img.width * height / img.height)
    return img.resize((w, height), Image.LANCZOS)


def paste_rotated(canvas, face, center, angle):
    rot = face.rotate(angle, expand=True, resample=Image.BICUBIC)
    # soft drop shadow
    shadow = Image.new("RGBA", rot.size, (0, 0, 0, 0))
    alpha = rot.split()[3].point(lambda a: min(a, 70))
    shadow.putalpha(alpha)
    shadow = Image.new("RGBA", rot.size, (20, 17, 13, 255))
    shadow.putalpha(alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    x = center[0] - rot.width // 2
    y = center[1] - rot.height // 2
    canvas.alpha_composite(shadow, (x + 8, y + 12))
    canvas.alpha_composite(rot, (x, y))


def base():
    img = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, BAR_H], fill=OXBLOOD)
    d.rectangle([0, H - BAR_H, W, H], fill=OXBLOOD)
    return img


def fan(img, slugs, cx=368, cy=330, height=418):
    angles = {1: [0], 2: [-10, 10], 3: [-14, 0, 14]}[len(slugs)]
    offsets = {1: [0], 2: [-95, 95], 3: [-130, 0, 130]}[len(slugs)]
    for slug, ang, off in zip(slugs, angles, offsets):
        paste_rotated(img, load_face(slug, height), (cx + off, cy), -ang)


def copy_block(img, kicker, title_lines, sub, tx=680):
    d = ImageDraw.Draw(img)
    y = 210
    d.text((tx, y), kicker, font=font(SERIF, 34), fill=OXBLOOD)
    y += 52
    tf = font(SERIF, 76)
    for line in title_lines:
        d.text((tx, y), line, font=tf, fill=INK)
        y += 82
    y += 22
    d.text((tx, y), sub, font=font(SERIF, 31), fill=INK_SOFT)


def page(name, slugs, kicker, title_lines, sub, **fan_kw):
    img = base()
    fan(img, slugs, **fan_kw)
    copy_block(img, kicker, title_lines, sub)
    img.convert("RGB").save(os.path.join(OUT, f"{name}.png"), optimize=True)
    print("wrote", name)


RANK_LABELS = {
    "ace": "Ace",
    "jack": "Jack",
    "queen": "Queen",
    "king": "King",
}


def card_label(slug):
    if slug == "joker":
        return "Joker"
    rank, suit = slug.split("-of-")
    return f"{RANK_LABELS.get(rank, rank)} of {suit.title()}"


def birth_card_page(slug):
    """Create the dedicated share image used by an individual card page."""
    img = base()
    face = load_face(slug, 540)
    # Keep the face large and upright on the left, with enough breathing room
    # for the rounded card corners and the page's warm-paper visual language.
    x = 310 - face.width // 2
    y = (H - face.height) // 2
    shadow = Image.new("RGBA", face.size, (20, 17, 13, 255))
    shadow.putalpha(face.split()[3].point(lambda a: min(a, 70)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(shadow, (x + 10, y + 14))
    img.alpha_composite(face, (x, y))
    copy_block(
        img,
        "CARD BLUEPRINTS",
        [card_label(slug), "Meaning"],
        "Cardology Birth Card  ·  cardblueprints.com",
        tx=650,
    )
    path = os.path.join(OUT, "birth-card", f"{slug}.png")
    img.convert("RGB").save(path, optimize=True)
    print("wrote", f"birth-card/{slug}")


def main():
    birth_card_out = os.path.join(OUT, "birth-card")
    os.makedirs(birth_card_out, exist_ok=True)
    for filename in sorted(os.listdir(FACES)):
        if filename.endswith(".png"):
            birth_card_page(os.path.splitext(filename)[0])

    page(
        "what-is-cardology",
        ["queen-of-hearts", "8-of-diamonds", "ace-of-spades"],
        "CARD BLUEPRINTS",
        ["What is", "Cardology?"],
        "One birthday. One card.  ·  Not tarot",
    )
    page(
        "cardology-compatibility",
        ["queen-of-diamonds", "ace-of-hearts"],
        "CARD BLUEPRINTS",
        ["Are your cards", "compatible?"],
        "Free two-birthday calculator",
    )
    page(
        "birth-card",
        ["ace-of-hearts", "ace-of-clubs", "ace-of-spades"],
        "CARD BLUEPRINTS",
        ["All 52", "birth cards"],
        "Meanings, love, money & shadow",
    )
    page(
        "card-of-the-day",
        ["3-of-hearts", "jack-of-clubs", "10-of-diamonds"],
        "CARD BLUEPRINTS",
        ["Card of", "the Day"],
        "Today's playing card, decoded",
    )
    page(
        "destiny-cards",
        ["king-of-spades", "7-of-hearts", "2-of-diamonds"],
        "CARD BLUEPRINTS",
        ["Cards of", "Destiny"],
        "Your birthday maps to one card  ·  Free",
    )
    page(
        "karma-cards",
        ["ace-of-hearts", "3-of-hearts", "ace-of-diamonds"],
        "CARD BLUEPRINTS",
        ["Your two", "karma cards"],
        "Lifetime Gift & Challenge  \u00b7  All 52 birth cards",
    )
    page(
        "karma-reading",
        ["ace-of-hearts", "3-of-hearts", "ace-of-diamonds"],
        "CARD BLUEPRINTS  \u00b7  $20",
        ["Karma Card", "Reading Day"],
        "Sat Sept 5  \u00b7  $20  \u00b7  5 minutes",
    )
    page(
        "playing-card-spreads",
        ["10-of-clubs", "8-of-diamonds", "queen-of-spades"],
        "CARD BLUEPRINTS",
        ["The Playing", "Board"],
        "Two fixed boards  ·  90 yearly spreads",
    )
    # Product OGs (also the schema.org Product images) — public/og/products/
    os.makedirs(os.path.join(OUT, "products"), exist_ok=True)
    page(
        "products/one-question-reading",
        ["8-of-diamonds", "queen-of-spades", "7-of-clubs"],
        "CARD BLUEPRINTS  ·  $47",
        ["One Question", "Reading"],
        "One decision, read from your card and your year",
    )
    # Retired 2026-09-13 (replaced by the $47 One Question Reading); kept so old
    # social previews still resolve.
    page(
        "products/52xseven-blueprint",
        ["8-of-diamonds"],
        "CARD BLUEPRINTS  ·  $19",
        ["The 52xSeven", "Blueprint"],
        "Your whole Cardology year in one place",
    )
    # Retired 2026-09-08 (replaced by the $19 52xSeven Blueprint); kept so old
    # social previews still resolve.
    page(
        "products/blueprint-breakdown-video",
        ["8-of-diamonds"],
        "CARD BLUEPRINTS  ·  $47",
        ["The Blueprint", "Breakdown Video"],
        "5-minute video + Deep Dive + Timing Map",
    )
    # Retired 2026-09-07 ($9 Deep Dive became the bonus inside the $47 video); kept
    # so old social previews still resolve.
    page(
        "products/birth-card-deep-dive",
        ["8-of-diamonds"],
        "CARD BLUEPRINTS  ·  $9",
        ["The Birth Card", "Deep Dive"],
        "Your card + its seven ~13-year chapters",
    )
    page(
        "products/personal-card-blueprint",
        ["queen-of-hearts", "8-of-diamonds", "ace-of-spades"],
        "CARD BLUEPRINTS  ·  $13",
        ["The Personal", "Card Blueprint"],
        "Your whole year in cards, written down",
    )
    page(
        "products/complete-card-blueprint",
        ["ace-of-hearts", "king-of-clubs", "queen-of-diamonds"],
        "CARD BLUEPRINTS  ·  $27",
        ["The Complete", "Card Blueprint"],
        "The full working system, one handbook",
    )
    page(
        "products/analog-algorithm",
        ["10-of-spades", "3-of-diamonds"],
        "CARD BLUEPRINTS  ·  $17",
        ["The Analog", "Algorithm"],
        "The written proof of the 52-card calendar",
    )


if __name__ == "__main__":
    main()
