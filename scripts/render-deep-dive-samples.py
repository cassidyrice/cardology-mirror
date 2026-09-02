#!/usr/bin/env python3
"""Render page 1 of every card-level Deep Dive PDF into a faded sample image.

Output: public/deep-dive/samples/<seo-slug>.jpg (900px wide, top ~62% of page 1,
fading to paper so the page reads as a preview, not the whole page).

Source PDFs: DEEP_DIVE_PDF_DIR (the uploader's local dir) if present, else each
PDF is fetched from R2 (cardblueprints-ebooks/deep-dive/<slug>.pdf) via wrangler
into a cache dir. Run from the repo root:

    python3 scripts/render-deep-dive-samples.py            # all 52
    python3 scripts/render-deep-dive-samples.py 5-of-diamonds queen-of-hearts
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import fitz  # pymupdf
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "deep-dive" / "samples"
CACHE = Path(os.environ.get("DEEP_DIVE_PDF_DIR") or "/Users/main/Desktop/hermes-outputs/cardblueprints/deep-dive-9/card-level")
FALLBACK_CACHE = Path(os.environ.get("DEEP_DIVE_PDF_CACHE") or (Path.home() / ".cache" / "cardblueprints" / "deep-dive-pdfs"))
BUCKET = "cardblueprints-ebooks"
PREFIX = "deep-dive"
PAPER = (246, 241, 232)
WIDTH = 900
CROP = 0.62      # keep the top 62% of page 1
FADE_FROM = 0.72  # start fading at 72% of the crop height

RANKS = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"]
SUITS = ["hearts", "diamonds", "clubs", "spades"]
ALL_SLUGS = [f"{r}-of-{s}" for s in SUITS for r in RANKS]


def fetch(slug: str) -> Path:
    local = CACHE / f"{slug}.pdf"
    if local.exists():
        return local
    FALLBACK_CACHE.mkdir(parents=True, exist_ok=True)
    cached = FALLBACK_CACHE / f"{slug}.pdf"
    if cached.exists() and cached.stat().st_size > 10_000:
        return cached
    subprocess.run(
        ["npx", "wrangler", "r2", "object", "get", f"{BUCKET}/{PREFIX}/{slug}.pdf", "--file", str(cached), "--remote"],
        check=True, cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return cached


def render(pdf: Path, out: Path) -> tuple[int, int]:
    doc = fitz.open(pdf)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    w, h = img.size
    crop = img.crop((0, 0, w, int(h * CROP)))
    ch = crop.size[1]
    mask = Image.new("L", crop.size, 255)
    draw = ImageDraw.Draw(mask)
    start = int(ch * FADE_FROM)
    for y in range(start, ch):
        draw.line([(0, y), (w, y)], fill=int(255 * (1 - (y - start) / (ch - start))))
    composed = Image.composite(crop, Image.new("RGB", crop.size, PAPER), mask)
    composed = composed.resize((WIDTH, round(WIDTH * ch / w)), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    composed.save(out, quality=82, optimize=True)
    return composed.size


def main(argv: list[str]) -> int:
    slugs = argv or ALL_SLUGS
    failed: list[str] = []
    for slug in slugs:
        try:
            size = render(fetch(slug), OUT / f"{slug}.jpg")
            print(f"ok   {slug} {size[0]}x{size[1]}")
        except Exception as exc:  # noqa: BLE001
            failed.append(slug)
            print(f"FAIL {slug}: {exc}")
    print(f"{len(slugs) - len(failed)}/{len(slugs)} rendered → {OUT}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
