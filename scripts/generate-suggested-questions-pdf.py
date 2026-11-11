#!/usr/bin/env python3
"""Generate public/downloads/card-blueprint-suggested-questions.pdf.

Pure-stdlib deterministic PDF 1.4 generator (zero external dependencies).
Produces a 2-page US Letter editorial guide in Card Blueprints' warm archival
drafting aesthetic (#F6F5F0 paper, #111318 ink, #1E3F66 cyanotype accents).
"""
from __future__ import annotations

from pathlib import Path
import textwrap

PAGE_W = 612  # 8.5 in * 72 pt
PAGE_H = 792  # 11 in * 72 pt
MARGIN_X = 52


def pdf_escape(text: str) -> str:
    text = text.replace("--", "\u2014").replace("\u00b7", "|")
    raw = text.encode("cp1252", "replace")
    escaped: list[str] = []
    for b in raw:
        ch = chr(b)
        if ch == "\\":
            escaped.append("\\\\")
        elif ch == "(":
            escaped.append("\\(")
        elif ch == ")":
            escaped.append("\\)")
        elif 32 <= b <= 126:
            escaped.append(ch)
        else:
            escaped.append(f"\\{b:03o}")
    return "".join(escaped)


class CanvasPage:
    def __init__(self) -> None:
        self.ops: list[str] = []
        # Warm drafting paper background (#F6F5F0 -> 0.965, 0.961, 0.941)
        self.rect_fill(0, 0, PAGE_W, PAGE_H, (0.965, 0.961, 0.941))
        # Subtle top cyanotype hairline (#1E3F66 -> 0.118, 0.247, 0.400)
        self.rect_fill(MARGIN_X, PAGE_H - 38, PAGE_W - 2 * MARGIN_X, 1.5, (0.118, 0.247, 0.400))

    def rect_fill(self, x: float, y: float, w: float, h: float, rgb: tuple[float, float, float]) -> None:
        r, g, b = rgb
        self.ops.append(f"q {r:.3f} {g:.3f} {b:.3f} rg {x:.1f} {y:.1f} {w:.1f} {h:.1f} re f Q")

    def line(self, x1: float, y1: float, x2: float, y2: float, rgb: tuple[float, float, float], width: float = 0.6) -> None:
        r, g, b = rgb
        self.ops.append(f"q {r:.3f} {g:.3f} {b:.3f} RG {width:.2f} w {x1:.1f} {y1:.1f} m {x2:.1f} {y2:.1f} l S Q")

    def text(self, x: float, y: float, font: str, size: float, rgb: tuple[float, float, float], content: str) -> None:
        r, g, b = rgb
        escaped = pdf_escape(content)
        self.ops.append(f"BT /{font} {size:.1f} Tf {r:.3f} {g:.3f} {b:.3f} rg {x:.1f} {y:.1f} Td ({escaped}) Tj ET")

    def wrapped_text(
        self,
        x: float,
        y: float,
        font: str,
        size: float,
        leading: float,
        rgb: tuple[float, float, float],
        content: str,
        width_chars: int,
    ) -> float:
        for line in textwrap.wrap(content, width=width_chars):
            self.text(x, y, font, size, rgb, line)
            y -= leading
        return y


INK = (0.067, 0.075, 0.094)       # #111318
MUTED = (0.320, 0.345, 0.388)     # #525863
CYANO = (0.118, 0.247, 0.400)     # #1E3F66
RULE = (0.835, 0.824, 0.792)      # #D5D2CA
BOX = (0.933, 0.925, 0.898)       # #EEEDE5

