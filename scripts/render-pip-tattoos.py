#!/usr/bin/env python3
"""Stamp the pip_cards SVG layouts onto photoreal skin.

Source of truth: scripts/pip_cards/*.svg (from pip_cards.zip).
Card rectangle and corner indices are dropped. Only the pip field is inked.
Ace = 1 pip, number cards = face value, J = 11, Q = 12, K = 13.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PLATES = ROOT / "scripts/tattoo-plates"
PIPS = ROOT / "scripts/pip_cards"
OUT = ROOT / "public/tattoos"
MANIFEST = ROOT / "lib/tattoos.json"
FONT = "/System/Library/Fonts/Apple Symbols.ttf"

BODIES = [
    "inner-wrist",
    "back-of-hand",
    "inner-forearm",
    "outer-forearm",
    "upper-arm",
    "calf",
]
BODY_LABEL = {
    "inner-wrist": "inner wrist",
    "back-of-hand": "back of the hand",
    "inner-forearm": "inner forearm",
    "outer-forearm": "outer forearm",
    "upper-arm": "upper arm",
    "calf": "calf",
}
RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = ["hearts", "clubs", "diamonds", "spades"]
RANK_SLUG = {"A": "ace", "J": "jack", "Q": "queen", "K": "king"}
GLYPH = {"hearts": "♥", "diamonds": "♦", "clubs": "♣", "spades": "♠"}
INK = {
    "hearts": (168, 36, 36),
    "diamonds": (168, 36, 36),
    "clubs": (18, 16, 14),
    "spades": (18, 16, 14),
}
CARD_W, CARD_H = 250, 350
PIP_RE = re.compile(
    r'<text x="([^"]+)" y="([^"]+)"\s+'
    r'font-family="[^"]+"\s+'
    r'font-size="([^"]+)"\s+'
    r'fill="[^"]+"\s+'
    r'text-anchor="middle"\s+'
    r'dominant-baseline="central"\s+'
    r'transform="rotate\(([-\d.]+) [^"]+\)">(.)</text>',
    re.MULTILINE,
)


def slug_for(rank: str, suit: str) -> str:
    return f"{RANK_SLUG.get(rank, rank)}-of-{suit}"


def label_for(rank: str, suit: str) -> str:
    word = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}.get(rank, rank)
    return f"{word} of {suit.capitalize()}"


def svg_name(rank: str, suit: str) -> Path:
    return PIPS / f"{rank}_{suit}.svg"


def parse_pips(svg: Path) -> list[tuple[float, float, float, float]]:
    """Return (x, y, font_size, rotation_deg) for pip texts only."""
    text = svg.read_text()
    section = text.split("<!-- Pips -->", 1)[1]
    out = []
    for m in PIP_RE.finditer(section):
        x, y, size, rot, _glyph = m.groups()
        out.append((float(x), float(y), float(size), float(rot)))
    if not out:
        raise SystemExit(f"no pips parsed in {svg.name}")
    return out


def render_pips(rank: str, suit: str, field_w: int, field_h: int) -> Image.Image:
    pts = parse_pips(svg_name(rank, suit))
    img = Image.new("RGBA", (field_w, field_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    sx, sy = field_w / CARD_W, field_h / CARD_H
    color = INK[suit] + (255,)
    glyph = GLYPH[suit]
    for x, y, size, rot in pts:
        px, py = x * sx, y * sy
        # Number-card SVGs use 24px on a 250-wide card; Ace uses 72px. Boost
        # the small ones so they still read after the field is scaled onto skin.
        boost = 2.55 if size <= 30 else 1.45
        font = ImageFont.truetype(FONT, max(16, int(size * sx * boost)))
        # Draw on a tile so we can rotate inverted lower pips.
        tile = Image.new("RGBA", (int(size * sx * 3), int(size * sx * 3)), (0, 0, 0, 0))
        td = ImageDraw.Draw(tile)
        cx, cy = tile.size[0] / 2, tile.size[1] / 2
        td.text((cx, cy), glyph, font=font, fill=color, anchor="mm")
        if rot:
            tile = tile.rotate(-rot, resample=Image.Resampling.BICUBIC, expand=True)
        img.alpha_composite(tile, (int(px - tile.size[0] / 2), int(py - tile.size[1] / 2)))
    return img


def composite(plate: Image.Image, pips: Image.Image, body: str) -> Image.Image:
    pw, ph = plate.size
    frac = 0.42 if body in ("inner-wrist", "back-of-hand") else 0.56
    target_w = int(pw * frac)
    target_h = int(target_w * (CARD_H / CARD_W))
    pips = pips.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pips = pips.filter(ImageFilter.GaussianBlur(radius=0.6))
    ox = (pw - target_w) // 2
    oy = int(ph * (0.32 if body == "inner-wrist" else 0.22))
    ink_on_white = Image.new("RGB", plate.size, (255, 255, 255))
    rgb = Image.new("RGB", pips.size, (255, 255, 255))
    rgb.paste(pips.convert("RGB"), mask=pips.split()[-1])
    ink_on_white.paste(rgb, (ox, oy))
    return ImageChops.multiply(plate.convert("RGB"), ink_on_white)


def catalog() -> list[dict]:
    rows = []
    i = 0
    for suit in SUITS:
        for rank in RANKS:
            body = BODIES[i % len(BODIES)]
            pips = parse_pips(svg_name(rank, suit))
            rows.append(
                {
                    "slug": slug_for(rank, suit),
                    "label": label_for(rank, suit),
                    "rank": rank,
                    "suit": suit,
                    "body": body,
                    "bodyLabel": BODY_LABEL[body],
                    "image": f"/tattoos/{slug_for(rank, suit)}.jpg",
                    "pipCount": len(pips),
                }
            )
            i += 1
    return rows


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = catalog()
    MANIFEST.write_text(json.dumps(rows, indent=2) + "\n")
    for row in rows:
        plate = Image.open(PLATES / f"{row['body']}.jpg").convert("RGB")
        pips = render_pips(row["rank"], row["suit"], 1000, 1400)
        out = composite(plate, pips, row["body"])
        dest = OUT / f"{row['slug']}.jpg"
        out.save(dest, "JPEG", quality=88, optimize=True)
        print(f"wrote {dest.name:22} {row['pipCount']:2} {row['suit']:8} on {row['body']}")


if __name__ == "__main__":
    main()
