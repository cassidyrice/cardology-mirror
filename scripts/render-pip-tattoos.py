#!/usr/bin/env python3
"""Composite exact French-deck pip layouts onto photoreal skin plates.

Pip geometry is code, not a model guess. Lower-half pips invert the way a
real card does. Courts are a single large suit pip (no face). No extra marks.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PLATES = ROOT / "scripts/tattoo-plates"
OUT = ROOT / "public/tattoos"
MANIFEST = ROOT / "lib/tattoos.json"

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
SUIT_SLUG = {
    "hearts": "hearts",
    "clubs": "clubs",
    "diamonds": "diamonds",
    "spades": "spades",
}
INK = {
    "hearts": (168, 36, 36, 255),
    "diamonds": (168, 36, 36, 255),
    "clubs": (18, 16, 14, 255),
    "spades": (18, 16, 14, 255),
}


def slug_for(rank: str, suit: str) -> str:
    r = RANK_SLUG.get(rank, rank)
    return f"{r}-of-{suit}"


def label_for(rank: str, suit: str) -> str:
    r = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}.get(rank, rank)
    return f"{r} of {suit.capitalize()}"


# French-deck pip centers in a 0–1 card rectangle. `inv` = rotate 180°.
def layout(rank: str) -> list[tuple[float, float, bool, float]]:
    """Return (x, y, inverted, scale). scale 1.0 is a number-card pip."""
    L, R, C = 0.28, 0.72, 0.50
    T, M, B = 0.16, 0.50, 0.84
    if rank == "A" or rank in "JQK":
        return [(C, M, False, 2.15 if rank == "A" else 1.85)]
    if rank == "2":
        return [(C, T, False, 1.0), (C, B, True, 1.0)]
    if rank == "3":
        return [(C, T, False, 1.0), (C, M, False, 1.0), (C, B, True, 1.0)]
    if rank == "4":
        return [
            (L, T, False, 1.0), (R, T, False, 1.0),
            (L, B, True, 1.0), (R, B, True, 1.0),
        ]
    if rank == "5":
        return layout("4") + [(C, M, False, 1.0)]
    if rank == "6":
        return [
            (L, T, False, 1.0), (R, T, False, 1.0),
            (L, M, False, 1.0), (R, M, False, 1.0),
            (L, B, True, 1.0), (R, B, True, 1.0),
        ]
    if rank == "7":
        return layout("6") + [(C, 0.33, False, 1.0)]
    if rank == "8":
        return layout("6") + [(C, 0.33, False, 1.0), (C, 0.67, True, 1.0)]
    if rank == "9":
        ys = [0.16, 0.37, 0.63, 0.84]
        inv = [False, False, True, True]
        pts = []
        for y, i in zip(ys, inv):
            pts.append((L, y, i, 1.0))
            pts.append((R, y, i, 1.0))
        pts.append((C, M, False, 1.0))
        return pts
    if rank == "10":
        ys = [0.14, 0.35, 0.65, 0.86]
        inv = [False, False, True, True]
        pts = []
        for y, i in zip(ys, inv):
            pts.append((L, y, i, 1.0))
            pts.append((R, y, i, 1.0))
        pts.append((C, 0.27, False, 1.0))
        pts.append((C, 0.73, True, 1.0))
        return pts
    raise ValueError(rank)


def _rot(pts, cx, cy, ang):
    s, c = math.sin(ang), math.cos(ang)
    out = []
    for x, y in pts:
        dx, dy = x - cx, y - cy
        out.append((cx + dx * c - dy * s, cy + dx * s + dy * c))
    return out


def draw_heart(d: ImageDraw.ImageDraw, cx, cy, s, fill, inv=False):
    # Point down if inv else point down is standard? Standard heart: dent top, point bottom.
    ang = math.pi if inv else 0.0
    # Build a unit heart around (0,0), point at +y (down in image coords).
    w, h = s * 0.92, s
    pts = []
    for i in range(64):
        t = i / 63 * 2 * math.pi
        # Classic parametric heart, then flip so point is down.
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((x / 18.0 * w, y / 18.0 * h))
    pts = [(cx + x, cy + y) for x, y in pts]
    if inv:
        pts = _rot(pts, cx, cy, math.pi)
    d.polygon(pts, fill=fill)


def draw_diamond(d: ImageDraw.ImageDraw, cx, cy, s, fill, inv=False):
    h, w = s * 1.15, s * 0.78
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    if inv:
        pts = _rot(pts, cx, cy, math.pi)
    d.polygon(pts, fill=fill)


def draw_spade(d: ImageDraw.ImageDraw, cx, cy, s, fill, inv=False):
    # Pointed head, two lower lobes, visible stem — a playing-card spade.
    w, h = s * 0.92, s * 1.05
    pts = []
    for i in range(48):
        t = i / 47
        # Two quadratic sides from the point down to the lobes.
        if t < 0.5:
            u = t * 2
            x = -w / 2 * (1 - (1 - u) ** 2)
            y = -h * 0.48 + h * 0.78 * u
        else:
            u = (t - 0.5) * 2
            x = w / 2 * (1 - u ** 2)
            y = -h * 0.48 + h * 0.78 * (1 - u)
        pts.append((cx + x, cy + y))
    r = s * 0.30
    left = (cx - s * 0.22, cy + s * 0.16)
    right = (cx + s * 0.22, cy + s * 0.16)
    stem = [
        (cx - s * 0.07, cy + s * 0.18),
        (cx + s * 0.07, cy + s * 0.18),
        (cx + s * 0.18, cy + s * 0.52),
        (cx - s * 0.18, cy + s * 0.52),
    ]
    if inv:
        pts = _rot(pts, cx, cy, math.pi)
        left = _rot([left], cx, cy, math.pi)[0]
        right = _rot([right], cx, cy, math.pi)[0]
        stem = _rot(stem, cx, cy, math.pi)
    d.polygon(pts, fill=fill)
    d.ellipse([left[0] - r, left[1] - r, left[0] + r, left[1] + r], fill=fill)
    d.ellipse([right[0] - r, right[1] - r, right[0] + r, right[1] + r], fill=fill)
    d.polygon(stem, fill=fill)


def draw_club(d: ImageDraw.ImageDraw, cx, cy, s, fill, inv=False):
    r = s * 0.30
    lobes = [(0, -s * 0.26), (-s * 0.28, s * 0.12), (s * 0.28, s * 0.12)]
    stem = [
        (cx - s * 0.07, cy + s * 0.10),
        (cx + s * 0.07, cy + s * 0.10),
        (cx + s * 0.17, cy + s * 0.50),
        (cx - s * 0.17, cy + s * 0.50),
    ]
    if inv:
        lobes = [(-x, -y) for x, y in lobes]
        stem = _rot(stem, cx, cy, math.pi)
    for dx, dy in lobes:
        d.ellipse([cx + dx - r, cy + dy - r, cx + dx + r, cy + dy + r], fill=fill)
    # Fill the hole where the three lobes meet.
    d.ellipse([cx - r * 0.55, cy - r * 0.35, cx + r * 0.55, cy + r * 0.55], fill=fill)
    d.polygon(stem, fill=fill)


DRAW = {
    "hearts": draw_heart,
    "diamonds": draw_diamond,
    "spades": draw_spade,
    "clubs": draw_club,
}


def render_pips(rank: str, suit: str, field_w: int, field_h: int) -> Image.Image:
    img = Image.new("RGBA", (field_w, field_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fill = INK[suit]
    court = rank in ("A", "J", "Q", "K")
    base = min(field_w, field_h) * (0.28 if court else 0.145)
    for x, y, inv, sc in layout(rank):
        DRAW[suit](d, x * field_w, y * field_h, base * sc, fill, inv)
    return img


def composite(plate: Image.Image, pips: Image.Image, body: str) -> Image.Image:
    from PIL import ImageChops

    pw, ph = plate.size
    # Wrist and hand need a smaller field so pips sit on the patch of skin, not the palm.
    frac = 0.38 if body in ("inner-wrist", "back-of-hand") else 0.52
    target_w = int(pw * frac)
    target_h = int(target_w * 1.42)
    pips = pips.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pips = pips.filter(ImageFilter.GaussianBlur(radius=0.7))
    ox = (pw - target_w) // 2
    oy = int(ph * (0.34 if body == "inner-wrist" else 0.24))
    # Multiply: ink darkens existing skin texture instead of sitting on top.
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
            rows.append(
                {
                    "slug": slug_for(rank, suit),
                    "label": label_for(rank, suit),
                    "rank": rank,
                    "suit": suit,
                    "body": body,
                    "bodyLabel": BODY_LABEL[body],
                    "image": f"/tattoos/{slug_for(rank, suit)}.jpg",
                    "pipCount": 1 if rank in ("A", "J", "Q", "K") else int(rank),
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
        # Field resolution independent of plate so pip edges stay clean.
        pips = render_pips(row["rank"], row["suit"], 900, 1300)
        out = composite(plate, pips, row["body"])
        dest = OUT / f"{row['slug']}.jpg"
        out.save(dest, "JPEG", quality=88, optimize=True)
        print(f"wrote {dest.name}  {row['pipCount']} {row['suit']}  on {row['body']}")


if __name__ == "__main__":
    main()