SECTIONS = [
    (
        "01 / TIMING & YOUR NEXT 12 MONTHS",
        "When to push, when to wait, and what season you are actually in",
        [
            "Which 52-day window in the next year is the cleanest stretch to make my biggest move -- and which stretch should I treat as maintenance instead?",
            "Why does my current season feel stalled right now, and what exact date does the pressure shift?",
            "What is my Result card actually asking me to finish before my next birthday turn?",
            "I am weighing two timelines (moving now vs. waiting a few months). What do my upcoming 52-day periods say about each window?",
            "Where is my Pluto card putting pressure on my year, and what stops me from wasting the whole season fighting it?",
        ],
    ),
    (
        "02 / RELATIONSHIPS & TWO-PERSON CHEMISTRY",
        "Include a second person's birth date on any of your 3 questions",
        [
            "Where do we actually sit in each other's permanent spreads -- is this pull mutual or mostly running one way?",
            "We keep hitting the exact same wall under stress. What are our two birth cards doing in the room, and what breaks the loop?",
            "When do our 52-day timing charts cross over the next few months for an honest conversation without the usual static?",
            "Should I reach out in this window or hold my boundary and let their current period play out first?",
            "What is the real friction between our cards that we keep mislabeling as bad timing?",
        ],
    ),
    (
        "03 / WORK, MONEY & CONCRETE DECISIONS",
        "Launches, job changes, pricing, exits, and commitments",
        [
            "When is the strongest 52-day window this year to launch, pitch, or raise my rates -- and what habit undercuts me there?",
            "I am deciding between staying where I am or taking a riskier path. How do my Long Range, Pluto, and Result cards frame that trade?",
            "What money or work reflex does my birth card default to under stress, and what clean rule fixes it this season?",
            "Which planetary period ahead favors signing, negotiating, or locking in a partnership -- and which one calls for patience?",
            "What am I over-engineering in my work right now that my current 52-day card wants simplified?",
        ],
    ),
    (
        "04 / BLIND SPOTS, KARMA & SELF-SABOTAGE",
        "The pattern you keep calling coincidence",
        [
            "What is the exact defense habit my birth card and ruling card run when I feel cornered -- and what does the healthy version look like?",
            "How are my Environment and Displacement cards showing up in my current age chart?",
            "Where do I confuse control with safety, and what one move interrupts that pattern this month?",
            "Why do I keep attracting the same dynamic with a specific type of person, based on my permanent spread seats?",
            "If you only gave me one rule to follow for the rest of this 52-day period, what does my chart say it is?",
        ],
    ),
]


def render_section(page: CanvasPage, y: float, eyebrow: str, subtitle: str, questions: list[str]) -> float:
    page.text(MARGIN_X, y, "F2", 8.5, CYANO, eyebrow)
    y -= 14
    page.text(MARGIN_X, y, "F2", 11.5, INK, subtitle)
    y -= 10
    page.line(MARGIN_X, y, PAGE_W - MARGIN_X, y, RULE, 0.7)
    y -= 15
    for idx, q in enumerate(questions, 1):
        page.text(MARGIN_X, y, "F2", 9.5, CYANO, f"{idx}.")
        y = page.wrapped_text(MARGIN_X + 16, y, "F1", 9.6, 13.2, INK, q, width_chars=84)
        y -= 5
    return y - 10


