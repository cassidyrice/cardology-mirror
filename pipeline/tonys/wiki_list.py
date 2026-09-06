"""Parse Leading Actor / Actress winners from Wikipedia Tony category lists."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json
from pipeline.tonys.catalog import CATEGORIES, WIKIPEDIA_API, wikipedia_list_url

WINNER_BG_RE = re.compile(r"background:\s*#B0C4DE", re.I)
YEAR_RE = re.compile(r"'''(\d{4})'''")
WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
ITALIC_PLAIN_RE = re.compile(r"'{3,5}([^'\[]+)'{3,5}")
NOT_AWARDED_RE = re.compile(r"Not awarded", re.I)
LEVEL2_HEADING_RE = re.compile(r"\n==[^=].*==")
CELL_ATTR_RE = re.compile(
    r"^(?:rowspan|colspan|style|align|scope|class)\s*=.*?\|",
    re.IGNORECASE,
)
SKIP_TITLE_RE = re.compile(
    r"^(File:|Image:|Category:)|Tony Awards$|^[0-9]+(st|nd|rd|th) Tony Awards$",
    re.IGNORECASE,
)


def wikitext_url(title: str) -> str:
    return (
        f"{WIKIPEDIA_API}?action=parse"
        f"&page={quote(title)}&prop=wikitext&format=json"
    )


def slice_winners_section(wikitext: str) -> str:
    start = wikitext.find("==Winners and nominees==")
    body = wikitext[start:] if start >= 0 else wikitext
    marker = "==Winners and nominees=="
    rest = body[len(marker) :] if body.startswith(marker) else body
    match = LEVEL2_HEADING_RE.search(rest)
    if match:
        return body[: len(marker) + match.start()] if body.startswith(marker) else rest[: match.start()]
    return body


def _strip_refs(text: str) -> str:
    cleaned = re.sub(r"<ref[\s\S]*?</ref>", "", text)
    cleaned = re.sub(r"\{\{small\|.*?\}\}", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"\{\{cite[\s\S]*?\}\}", "", cleaned, flags=re.IGNORECASE)
    return cleaned


def parse_wikilink(raw: str) -> tuple[str, str]:
    match = WIKILINK_RE.search(raw)
    if not match:
        return "", ""
    title = match.group(1).strip()
    display = (match.group(2) or title).strip()
    return title, display


def cell_text(line: str) -> str:
    text = line.lstrip("|!").strip()
    while CELL_ATTR_RE.match(text):
        text = CELL_ATTR_RE.sub("", text, count=1).strip()
    return text


def _data_cells(chunk: str) -> list[str]:
    cells: list[str] = []
    for line in _strip_refs(chunk).splitlines():
        stripped = line.strip()
        if not (stripped.startswith("|") or stripped.startswith("!")):
            continue
        value = cell_text(stripped)
        if not value:
            continue
        if YEAR_RE.fullmatch(value.strip("' ")) or value in {"<br>", "<br />"}:
            continue
        if YEAR_RE.search(value) and not WIKILINK_RE.search(value):
            continue
        if re.fullmatch(r"(?:<br\s*/?>|\s)*", value):
            continue
        cells.append(value)
    return cells


def _skip_title(title: str) -> bool:
    return bool(SKIP_TITLE_RE.search(title))


def _production_from_cell(cell: str) -> str:
    _title, display = parse_wikilink(cell)
    if display:
        return display
    italic = ITALIC_PLAIN_RE.search(cell)
    if italic:
        return italic.group(1).strip()
    return re.sub(r"'{2,}", "", cell).strip()


def _role_from_cell(cell: str) -> str:
    _title, display = parse_wikilink(cell)
    raw = display or cell
    return re.sub(r"'{2,}", "", raw).strip()


def parse_winners_wikitext(wikitext: str, *, category_key: str) -> list[dict[str, Any]]:
    """Return one row per highlighted winner (ties kept; nominees dropped)."""
    section = slice_winners_section(wikitext)
    rows: list[dict[str, Any]] = []
    current_year: str | None = None
    for chunk in re.split(r"\n\|-", section):
        year_match = YEAR_RE.search(chunk)
        if year_match:
            current_year = year_match.group(1)
        if NOT_AWARDED_RE.search(chunk):
            continue
        if not WINNER_BG_RE.search(chunk) or current_year is None:
            continue
        cells = _data_cells(chunk)
        if not cells:
            continue
        title, name = parse_wikilink(cells[0])
        if not title or _skip_title(title) or not name:
            continue
        production = _production_from_cell(cells[1]) if len(cells) > 1 else ""
        role = _role_from_cell(cells[2]) if len(cells) > 2 else ""
        rows.append(
            {
                "year": current_year,
                "category": category_key,
                "name": name,
                "enwiki_title": title,
                "production": production,
                "role": role,
            }
        )
    return rows


def fetch_category_wikitext(title: str, *, cache_path=None) -> str:
    payload = fetch_json(wikitext_url(title), cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_all_winner_rows(*, cache_dir=None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for category in CATEGORIES:
        title = category["wikipedia_title"]
        cache_path = None
        if cache_dir is not None:
            safe = title.replace(" ", "_")
            cache_path = cache_dir / f"{safe}.json"
        wikitext = fetch_category_wikitext(title, cache_path=cache_path)
        parsed = parse_winners_wikitext(wikitext, category_key=category["key"])
        for row in parsed:
            row["wikipedia_list_url"] = wikipedia_list_url(title)
            row["wikipedia_list_title"] = title
        rows.extend(parsed)
    return rows
