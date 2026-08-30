#!/usr/bin/env python3
"""Generate FINAL share-card templates + mute composite samples.

Outputs:
  public/share-cards/01-birth-result-template.png
  public/share-cards/02-compat-duel-template.png
  public/share-cards/samples/birth-8-of-diamonds.png
  public/share-cards/samples/compat-queen-diamonds-ace-hearts.png

Locks:
  - paper #efe8d8, gold #c4a05a frame + corner ticks, watermark cardblueprints.com
  - NO name-band / label-band wireframe rectangles on FINAL templates
  - Life Path seats at measured circle centers (not a guessed smile-arc)
  - Sample labels are card names only (no price / banned words)
  - Joker never silent K♠ (samples use real cards only)

Run from repo root:  python3 scripts/generate_share_card_templates.py
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "share-cards"
SAMPLES = OUT / "samples"
LAYOUT_PATH = ROOT / "lib" / "share-cards" / "layout.json"

W, H = 1080, 1920
PAPER = (0xEF, 0xE8, 0xD8)
GOLD = (0xC4, 0xA0, 0x5A)
INK = (0x14, 0x11, 0x0D)
BAND_INK = (0x2A, 0x24, 0x1C)
CARD_FACE_BG = (0xFB, 0xF6, 0xEA)
CARD_FACE_BORDER = (0xC4, 0xA3, 0x5A)
RED = (0x8E, 0x32, 0x1F)
BLACK = INK
WATERMARK = "cardblueprints.com"

FRAME_INSET = 48
TICK_OUT = 18
FRAME_WIDTH = 3
DASH_ON = 15
DASH_OFF = 9

SUIT_MAP = {"♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades"}
GLYPH = {"hearts": "♥", "diamonds": "♦", "clubs": "♣", "spades": "♠"}
RANK_WORD = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}

FONT_SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FONT_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_SERIF_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.truetype(FONT_SANS, size)


def load_layout() -> dict:
    return json.loads(LAYOUT_PATH.read_text())


def dashed_line(d: ImageDraw.ImageDraw, p0, p1, fill=GOLD, width=2):
    x0, y0 = p0
    x1, y1 = p1
    length = math.hypot(x1 - x0, y1 - y0)
    if length == 0:
        return
    dx, dy = (x1 - x0) / length, (y1 - y0) / length
    pos = 0.0
    draw_on = True
    while pos < length:
        seg = DASH_ON if draw_on else DASH_OFF
        end = min(pos + seg, length)
        if draw_on:
            d.line(
                [
                    (x0 + dx * pos, y0 + dy * pos),
                    (x0 + dx * end, y0 + dy * end),
                ],
                fill=fill,
                width=width,
            )
        pos = end
        draw_on = not draw_on


def dashed_rect(d: ImageDraw.ImageDraw, x, y, w, h, fill=GOLD, width=2):
    dashed_line(d, (x, y), (x + w, y), fill=fill, width=width)
    dashed_line(d, (x + w, y), (x + w, y + h), fill=fill, width=width)
    dashed_line(d, (x + w, y + h), (x, y + h), fill=fill, width=width)
    dashed_line(d, (x, y + h), (x, y), fill=fill, width=width)


def draw_frame(d: ImageDraw.ImageDraw):
    """Gold frame with corner ticks matching prior templates."""
    x0 = y0 = FRAME_INSET
    x1 = W - FRAME_INSET
    y1 = H - FRAME_INSET
    d.rectangle([x0, y0, x1, y1], outline=GOLD, width=FRAME_WIDTH)

    # Corner ticks extending outward from frame corners.
    tick = TICK_OUT
    # Top-left
    d.line([(x0, y0 - tick), (x0, y0)], fill=GOLD, width=2)
    d.line([(x0 - tick, y0), (x0, y0)], fill=GOLD, width=2)
    # Top-right
    d.line([(x1, y0 - tick), (x1, y0)], fill=GOLD, width=2)
    d.line([(x1 + tick, y0), (x1, y0)], fill=GOLD, width=2)
    # Bottom-left
    d.line([(x0, y1 + tick), (x0, y1)], fill=GOLD, width=2)
    d.line([(x0 - tick, y1), (x0, y1)], fill=GOLD, width=2)
    # Bottom-right
    d.line([(x1, y1 + tick), (x1, y1)], fill=GOLD, width=2)
    d.line([(x1 + tick, y1), (x1, y1)], fill=GOLD, width=2)


def draw_watermark(d: ImageDraw.ImageDraw, text: str = WATERMARK):
    f = font(FONT_SERIF_REG, 28)
    d.text((W / 2, 1848), text, font=f, fill=INK, anchor="mm")


def base_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    draw_frame(d)
    draw_watermark(d)
    return img, d


def draw_life_path_board(d: ImageDraw.ImageDraw, seats: list[dict]):
    """7 circles + light connectors at measured seatCenters."""
    # Connectors first (behind rings).
    for i in range(len(seats) - 1):
        a, b = seats[i], seats[i + 1]
        d.line([(a["x"], a["y"]), (b["x"], b["y"])], fill=GOLD, width=1)
    for s in seats:
        r = s["r"]
        d.ellipse(
            [s["x"] - r, s["y"] - r, s["x"] + r, s["y"] + r],
            outline=GOLD,
            width=2,
        )


def make_birth_template(layout: dict) -> Image.Image:
    img, d = base_canvas()
    slot = layout["birthResult"]["cardSlot"]
    dashed_rect(d, slot["x"], slot["y"], slot["w"], slot["h"])
    # NO name-band rectangle on FINAL template.
    return img


def make_compat_template(layout: dict) -> Image.Image:
    img, d = base_canvas()
    for slot in layout["compatDuel"]["cardSlots"]:
        dashed_rect(d, slot["x"], slot["y"], slot["w"], slot["h"])
    # NO label-band rectangle on FINAL template.
    seats = layout["compatDuel"]["lifePathBoard"]["seatCenters"]
    draw_life_path_board(d, seats)
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


def rounded_rect(d: ImageDraw.ImageDraw, xy, radius, fill, outline, width=3):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_card_face(d: ImageDraw.ImageDraw, slot: dict, code: str):
    """Match lib/share-cards/draw.ts card-face composition (PIL)."""
    x, y, w, h = slot["x"], slot["y"], slot["w"], slot["h"]
    r = min(w, h) * 0.06
    rounded_rect(
        d,
        [x, y, x + w, y + h],
        radius=int(r),
        fill=CARD_FACE_BG,
        outline=CARD_FACE_BORDER,
        width=max(3, int(w * 0.012)),
    )
    parsed = parse_card(code)
    if not parsed:
        return
    color = parsed["color"]
    pad = w * 0.08
    corner_size = int(h * 0.09)
    glyph_size = int(h * 0.07)
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
        (cx, y + pad + corner_size),
        parsed["glyph"],
        font=font(FONT_SANS, glyph_size),
        fill=color,
        anchor="ma",
    )
    # Center pip / monogram
    if parsed["rank"] == "A":
        d.text(
            (x + w / 2, y + h / 2),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.32)),
            fill=color,
            anchor="mm",
        )
    elif parsed["rank"] in ("J", "Q", "K"):
        d.text(
            (x + w / 2, y + h * 0.42),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.28)),
            fill=color,
            anchor="mm",
        )
        d.text(
            (x + w / 2, y + h * 0.62),
            parsed["rank"],
            font=font(FONT_SERIF, int(h * 0.14)),
            fill=color,
            anchor="mm",
        )
    else:
        d.text(
            (x + w / 2, y + h / 2),
            parsed["glyph"],
            font=font(FONT_SANS, int(h * 0.22)),
            fill=color,
            anchor="mm",
        )
    # Mirrored bottom-right corner (drawn upright for PIL simplicity)
    bx = x + w - pad - corner_size * 0.35
    by = y + h - pad - corner_size - glyph_size
    d.text(
        (bx, by),
        parsed["rank"],
        font=font(FONT_SERIF, corner_size),
        fill=color,
        anchor="ma",
    )
    d.text(
        (bx, by + corner_size),
        parsed["glyph"],
        font=font(FONT_SANS, glyph_size),
        fill=color,
        anchor="ma",
    )


def draw_label_in_band(d: ImageDraw.ImageDraw, band: dict, label: str):
    banned = ["cardology", "fate", "destiny", "fortune", "predict"]
    lower = label.lower()
    for word in banned:
        if word in lower:
            raise ValueError(f"banned word in sample label: {label}")
    if "$" in label or "deep dive" in lower:
        raise ValueError(f"price/fate copy in sample label: {label}")
    size = int(band["h"] * 0.48)
    while size > 22:
        f = font(FONT_SERIF, size)
        if d.textlength(label, font=f) <= band["w"] * 0.92:
            break
        size -= 2
    f = font(FONT_SERIF, size)
    d.text(
        (band["x"] + band["w"] / 2, band["y"] + band["h"] / 2),
        label,
        font=f,
        fill=BAND_INK,
        anchor="mm",
    )


def draw_life_path_seats(d: ImageDraw.ImageDraw, seats: list[dict], codes: list[str]):
    for seat, code in zip(seats, codes):
        parsed = parse_card(code)
        if not parsed:
            continue
        # Never paint silent K♠ for Joker — samples use real seats only.
        if code == "Joker":
            continue
        x, y, r = seat["x"], seat["y"], seat["r"]
        rr = r * 0.78
        d.ellipse(
            [x - rr, y - rr, x + rr, y + rr],
            fill=CARD_FACE_BG,
            outline=CARD_FACE_BORDER,
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


def assert_band_has_no_gold(img: Image.Image, band: dict, name: str, tol: int = 12):
    px = img.load()
    gold = 0
    for y in range(band["y"], band["y"] + band["h"]):
        for x in range(band["x"], band["x"] + band["w"]):
            p = px[x, y]
            if (
                abs(p[0] - GOLD[0]) <= tol
                and abs(p[1] - GOLD[1]) <= tol
                and abs(p[2] - GOLD[2]) <= tol
            ):
                gold += 1
    if gold != 0:
        raise SystemExit(f"{name} region still has {gold} gold stroke pixels")
    print(f"OK {name}: zero gold stroke pixels")


def make_birth_sample(layout: dict) -> Image.Image:
    img = make_birth_template(layout).copy()
    d = ImageDraw.Draw(img)
    draw_card_face(d, layout["birthResult"]["cardSlot"], "8♦")
    draw_label_in_band(d, layout["birthResult"]["nameBand"], "8 of Diamonds")
    return img


def make_compat_sample(layout: dict) -> Image.Image:
    img = make_compat_template(layout).copy()
    d = ImageDraw.Draw(img)
    slots = layout["compatDuel"]["cardSlots"]
    draw_card_face(d, slots[0], "Q♦")
    draw_card_face(d, slots[1], "A♥")
    draw_label_in_band(
        d,
        layout["compatDuel"]["labelBand"],
        "Queen of Diamonds · Ace of Hearts",
    )
    seats = layout["compatDuel"]["lifePathBoard"]["seatCenters"]
    codes = ["2♥", "5♣", "9♦", "Q♠", "3♥", "7♣", "K♦"]
    draw_life_path_seats(d, seats, codes)
    return img


def main():
    layout = load_layout()
    OUT.mkdir(parents=True, exist_ok=True)
    SAMPLES.mkdir(parents=True, exist_ok=True)

    birth = make_birth_template(layout)
    compat = make_compat_template(layout)
    birth_path = OUT / "01-birth-result-template.png"
    compat_path = OUT / "02-compat-duel-template.png"
    birth.save(birth_path, optimize=True)
    compat.save(compat_path, optimize=True)
    print(f"wrote {birth_path.relative_to(ROOT)}")
    print(f"wrote {compat_path.relative_to(ROOT)}")

    assert_band_has_no_gold(birth, layout["birthResult"]["nameBand"], "nameBand")
    assert_band_has_no_gold(compat, layout["compatDuel"]["labelBand"], "labelBand")

    birth_sample = make_birth_sample(layout)
    compat_sample = make_compat_sample(layout)
    p1 = SAMPLES / "birth-8-of-diamonds.png"
    p2 = SAMPLES / "compat-queen-diamonds-ace-hearts.png"
    birth_sample.save(p1, optimize=True)
    compat_sample.save(p2, optimize=True)
    print(f"wrote {p1.relative_to(ROOT)}")
    print(f"wrote {p2.relative_to(ROOT)}")

    # Sample locks: watermark present; no banned tokens in filenames/labels.
    for sample in (birth_sample, compat_sample):
        # watermark ink near bottom center
        dark = 0
        px = sample.load()
        for y in range(1825, 1870):
            for x in range(420, 660):
                if px[x, y][0] < 80:
                    dark += 1
        if dark < 20:
            raise SystemExit("sample missing watermark ink near bottom")
    print("OK samples: watermark present; labels locked in draw_label_in_band")


if __name__ == "__main__":
    main()
