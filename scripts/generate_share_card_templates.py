#!/usr/bin/env python3
"""Generate FINAL share-card templates + mute composite samples.

Clean premium tighten: more card, quiet type, fewer overlays.
Plain-neutral field + photo-real card-face PNGs slotted into measured seats
(Cass veto: no ornate chrome; no canvas pip/monogram faces).

Brand / purpose copy (Cass-locked) is drawn in canvas / sample compositing —
templates stay a flat field (+ Life Path seat rings on duel). Do not bake
brand lines into templates.

Outputs:
  public/share-cards/01-birth-result-template.png
  public/share-cards/02-compat-duel-template.png
  public/share-cards/samples/birth-8-of-diamonds.png
  public/share-cards/samples/compat-queen-diamonds-ace-hearts.png

Locks:
  - brand mark / tagline / CTA from layout.json brand (exact Cass copy)
  - flat neutral bg (~#ebe7e0); templates almost flat — no baked shadow blobs
  - NO dashed card-slot guides / name-band dashes on FINAL templates
  - NO ornate gold frames / sunbursts / filigree
  - Life Path seats at measured circle centers (layout.json); thin/light rings
  - Sample labels are card names only (no price / banned words)
  - Joker never silent K♠ (samples use real cards only)
  - Card faces are PNGs from public/share-cards/faces/<seo-slug>.png
  - Prophecy in brand tagline is intentional — keep it

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
FACES = OUT / "faces"
LAYOUT_PATH = ROOT / "lib" / "share-cards" / "layout.json"
HERMES = Path("/Users/main/Desktop/hermes-outputs/cardblueprints/share-cards")

W, H = 1080, 1920
# Soft warm gray — plain neutral field
FIELD = (0xEB, 0xE7, 0xE0)
INK = (0x2A, 0x26, 0x22)
BAND_INK = (0x6A, 0x64, 0x5C)  # muted charcoal — quiet type
CTA_INK = (0x8A, 0x84, 0x7C)  # soft CTA / purpose cue
# Photo-real card stock (under shadow / transparent corners)
CARD_FACE_BG = (0xFF, 0xFE, 0xF9)
CARD_EDGE = (0x2C, 0x2A, 0x28)
# Subtle neutral chrome (not gold)
NEUTRAL_RING = (0xD8, 0xD2, 0xC8)  # thinner/lighter seat rings

SUIT_MAP = {"♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades"}
RANK_SLUG = {"A": "ace", "J": "jack", "Q": "queen", "K": "king"}
RANK_WORD = {"A": "Ace", "J": "Jack", "Q": "Queen", "K": "King"}

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


def brand_copy(layout: dict) -> dict:
    brand = layout["brand"]
    expected = {
        "mark": "Card Blueprints",
        "tagline": "Coordinates not Prophecy",
        "cta": "get your blueprint at cardblueprints.com",
    }
    for key, value in expected.items():
        if brand.get(key) != value:
            raise SystemExit(f"brand.{key} must be exact Cass copy: {value!r}")
    return brand


def draw_brand_stack(d: ImageDraw.ImageDraw, layout_block: dict, brand: dict):
    """Quiet premium mark + tagline near top — canvas-parity for samples."""
    stack = layout_block["brandStack"]
    d.text(
        (W / 2, stack["markY"]),
        brand["mark"],
        font=font(FONT_SERIF, 36),
        fill=INK,
        anchor="mm",
    )
    d.text(
        (W / 2, stack["taglineY"]),
        brand["tagline"],
        font=font(FONT_SERIF_REG, 22),
        fill=BAND_INK,
        anchor="mm",
    )


def draw_cta(d: ImageDraw.ImageDraw, layout_block: dict, brand: dict):
    """Single clear CTA — replaces old tiny watermark; do not double-stack URL."""
    d.text(
        (W / 2, layout_block["ctaY"]),
        brand["cta"],
        font=font(FONT_SERIF_REG, 22),
        fill=CTA_INK,
        anchor="mm",
    )


def draw_purpose_cue(d: ImageDraw.ImageDraw, cue: dict):
    """Quiet birth-only purpose cue near the name — optional, not fighting brand."""
    d.text(
        (cue["x"] + cue["w"] / 2, cue["y"] + cue["h"] / 2),
        cue["text"],
        font=font(FONT_SERIF_REG, max(14, int(cue["h"] * 0.5))),
        fill=CTA_INK,
        anchor="mm",
    )


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
    # Almost flat field — brand / CTA drawn in canvas + samples, not baked here
    return base_canvas()


def make_compat_template(layout: dict) -> Image.Image:
    # Flat field + very subtle seat rings — no baked brand / watermark
    img = base_canvas()
    d = ImageDraw.Draw(img)
    seats = layout["compatDuel"]["lifePathBoard"]["seatCenters"]
    draw_life_path_rings(d, seats)
    return img


def face_slug_from_code(code: str) -> str | None:
    if code == "Joker":
        return "joker"
    glyph = next((c for c in code if c in SUIT_MAP), None)
    if not glyph:
        return None
    suit = SUIT_MAP[glyph]
    rank = code.replace(glyph, "").strip()
    rank_slug = RANK_SLUG.get(rank, rank.lower())
    return f"{rank_slug}-of-{suit}"


def load_face(code: str) -> Image.Image:
    slug = face_slug_from_code(code)
    if not slug:
        raise ValueError(f"unknown card code for face: {code}")
    path = FACES / f"{slug}.png"
    if not path.exists():
        raise FileNotFoundError(f"missing face PNG: {path}")
    return Image.open(path).convert("RGBA")


def paste_rounded_face(
    base: Image.Image, slot: dict, face: Image.Image
) -> Image.Image:
    """Soft drop shadow + rounded clip + paste photo-real face PNG into slot."""
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

    # Stock under + rounded mask for the face
    face_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(face_layer)
    fd.rounded_rectangle(
        [x, y, x + w, y + h],
        radius=r,
        fill=CARD_FACE_BG + (255,),
    )

    resized = face.resize((w, h), Image.Resampling.LANCZOS)
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    face_layer.paste(resized, (x, y), mask)

    # Thin dark edge
    fd.rounded_rectangle(
        [x, y, x + w, y + h],
        radius=r,
        outline=CARD_EDGE + (255,),
        width=max(2, int(w * 0.008)),
    )
    return Image.alpha_composite(out, face_layer).convert("RGB")


def draw_card_face(base: Image.Image, slot: dict, code: str) -> Image.Image:
    """Slot photo-real face PNG — no canvas pip/monogram drawing."""
    return paste_rounded_face(base, slot, load_face(code))


def draw_joker_face(base: Image.Image, slot: dict) -> Image.Image:
    """Distinct joker.png — never silent K♠."""
    return paste_rounded_face(base, slot, load_face("Joker"))


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


def draw_life_path_seats(
    base: Image.Image, seats: list[dict], codes: list[str]
) -> Image.Image:
    """Circular chips: photo-real face PNG clipped into measured seats."""
    out = base.convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for seat, code in zip(seats, codes):
        if code == "Joker":
            continue
        slug = face_slug_from_code(code)
        if not slug:
            continue
        face = load_face(code)
        x, y, r = seat["x"], seat["y"], seat["r"]
        rr = int(r * 0.78)
        side = rr * 2

        # Soft mini-shadow
        sd = ImageDraw.Draw(layer)
        sd.ellipse(
            [x - rr + 2, y - rr + 3, x + rr + 2, y + rr + 3],
            fill=(0, 0, 0, 40),
        )

        chip = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        resized = face.resize((side, side), Image.Resampling.LANCZOS)
        mask = Image.new("L", (side, side), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, side - 1, side - 1], fill=255)
        # stock under
        stock = Image.new("RGBA", (side, side), CARD_FACE_BG + (255,))
        chip = Image.composite(resized, stock, mask)
        # edge
        ImageDraw.Draw(chip).ellipse(
            [0, 0, side - 1, side - 1],
            outline=CARD_EDGE + (255,),
            width=2,
        )
        layer.paste(chip, (x - rr, y - rr), chip)
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


def assert_faces_on_disk():
    required = [
        "8-of-diamonds",
        "queen-of-diamonds",
        "ace-of-hearts",
        "joker",
        "2-of-hearts",
        "5-of-clubs",
        "9-of-diamonds",
        "queen-of-spades",
        "3-of-hearts",
        "7-of-clubs",
        "king-of-diamonds",
    ]
    missing = [s for s in required if not (FACES / f"{s}.png").exists()]
    if missing:
        raise SystemExit(f"missing face PNGs: {missing}")
    total = len(list(FACES.glob("*.png")))
    if total < 53:
        raise SystemExit(f"expected 53 face PNGs (52+joker), found {total}")
    print(f"OK faces: {total} PNGs in {FACES.relative_to(ROOT)}")


def make_birth_sample(layout: dict, brand: dict) -> Image.Image:
    img = make_birth_template(layout)
    block = layout["birthResult"]
    d = ImageDraw.Draw(img)
    draw_brand_stack(d, block, brand)
    img = draw_card_face(img, block["cardSlot"], "8♦")
    d = ImageDraw.Draw(img)
    draw_purpose_cue(d, block["purposeCue"])
    draw_label_in_band(d, block["nameBand"], "8 of Diamonds")
    draw_cta(d, block, brand)
    return img


def make_compat_sample(layout: dict, brand: dict) -> Image.Image:
    img = make_compat_template(layout)
    block = layout["compatDuel"]
    d = ImageDraw.Draw(img)
    draw_brand_stack(d, block, brand)
    slots = block["cardSlots"]
    img = draw_card_face(img, slots[0], "Q♦")
    img = draw_card_face(img, slots[1], "A♥")
    d = ImageDraw.Draw(img)
    draw_label_in_band(
        d,
        block["labelBand"],
        "Queen of Diamonds · Ace of Hearts",
    )
    seats = block["lifePathBoard"]["seatCenters"]
    codes = ["2♥", "5♣", "9♦", "Q♠", "3♥", "7♣", "K♦"]
    img = draw_life_path_seats(img, seats, codes)
    d = ImageDraw.Draw(img)
    draw_cta(d, block, brand)
    return img


def sync_hermes():
    if not HERMES.parent.exists():
        print(f"skip hermes sync: {HERMES.parent} missing")
        return
    HERMES.mkdir(parents=True, exist_ok=True)
    (HERMES / "samples").mkdir(parents=True, exist_ok=True)
    (HERMES / "faces").mkdir(parents=True, exist_ok=True)
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
    # Mirror face PNGs into hermes
    for src in sorted(FACES.glob("*.png")):
        shutil.copy2(src, HERMES / "faces" / src.name)
    attr = FACES / "ATTRIBUTION.txt"
    if attr.exists():
        shutil.copy2(attr, HERMES / "faces" / "ATTRIBUTION.txt")
    print(f"hermes ← faces/ ({len(list((HERMES / 'faces').glob('*.png')))} png)")


def main():
    layout = load_layout()
    brand = brand_copy(layout)
    OUT.mkdir(parents=True, exist_ok=True)
    SAMPLES.mkdir(parents=True, exist_ok=True)
    assert_faces_on_disk()

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

    birth_sample = make_birth_sample(layout, brand)
    compat_sample = make_compat_sample(layout, brand)
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
            for x in range(280, 800):
                # CTA ink near bottom — wider band than old short watermark
                p = px[x, y]
                if abs(p[0] - FIELD[0]) > 8 or abs(p[1] - FIELD[1]) > 8:
                    ink += 1
        if ink < 20:
            raise SystemExit("sample missing CTA ink near bottom")
        # Brand mark ink near top
        top = 0
        for y in range(70, 120):
            for x in range(300, 780):
                p = px[x, y]
                if abs(p[0] - FIELD[0]) > 8 or abs(p[1] - FIELD[1]) > 8:
                    top += 1
        if top < 20:
            raise SystemExit("sample missing brand mark ink near top")
    print("OK samples: brand stack + CTA present; labels locked in draw_label_in_band")
    print("OK samples: faces pasted from public/share-cards/faces/ (drawImage path)")
    print("OK brand: Card Blueprints / Coordinates not Prophecy / get your blueprint…")

    sync_hermes()


if __name__ == "__main__":
    main()
