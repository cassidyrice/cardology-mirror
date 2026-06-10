#!/usr/bin/env python3
"""Generate static Open Graph images (1200x630) for Cardology Pro.

Outputs:
  public/og/default.png          - site-wide fallback share image
  public/og/<card-slug>.png      - one per birth card (52 total)

Brand palette: Obsidian #0F0E0D, Antique Gold #B8924D, Bone #F2EDE3.
Fonts: Instrument Serif (display), Geist Mono (eyebrow). Pass font paths
via INSTRUMENT_SERIF / GEIST_MONO env vars; falls back to DejaVu.

Run from repo root:  python3 scripts/generate_og_images.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

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
    d.text((72, H - 78), "CARDOLOGYPRO.COM", font=font(MONO, 26), fill=GOLD)
    d.text((W - 72, H - 78), "A MIRROR, NOT A FORECAST", font=font(MONO, 26), fill=MIST, anchor="ra")


def default_image():
    img, d = base_canvas()
    d.text((72, 150), "CARDOLOGY PRO", font=font(MONO, 30), fill=GOLD)
    d.text((66, 210), "Your birth card,", font=font(SERIF, 96), fill=BONE)
    d.text((66, 318), "as a mirror.", font=font(SERIF, 96), fill=BONE)
    d.text((72, 460), "52 cards. One deterministic system. Same birthday, same card.",
           font=font(MONO, 28), fill=MIST)
    footer(d)
    img.save(os.path.join(OUT, "default.png"), optimize=True)


def card_image(rank, suit, glyph):
    img, d = base_canvas()
    is_red = suit in ("hearts", "diamonds")
    glyph_color = RED if is_red else BONE
    rank_word = RANK_NAME.get(rank, rank)
    label = f"{rank_word} of {suit.capitalize()}"
    slug = f"{rank_word.lower() if rank in RANK_NAME else rank}-of-{suit}"

    # big glyph card panel on the right
    px, py, pw, ph = W - 420, 110, 300, 410
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=28,
                        fill=(22, 20, 18), outline=GOLD, width=2)
    glyph_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 130)
    rank_font = font(SERIF, 150)
    rw = d.textlength(rank, font=rank_font)
    gw = d.textlength(glyph, font=glyph_font)
    total = rw + 14 + gw
    x0 = px + pw / 2 - total / 2
    cy = py + ph / 2 - 30
    d.text((x0, cy), rank, font=rank_font, fill=glyph_color, anchor="lm")
    d.text((x0 + rw + 14, cy + 6), glyph, font=glyph_font, fill=glyph_color, anchor="lm")
    d.text((px + pw / 2, py + ph - 64), "BIRTH CARD", font=font(MONO, 22),
           fill=GOLD, anchor="mm")

    d.text((72, 150), "CARDOLOGY PRO  ·  BIRTH CARD", font=font(MONO, 28), fill=GOLD)
    # title wraps onto two lines if needed
    f1 = font(SERIF, 88)
    if d.textlength(label, font=f1) > 620:
        f1 = font(SERIF, 72)
    d.text((66, 220), label, font=f1, fill=BONE)
    d.text((72, 350), "Meaning, strengths, shadow,", font=font(SERIF, 48), fill=MIST)
    d.text((72, 410), "relationships, and birth dates.", font=font(SERIF, 48), fill=MIST)
    footer(d)
    img.save(os.path.join(OUT, f"{slug}.png"), optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    default_image()
    for suit, glyph in SUITS:
        for rank in RANKS:
            card_image(rank, suit, glyph)
    n = len(os.listdir(OUT))
    print(f"wrote {n} images to {OUT}")


if __name__ == "__main__":
    main()