def build_pdf() -> bytes:
    p1 = CanvasPage()
    y = PAGE_H - 58
    p1.text(MARGIN_X, y, "F2", 9.0, CYANO, "CARD BLUEPRINTS  |  THE CARD BLUEPRINT READING ($99)")
    y -= 24
    p1.text(MARGIN_X, y, "F2", 21.0, INK, "Suggested Questions Guide")
    y -= 18
    y = p1.wrapped_text(
        MARGIN_X,
        y,
        "F1",
        10.2,
        14.5,
        MUTED,
        "Use these 20 prompts to sharpen what you ask -- or skip them completely and write any real question in your own words. Your reading includes 48 hours of private access from purchase to submit up to 3 questions (solo or with a second birthday), personally reviewed and answered by Cass via email or text message.",
        width_chars=86,
    )
    y -= 8
    p1.rect_fill(MARGIN_X, y - 34, PAGE_W - 2 * MARGIN_X, 38, BOX)
    p1.text(
        MARGIN_X + 12,
        y - 14,
        "F2",
        9.0,
        INK,
        "HOW TO USE YOUR 3 QUESTIONS OVER 48 HOURS:",
    )
    p1.text(
        MARGIN_X + 12,
        y - 27,
        "F1",
        8.8,
        MUTED,
        "Ask all 3 now, or start with Question 1 and save Questions 2 & 3 for follow-ups once your first answer lands.",
    )
    y -= 54

    y = render_section(p1, y, *SECTIONS[0])
    y = render_section(p1, y, *SECTIONS[1])
    p1.line(MARGIN_X, 46, PAGE_W - MARGIN_X, 46, RULE, 0.6)
    p1.text(MARGIN_X, 32, "F1", 8.2, MUTED, "cardblueprints.com  |  Cards are coordinates. You choose the meaning.  |  Page 1 of 2")

    p2 = CanvasPage()
    y2 = PAGE_H - 58
    p2.text(MARGIN_X, y2, "F2", 9.0, CYANO, "CARD BLUEPRINTS  |  SUGGESTED QUESTIONS GUIDE (CONTINUED)")
    y2 -= 24
    y2 = render_section(p2, y2, *SECTIONS[2])
    y2 = render_section(p2, y2, *SECTIONS[3])

    y2 -= 6
    p2.rect_fill(MARGIN_X, y2 - 64, PAGE_W - 2 * MARGIN_X, 70, BOX)
    p2.text(MARGIN_X + 14, y2 - 16, "F2", 9.5, CYANO, "TIPS FOR GETTING THE SHARPEST ANSWER FROM CASS")
    p2.text(MARGIN_X + 14, y2 - 31, "F1", 9.0, INK, "1. Name the actual situation (a date, a person, an offer, or a fork in the road) instead of asking 'what will happen?'")
    p2.text(MARGIN_X + 14, y2 - 44, "F1", 9.0, INK, "2. Asking about someone else? Include their full birth date (month, day, year) so both spreads & timing windows lock in.")
    p2.text(MARGIN_X + 14, y2 - 57, "F1", 9.0, INK, "3. Use your private Reading Pass link (sent in your receipt) anytime within 48 hours of purchase to submit up to 3 questions.")

    p2.line(MARGIN_X, 46, PAGE_W - MARGIN_X, 46, RULE, 0.6)
    p2.text(MARGIN_X, 32, "F1", 8.2, MUTED, "cardblueprints.com  |  Support: 52xseven@mail.grokbot.com  |  Page 2 of 2")

    streams = ["\n".join(p1.ops).encode("latin-1"), "\n".join(p2.ops).encode("latin-1")]

    objects: list[bytes] = []
    # 1: Catalog
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    objects.append(b"<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>")
    # 3: Page 1
    objects.append(
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>".encode("ascii")
    )
    # 4: Page 2
    objects.append(
        f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>".encode("ascii")
    )
    # 5: Helvetica
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    # 6: Helvetica-Bold
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    # 7 & 8: Content streams
    for s in streams:
        objects.append(f"<< /Length {len(s)} >>\nstream\n".encode("ascii") + s + b"\nendstream")
    # 9: Info
    objects.append(
        b"<< /Title (Card Blueprints - Suggested Questions Guide) /Author (Cassidy Rice | Card Blueprints) /Creator (Card Blueprints) >>"
    )

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets: list[int] = []
    for idx, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out.extend(f"{idx} 0 obj\n".encode("ascii"))
        out.extend(obj)
        out.extend(b"\nendobj\n")

    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for off in offsets:
        out.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R /Info 9 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
    )
    return bytes(out)


def main() -> None:
    target = Path(__file__).resolve().parent.parent / "public" / "downloads" / "card-blueprint-suggested-questions.pdf"
    target.parent.mkdir(parents=True, exist_ok=True)
    pdf_bytes = build_pdf()
    target.write_bytes(pdf_bytes)
    print(f"Wrote {target} ({len(pdf_bytes)} bytes)")


if __name__ == "__main__":
    main()
