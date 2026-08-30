#!/usr/bin/env python3
"""Generate FINAL share-card templates + mute composite samples.

Clean premium tighten: more card, quiet type, fewer overlays.
Plain-neutral field + photo-real card faces (Cass veto: no ornate chrome).

Outputs:
  public/share-cards/01-birth-result-template.png
  public/share-cards/02-compat-duel-template.png
  public/share-cards/samples/birth-8-of-diamonds.png
  public/share-cards/samples/compat-queen-diamonds-ace-hearts.png

Locks:
  - watermark cardblueprints.com only text on template (quiet)
  - flat neutral bg (~#ebe7e0); templates almost flat — no baked shadow blobs
  - NO dashed card-slot guides / name-band dashes on FINAL templates
  - NO ornate gold frames / sunbursts / filigree
  - Life Path seats at measured circle centers (layout.json); thin/light rings
  - Sample labels are card names only (no price / banned words)
  - Joker never silent K♠ (samples use real cards only)

Run from repo root:  python3 scripts/generate_share_card_templates.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "share-cards"
SAMPLES = OUT / "samples"
LAYOUT_PATH = ROOT / "lib" / "share-cards" / "layout.json"
HERMES = Path("/Users/main/Desktop/hermes-outputs/cardblueprints/share-cards")

W, H = 1080, 1920
# Soft warm gray — plain neutral field
FIELD = (0xEB, 0xE7, 0xE0)
INK = (0x2A, 0x26, 0x22)
BAND_INK = (0x6A, 0x64, 0x5C)  # muted charcoal — quiet type
# Photo-real card stock
CARD_FACE_BG = (0xFF, 0xFE, 0xF9)
CARD_EDGE = (0x2C, 0x2A, 0x28)
# Standard playing-card red / black
RED = (0xC4, 0x1E, 0x3A)
BLACK = (0x1A, 0x1A, 0x1A)
# Subtle neutral chrome (not gold)
NEUTRAL_RING = (0xD8, 0xD2, 0xC8)  # thinner/lighter seat rings
WATERMARK = "cardblueprints.com"

SUIT_MAP = {"♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades"}
GLYPH = {"hearts": "♥", "diamonds": "♦", "clubs": "♣", "spades": "♠"}
RANK_WORD = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}

# Canonical pip layout from components/cards/CardFace.tsx
COL_X = (0.27, 0.50, 0.73)
PIPS: dict[str, list[tuple[int, float]]] = {
    "2": [(1, 0.18), (1, 0.82)],
    "3": [(1, 0.18), (1, 0.50), (1, 0.82)],
    "4": [(0, 0.18), (2, 0.18), (0, 0.82), (2, 0.82)],
    "5": [(0, 0.18), (2, 0.18), (1, 0.50), (0, 0.82), (2, 0.82)],
    "6": [(0, 0.18), (2, 0.18), (0, 0.50), (2, 0.50), (0, 0.82), (2, 0.82)],
    "7": [(0, 0.18), (2, 0.18), (1, 0.34), (0, 0.50), (2, 0.50), (0, 0.82), (2, 0.82)],
    "8": [
        (0, 0.18),
        (2, 0.18),
        (1, 0.34),
        (0, 0.50),
        (2, 0.50),
        (1, 0.66),
        (0, 0.82),
        (2, 0.82),
    ],
    "9": [
        (0, 0.18),
        (2, 0.18),
        (0, 0.39),
        (2, 0.39),
        (1, 0.50),
        (0, 0.61),
        (2, 0.61),
        (0, 0.82),
        (2, 0.82),
    ],
    "10": [
        (0, 0.18),
        (2, 0.18),
        (1, 0.29),
        (0, 0.39),
        (2, 0.39),
        (0, 0.61),
        (2, 0.61),
        (1, 0.71),
        (0, 0.82),
        (2, 0.82),
    ],
}

FONT_SERIF = "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"
FONT_SERIF_REG = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_FALLBACKS = [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    for candidate in (path, *FONT_FALLBACKS):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def load_layout() -> dict:
    return json.loads(LAYOUT_PATH.read_text())


def draw_watermark(d: ImageDraw.ImageDraw, text: str = WATERMARK):
    f = font(FONT_SERIF_REG, 20)
    # Quieter watermark — smaller + lower-contrast ink
    d.text((W / 2, 1856), text, font=f, fill=(0xA8, 0xA2, 0x9A), anchor="mm")


def base_canvas() -> Image.Image:
    return Image.new("RGB", (W, H), FIELD)


def draw_life_path_rings(d: ImageDraw.ImageDraw, seats: list[dict]):
    """7 thin/light seat rings at measured seatCenters — no connector, no gold."""
    for s in seats:
        r = s["r"]
        d.ellipse(
            [s["x"] - r, s["y"] - r, s["x"] + r, s["y"] + r],
            outline=NEUTRAL_RING,
            width=1,
        )


def make_birth_template(layout: dict) -> Image.Image:
    # Almost flat field + quiet watermark — cards cast their own drop shadow in draw
    img = base_canvas()
    d = ImageDraw.Draw(img)
    draw_watermark(d)
    return img


def make_compat_template(layout: dict) -> Image.Image:
    # Flat field + very subtle seat rings + quiet watermark — no baked card shadows
    img = base_canvas()
    d = ImageDraw.Draw(img)
    seats = layout["compatDuel"]["lifePathBoard"]["seatCenters"]
    draw_life_path_rings(d, seats)
    draw_watermark(d)
    return img


def parse_card(code: str) -> dict | None:
    glyph = next((c for c in code if c in SUIT_MAP), None)
    if not glyph:
        return None
    suit = SUIT_MAP[glyph]
    rank = code.replace(glyph, "").strip()
    rank_word = RANK_WORD.get(rank, rank)
    return {
        "rank": rank,
        "suit": suit,
        "glyph": GLYPH[suit],
        "label": f"{rank_word} of {suit.capitalize()}",
        "color": RED if suit in ("hearts", "diamonds") else BLACK,
    }


def draw_card_face(base: Image.Image, slot: dict, code: str) -> Image.Image:
    """Photo-real face: white stock, thin dark edge, soft drop shadow, pips."""
    x, y, w, h = slot["x"], slot["y"], slot["w"], slot["h"]
    r = int(min(w, h) * 0.055)

    # Drop shadow under the card itself
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [x + 8, y + 12, x + w + 8, y + h + 16],
        radius=r,
        fill=(0, 0, 0, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    out = Image.alpha_composite(base.convert("RGBA"), shadow)

    face = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(face)
    d.rounded_rectangle(
        [x, y, x + w, y + h],
        radius=r,
        fill=CARD_FACE_BG + (255,),
        outline=CARD_EDGE + (255,),
        width=max(2, int(w * 0.008)),
    )

    parsed = parse_card(code)
    if not parsed:
        return Image.alpha_composite(out, face).convert("RGB")

    color = parsed["color"]
    pad = w * 0.075
    corner_size = int(h * 0.085)
    glyph_size = int(h * 0.065)
    cx = x + pad + corner_size * 0.35

    # Upper-left corner
    d.text(
        (cx, y + pad),
        parsed["rank"],
        font=font(FONT_SERIF, corner_size),
        fill=color,
        anchor="ma",
    )
    d.text(
        (cx, y + pad + corner_size * 0.95),
        parsed["glyph"],
        font=font(FONT_SANS, glyph_size),
        fill=color,
        anchor="ma",
    )

    # Center: pips for numbers, large suit for A, large suit+rank for courts
    rank = parsed["rank"]
    if rank == "A":
        d.text(
            (x + w / 2, y + h / 2),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.30)),
            fill=color,
            anchor="mm",
        )
    elif rank in ("J", "Q", "K"):
        d.text(
            (x + w / 2, y + h * 0.40),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.26)),
            fill=color,
            anchor="mm",
        )
        d.text(
            (x + w / 2, y + h * 0.60),
            rank,
            font=font(FONT_SERIF, int(h * 0.13)),
            fill=color,
            anchor="mm",
        )
    elif rank in PIPS:
        pip_size = int(h * (0.085 if rank == "10" else 0.095))
        f_pip = font(FONT_SANS, pip_size)
        for col, yp in PIPS[rank]:
            px = x + w * COL_X[col]
            py = y + h * yp
            d.text((px, py), parsed["glyph"], font=f_pip, fill=color, anchor="mm")
    else:
        d.text(
            (x + w / 2, y + h / 2),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.20)),
            fill=color,
            anchor="mm",
        )

    # Mirrored bottom-right corner (upright for PIL simplicity — draw.ts rotates)
    bx = x + w - pad - corner_size * 0.35
    by = y + h - pad - corner_size - glyph_size * 0.2
    d.text(
        (bx, by - corner_size * 0.95),
        parsed["rank"],
        font=font(FONT_SERIF, corner_size),
        fill=color,
        anchor="ma",
    )
    d.text(
        (bx, by),
        parsed["glyph"],
        font=font(FONT_SANS, glyph_size),
        fill=color,
        anchor="ma",
    )

    return Image.alpha_composite(out, face).convert("RGB")


def draw_joker_face(base: Image.Image, slot: dict) -> Image.Image:
    """Star + JOKER — never silent K♠."""
    x, y, w, h = slot["x"], slot["y"], slot["w"], slot["h"]
    r = int(min(w, h) * 0.055)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [x + 8, y + 12, x + w + 8, y + h + 16],
        radius=r,
        fill=(0, 0, 0, 70),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    out = Image.alpha_composite(base.convert("RGBA"), shadow)
    face = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(face)
    d.rounded_rectangle(
        [x, y, x + w, y + h],
        radius=r,
        fill=CARD_FACE_BG + (255,),
        outline=CARD_EDGE + (255,),
        width=max(2, int(w * 0.008)),
    )
    d.text(
        (x + w / 2, y + h * 0.42),
        "★",
        font=font(FONT_SERIF, int(h * 0.28)),
        fill=RED,
        anchor="mm",
    )
    d.text(
        (x + w / 2, y + h * 0.68),
        "JOKER",
        font=font(FONT_SERIF, int(h * 0.08)),
        fill=BLACK,
        anchor="mm",
    )
    return Image.alpha_composite(out, face).convert("RGB")


def draw_label_in_band(d: ImageDraw.ImageDraw, band: dict, label: str):
    banned = ["cardology", "fate", "destiny", "fortune", "predict"]
    lower = label.lower()
    for word in banned:
        if word in lower:
            raise ValueError(f"banned word in sample label: {label}")
    if "$" in label or "deep dive" in lower:
        raise ValueError(f"price/fate copy in sample label: {label}")
    # Quiet type: regular weight, smaller, soft letter-spacing
    size = int(band["h"] * 0.38)
    while size > 18:
        f = font(FONT_SERIF_REG, size)
        if d.textlength(label, font=f) <= band["w"] * 0.92:
            break
        size -= 2
    f = font(FONT_SERIF_REG, size)
    d.text(
        (band["x"] + band["w"] / 2, band["y"] + band["h"] / 2),
        label,
        font=f,
        fill=BAND_INK,
        anchor="mm",
    )


def draw_life_path_seats(base: Image.Image, seats: list[dict], codes: list[str]) -> Image.Image:
    out = base.convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for seat, code in zip(seats, codes):
        parsed = parse_card(code)
        if not parsed:
            continue
        if code == "Joker":
            continue
        x, y, r = seat["x"], seat["y"], seat["r"]
        rr = r * 0.78
        # Soft mini-shadow
        d.ellipse(
            [x - rr + 2, y - rr + 3, x + rr + 2, y + rr + 3],
            fill=(0, 0, 0, 40),
        )
        d.ellipse(
            [x - rr, y - rr, x + rr, y + rr],
            fill=CARD_FACE_BG + (255,),
            outline=CARD_EDGE + (255,),
            width=2,
        )
        text = f"{parsed['rank']}{parsed['glyph']}"
        d.text(
            (x, y),
            text,
            font=font(FONT_SERIF, int(r * 0.7)),
            fill=parsed["color"],
            anchor="mm",
        )
    return Image.alpha_composite(out, layer).convert("RGB")


def assert_no_gold_in_band(img: Image.Image, band: dict, name: str, tol: int = 18):
    """Bands must stay blank of ornate gold chrome."""
    ornate = (0xC4, 0xA0, 0x5A)  # banned ornate chrome color to detect
    px = img.load()
    gold = 0
    for y in range(band["y"], band["y"] + band["h"]):
        for x in range(band["x"], band["x"] + band["w"]):
            p = px[x, y]
            if (
                abs(p[0] - ornate[0]) <= tol
                and abs(p[1] - ornate[1]) <= tol
                and abs(p[2] - ornate[2]) <= tol
            ):
                gold += 1
    if gold != 0:
        raise SystemExit(f"{name} region still has {gold} gold stroke pixels")
    print(f"OK {name}: zero gold stroke pixels")


def assert_field_is_neutral(img: Image.Image):
    """Corner pixel should be near FIELD (plain warm gray)."""
    px = img.load()
    p = px[20, 20]
    if abs(p[0] - FIELD[0]) > 12 or abs(p[1] - FIELD[1]) > 12 or abs(p[2] - FIELD[2]) > 12:
        raise SystemExit(f"field not neutral: corner={p} expected~{FIELD}")
    print(f"OK field: corner {p} ≈ {FIELD}")


def make_birth_sample(layout: dict) -> Image.Image:
    img = make_birth_template(layout)
    img = draw_card_face(img, layout["birthResult"]["cardSlot"], "8♦")
    d = ImageDraw.Draw(img)
    draw_label_in_band(d, layout["birthResult"]["nameBand"], "8 of Diamonds")
    return img


def make_compat_sample(layout: dict) -> Image.Image:
    img = make_compat_template(layout)
    slots = layout["compatDuel"]["cardSlots"]
    img = draw_card_face(img, slots[0], "Q♦")
    img = draw_card_face(img, slots[1], "A♥")
    d = ImageDraw.Draw(img)
    draw_label_in_band(
        d,
        layout["compatDuel"]["labelBand"],
        "Queen of Diamonds · Ace of Hearts",
    )
    seats = layout["compatDuel"]["lifePathBoard"]["seatCenters"]
    codes = ["2♥", "5♣", "9♦", "Q♠", "3♥", "7♣", "K♦"]
    img = draw_life_path_seats(img, seats, codes)
    return img


def sync_hermes():
    if not HERMES.parent.exists():
        print(f"skip hermes sync: {HERMES.parent} missing")
        return
    HERMES.mkdir(parents=True, exist_ok=True)
    (HERMES / "samples").mkdir(parents=True, exist_ok=True)
    for name in (
        "01-birth-result-template.png",
        "02-compat-duel-template.png",
        "layout.json",
    ):
        src = OUT / name
        if src.exists():
            shutil.copy2(src, HERMES / name)
            print(f"hermes ← {name}")
    for name in (
        "birth-8-of-diamonds.png",
        "compat-queen-diamonds-ace-hearts.png",
    ):
        src = SAMPLES / name
        if src.exists():
            shutil.copy2(src, HERMES / "samples" / name)
            print(f"hermes ← samples/{name}")


def main():
    layout = load_layout()
    OUT.mkdir(parents=True, exist_ok=True)
    SAMPLES.mkdir(parents=True, exist_ok=True)

    # Keep public layout.json in sync with lib source of truth
    shutil.copy2(LAYOUT_PATH, OUT / "layout.json")

    birth = make_birth_template(layout)
    compat = make_compat_template(layout)
    birth_path = OUT / "01-birth-result-template.png"
    compat_path = OUT / "02-compat-duel-template.png"
    birth.save(birth_path, optimize=True)
    compat.save(compat_path, optimize=True)
    print(f"wrote {birth_path.relative_to(ROOT)}")
    print(f"wrote {compat_path.relative_to(ROOT)}")

    assert_field_is_neutral(birth)
    assert_field_is_neutral(compat)
    assert_no_gold_in_band(birth, layout["birthResult"]["nameBand"], "nameBand")
    assert_no_gold_in_band(compat, layout["compatDuel"]["labelBand"], "labelBand")

    birth_sample = make_birth_sample(layout)
    compat_sample = make_compat_sample(layout)
    p1 = SAMPLES / "birth-8-of-diamonds.png"
    p2 = SAMPLES / "compat-queen-diamonds-ace-hearts.png"
    birth_sample.save(p1, optimize=True)
    compat_sample.save(p2, optimize=True)
    print(f"wrote {p1.relative_to(ROOT)}")
    print(f"wrote {p2.relative_to(ROOT)}")

    for sample in (birth_sample, compat_sample):
        ink = 0
        px = sample.load()
        for y in range(1835, 1880):
            for x in range(400, 680):
                # quieter watermark — count any deviation from field
                p = px[x, y]
                if abs(p[0] - FIELD[0]) > 8 or abs(p[1] - FIELD[1]) > 8:
                    ink += 1
        if ink < 12:
            raise SystemExit("sample missing watermark ink near bottom")
    print("OK samples: quiet watermark present; labels locked in draw_label_in_band")

    sync_hermes()


if __name__ == "__main__":
    main()
