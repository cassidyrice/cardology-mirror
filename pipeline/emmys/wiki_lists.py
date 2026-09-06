"""Parse Primetime Emmy Lead Actor/Actress winners from Wikipedia list wikitext.

Winners are the gold-highlighted rows (``#FAEB86``) on the four lineage
pages. Nominees are ignored. Dates are never read from these lists.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.emmys.catalog import (
    CATEGORIES,
    LIST_STOP_HEADINGS,
    PRE_SPLIT_LAST_YEAR,
    WINNER_BG,
    EmmyCategory,
)
from pipeline.http import fetch_json

WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_YEAR_LINK_RE = re.compile(
    r"\[\[(?:\d{4} in (?:American )?television\|)?((?:19|20)\d{2})\]\]",
    re.IGNORECASE,
)
_BARE_YEAR_RE = re.compile(r"(?<!\d)((?:19|20)\d{2})(?!\d)")
_SORTNAME_RE = re.compile(r"\{\{\s*sortname\|([^}]+)\}\}", re.IGNORECASE)
# Title, optional #section (space before # is common on list pages), optional |display.
_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\s*#[^\]|]*)?(?:\|([^\]]+))?\]\]")
_LEFTOVER_WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
_NETWORK_ONLY_RE = re.compile(
    r"^(?:CBS|NBC|ABC|HBO|Fox|FX|Showtime|Netflix|AMC|TNT|"
    r"Apple TV\+?|Disney\+|Paramount\+|Peacock|USA Network)$",
    re.IGNORECASE,
)
_BOLD_PLAIN_RE = re.compile(r"'''([^'\[{][^']{0,80}?)'''")
_SECTION_RE = re.compile(r"^==\s*([^=]+?)\s*==\s*$", re.MULTILINE)
_WINNERS_HEADING_RE = re.compile(
    r"^==\s*Winners and nominations\s*==\s*$",
    re.IGNORECASE | re.MULTILINE,
)
_MARKUP_RE = re.compile(
    r"\{\{[^}]*\}\}|'{2,}|<ref[^>]*>.*?</ref>|<[^>]+>",
    re.IGNORECASE | re.DOTALL,
)
_CELL_ATTR_RE = re.compile(
    r"^(?:rowspan|colspan|scope|style|width|align|bgcolor|valign|class)\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s|]+)\s*\|?\s*",
    re.IGNORECASE,
)
_META_TITLE_RE = re.compile(
    r"(?:in (?:American )?television|Primetime Emmy Awards|American Broadcasting Company|"
    r"Fox Broadcasting Company|FX Networks|"
    r"^(?:CBS|NBC|ABC|HBO|Fox|FX|Showtime|Netflix|AMC|TNT)$|"
    r"Apple TV|Disney\+|Paramount\+|Peacock|USA Network)",
    re.IGNORECASE,
)


def wikitext_plain(raw: str) -> str:
    text = raw
    for match in _SORTNAME_RE.finditer(raw):
        text = text.replace(match.group(0), sortname_display(match.group(1)))
    text = _WIKILINK_RE.sub(lambda match: (match.group(2) or match.group(1)).strip(), text)
    text = _LEFTOVER_WIKILINK_RE.sub(
        lambda match: (match.group(2) or match.group(1).split("#", 1)[0]).strip(),
        text,
    )
    text = _MARKUP_RE.sub("", text)
    text = text.replace("&nbsp;", " ").replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip(" \t\n\r|")
    return text.strip()


def clean_field(raw: str) -> str:
    """Plain text for role/program. Network-only leftovers are dropped, not guessed."""
    text = wikitext_plain(raw)
    if _NETWORK_ONLY_RE.fullmatch(text):
        return ""
    return text


def sortname_display(raw: str) -> str:
    parts = [part.strip() for part in raw.split("|") if part.strip() and not part.startswith("dab=")]
    if not parts:
        return ""
    if len(parts) >= 3:
        return parts[2]
    if len(parts) == 2:
        return f"{parts[0]} {parts[1]}"
    return parts[0]


def first_wikilink_title(chunk: str) -> str:
    sortname = _SORTNAME_RE.search(chunk)
    if sortname:
        parts = [part.strip() for part in sortname.group(1).split("|") if part.strip()]
        if len(parts) >= 2:
            dab = next((part[4:] for part in parts if part.startswith("dab=")), None)
            name = f"{parts[0]} {parts[1]}"
            return f"{name} ({dab})" if dab else name
    match = _WIKILINK_RE.search(chunk)
    if match:
        return match.group(1).strip()
    return ""


def winners_section(wikitext: str) -> str:
    start = _WINNERS_HEADING_RE.search(wikitext)
    body = wikitext[start.end() :] if start else wikitext
    for match in _SECTION_RE.finditer(body):
        heading = match.group(1).strip().lower()
        if heading in LIST_STOP_HEADINGS or heading.startswith("multiple"):
            return body[: match.start()]
    return body


def strip_cell_attrs(cell: str) -> str:
    text = cell.strip()
    text = re.sub(r"^(?:\|+|!+)\s*", "", text)
    while True:
        updated = _CELL_ATTR_RE.sub("", text, count=1)
        if updated == text:
            break
        text = updated.strip()
    return text.strip()


def extract_year(chunk: str) -> str | None:
    link = _YEAR_LINK_RE.search(chunk)
    if link:
        return link.group(1)
    # Ceremony year cells often look like ``1954<br />`` or ``[[1954 in television|1954]]``.
    stripped = re.sub(r"<ref[^>]*>.*?</ref>", "", chunk, flags=re.I | re.S)
    if (
        "primetime emmy" in stripped.lower()
        or "in television" in stripped.lower()
        or "<br" in stripped.lower()
        or "rowspan" in stripped.lower()
    ):
        bare = _BARE_YEAR_RE.search(stripped)
        if bare:
            return bare.group(1)
    return None


def is_meta_cell(cell: str) -> bool:
    cleaned = strip_cell_attrs(cell)
    title = first_wikilink_title(cleaned)
    if title and _META_TITLE_RE.search(title):
        return True
    if title and re.fullmatch(r"(?:19|20)\d{2}", title):
        return True
    if _META_TITLE_RE.search(cleaned) and extract_year(cleaned):
        return True
    if re.search(r"rowspan\s*=", cell, re.I) and extract_year(cell):
        return True
    return False


def performance_note(chunk: str) -> str | None:
    if re.search(r"(?:'''|#|§)\s*#|#\s*(?:'''|<)", chunk) or re.search(r"\{\{[^}]*#\s*\}\}", chunk):
        if "#" in chunk:
            return "miniseries_or_tv_film"
    if "§" in chunk:
        return "guest"
    if re.search(r"\bguest performer\b", chunk, re.I):
        return "guest"
    return None


def _split_cells(row: str) -> list[str]:
    body = re.sub(r"^\|-+\s*", "", row.strip())
    body = re.sub(r"^style=\"[^\"]*\"\s*", "", body, flags=re.I)
    parts = re.split(r"\n(?:\||!)\s*|\s*\|\|\s*", body)
    return [part.strip() for part in parts if part.strip()]


def _content_cells(row: str) -> list[str]:
    cells: list[str] = []
    for raw in _split_cells(row):
        if is_meta_cell(raw):
            continue
        cleaned = strip_cell_attrs(raw)
        if cleaned:
            cells.append(cleaned)
    return cells


def _actor_chunk(row: str) -> str:
    """The actor/actress cell is first after year/ceremony cells.

    Do not skip an unlinked bold name in favor of a later role wikilink
    (``Michael J. Fox`` then ``[[Alex P. Keaton]]``).
    """
    cells = _content_cells(row)
    return cells[0] if cells else ""


def _role_and_program(row: str) -> tuple[str, str]:
    cells = _content_cells(row)
    if len(cells) < 2:
        return "", ""
    name_idx = 0
    actor = _actor_chunk(row)
    if actor in cells:
        name_idx = cells.index(actor)
    role = clean_field(cells[name_idx + 1]) if name_idx + 1 < len(cells) else ""
    program = clean_field(cells[name_idx + 2]) if name_idx + 2 < len(cells) else ""
    return role, program


def parse_winner_name(row: str) -> tuple[str, str]:
    """Return (display_name, enwiki_title_or_empty)."""
    actor = _actor_chunk(row)
    if not actor:
        return "", ""
    title = first_wikilink_title(actor)
    sortname = _SORTNAME_RE.search(actor)
    if sortname:
        display = sortname_display(sortname.group(1))
        return display, title or display
    if title:
        display_match = _WIKILINK_RE.search(actor)
        display = (display_match.group(2) or display_match.group(1)).strip() if display_match else title
        display = re.sub(r"\s+\([^)]+\)$", "", display)
        return display, title
    bold = _BOLD_PLAIN_RE.search(actor)
    if bold:
        name = bold.group(1).strip()
        return name, name
    plain = wikitext_plain(actor)
    return plain, plain


def is_winner_row(row: str) -> bool:
    return WINNER_BG.lower() in row.lower()


def parse_category_wikitext(wikitext: str, category: EmmyCategory) -> list[dict[str, Any]]:
    section = winners_section(wikitext)
    rows: list[dict[str, Any]] = []
    current_year: str | None = None
    for raw in re.split(r"\n\|-", section):
        chunk = raw.strip()
        if not chunk:
            continue
        year = extract_year(chunk)
        if year:
            current_year = year
        if not is_winner_row(chunk):
            continue
        if current_year is None:
            continue
        name, title = parse_winner_name(chunk)
        if not name:
            continue
        role, program = _role_and_program(chunk)
        note = performance_note(chunk)
        year_int = int(current_year)
        category_id = category["id"]
        if year_int <= PRE_SPLIT_LAST_YEAR:
            category_id = f"lead_{category['acting']}_pre_split"
            if note is None:
                note = "pre_genre_split"
        rows.append(
            {
                "year": current_year,
                "name": name,
                "wikipedia_title": title,
                "role": role,
                "program": program,
                "category_id": category_id,
                "genre": category["genre"] if year_int > PRE_SPLIT_LAST_YEAR else "pre_split",
                "acting": category["acting"],
                "category_full": (
                    f"Primetime Emmy Award for Outstanding Lead {category['acting'].title()}"
                    if year_int <= PRE_SPLIT_LAST_YEAR
                    else category["category_full"]
                ),
                "label": (
                    f"Lead {category['acting'].title()} (pre-genre split)"
                    if year_int <= PRE_SPLIT_LAST_YEAR
                    else category["label"]
                ),
                "list_title": category["wikipedia_title"],
                "list_url": category["wikipedia_url"],
                "performance_note": note,
            }
        )
    return rows


def _norm_key(value: str) -> str:
    return " ".join((value or "").replace("_", " ").split()).casefold()


def dedupe_wins(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Pre-1966 rows appear on both drama and comedy lineage pages."""
    seen: set[tuple[str, ...]] = set()
    out: list[dict[str, Any]] = []
    for win in wins:
        title = _norm_key(win.get("wikipedia_title") or win["name"])
        program = _norm_key(win.get("program") or "")
        pre_split = str(win.get("category_id") or "").endswith("pre_split")
        if pre_split:
            key = (win["year"], title, program)
        else:
            key = (win["year"], title, program, win.get("acting") or "")
        if key in seen:
            continue
        seen.add(key)
        if pre_split:
            win = dict(win)
            win["label"] = "Lead performer (pre-genre split)"
        out.append(win)
    out.sort(key=lambda item: (item["year"], item.get("category_id") or "", item["name"]))
    return out


def fetch_list_wikitext(category: EmmyCategory, *, cache_path=None) -> str:
    title = quote(category["wikipedia_title"].replace(" ", "_"))
    payload = fetch_json(WIKITEXT_URL.format(title=title), cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_all_wins(*, cache_dir=None) -> list[dict[str, Any]]:
    wins: list[dict[str, Any]] = []
    for category in CATEGORIES:
        cache_path = None
        if cache_dir is not None:
            slug = category["id"]
            cache_path = cache_dir / f"{slug}.json"
        wikitext = fetch_list_wikitext(category, cache_path=cache_path)
        wins.extend(parse_category_wikitext(wikitext, category))
    return dedupe_wins(wins)
