#!/usr/bin/env python3
"""Generate static Pinterest pin images (1000x1500, 2:3) for Card Blueprints.

Outputs:
  public/pins/<card-slug>.png    - one per birth card (52 total)

Brand palette: Obsidian #0F0E0D, Antique Gold #B8924D, Bone #F2EDE3.
Fonts: Instrument Serif (display), Geist Mono (eyebrow). Pass font paths
via INSTRUMENT_SERIF / GEIST_MONO env vars; falls back to DejaVu. The suit
glyph needs a symbol-capable face: GLYPH_FONT env var, else DejaVu Sans
(Linux) or Apple Symbols (macOS).

Card essence lines come from lib/engine-data/card-descriptions.json --
the same per-card titles the birth-card pages render.

Run from repo root:  python3 scripts/generate_pinterest_pins.py
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1000, 1500
OBSIDIAN = (15, 14, 13)
GOLD = (184, 146, 77)
BONE = (242, 237, 227)
RED = (203, 90, 70)      # hearts/diamonds rank tone on dark
MIST = (171, 165, 153)

SERIF = os.environ.get("INSTRUMENT_SERIF", "/tmp/fonts/InstrumentSerif.ttf")
MONO = os.environ.get("GEIST_MONO", "/tmp/fonts/GeistMono.ttf")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "pins")
DESCRIPTIONS = os.path.join(os.path.dirname(__file__), "..", "lib", "engine-data",
                            "card-descriptions.json")

RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
RANK_NAME = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}
SUITS = [("hearts", "♥"), ("clubs", "♣"), ("diamonds", "♦"), ("spades", "♠")]

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


def fit(path, size, text, d, max_width):
    """Shrink from `size` until `text` fits inside `max_width`."""
    f = font(path, size)
    while size > 24 and d.textlength(text, font=f) > max_width:
        size -= 4
        f = font(path, size)
    return f


def base_canvas():
    img = Image.new("RGB", (W, H), OBSIDIAN)
    # subtle gold ring motif behind the card panel
    for r, alpha in [(430, 26), (340, 34), (250, 42)]:
        ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring)
        rd.ellipse([W // 2 - r, 480 - r, W // 2 + r, 480 + r],
                   outline=GOLD + (alpha,), width=2)
        img = Image.alpha_composite(img.convert("RGBA"), ring).convert("RGB")
    return img, ImageDraw.Draw(img)


def pin_image(rank, suit, glyph, essence):
    img, d = base_canvas()
    is_red = suit in ("hearts", "diamonds")
    rank_color = RED if is_red else BONE
    rank_word = RANK_NAME.get(rank, rank)
    label = f"{rank_word} of {suit.capitalize()}"
    slug = f"{rank_word.lower() if rank in RANK_NAME else rank}-of-{suit}"

    # eyebrow
    d.text((W / 2, 130), "CARD BLUEPRINTS  ·  BIRTH CARD", font=font(MONO, 28),
           fill=GOLD, anchor="mm")

    # card panel, centered
    pw, ph = 380, 470
    px, py = (W - pw) // 2, 245
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=32,
                        fill=(22, 20, 18), outline=GOLD, width=2)
    glyph_font = ImageFont.truetype(GLYPH_FONT, 150)
    rank_font = font(SERIF, 180)
    rw = d.textlength(rank, font=rank_font)
    gw = d.textlength(glyph, font=glyph_font)
    total = rw + 16 + gw
    x0 = px + pw / 2 - total / 2
    cy = py + ph / 2 - 34
    d.text((x0, cy), rank, font=rank_font, fill=rank_color, anchor="lm")
    d.text((x0 + rw + 16, cy + 6), glyph, font=glyph_font, fill=GOLD, anchor="lm")
    d.text((px + pw / 2, py + ph - 68), "BIRTH CARD", font=font(MONO, 24),
           fill=GOLD, anchor="mm")

    # card name, then essence line
    d.text((W / 2, 900), label, font=fit(SERIF, 104, label, d, W - 180),
           fill=BONE, anchor="mm")
    d.text((W / 2, 1010), essence, font=fit(SERIF, 50, essence, d, W - 180),
           fill=MIST, anchor="mm")

    # footer
    d.text((W / 2, 1290), "A MIRROR, NOT A FORECAST", font=font(MONO, 24),
           fill=MIST, anchor="mm")
    d.line([(90, 1340), (W - 90, 1340)], fill=(60, 50, 36), width=2)
    d.text((W / 2, 1400), "CARDBLUEPRINTS.COM", font=font(MONO, 32),
           fill=GOLD, anchor="mm")

    img.save(os.path.join(OUT, f"{slug}.png"), optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(DESCRIPTIONS) as f:
        descriptions = json.load(f)
    for suit, glyph in SUITS:
        for rank in RANKS:
            essence = descriptions[f"{rank}{glyph}"]["title"]
            pin_image(rank, suit, glyph, essence)
    n = len(os.listdir(OUT))
    print(f"wrote {n} images to {OUT}")


if __name__ == "__main__":
    main()
