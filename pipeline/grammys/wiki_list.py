"""Parse Album of the Year winners from the Wikipedia award list.

Winner identity comes from the Wikipedia Album of the Year table, which
cites Recording Academy / Grammy.com ceremony and winners-list pages.
Only the Artist(s) column is primary billed. Production-team credits and
<small> featured-friend lists are out of scope. Birth dates are not on
this list.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

AOTY_TITLE = "Grammy_Award_for_Album_of_the_Year"
AOTY_URL = "https://en.wikipedia.org/wiki/Grammy_Award_for_Album_of_the_Year"
GRAMMY_HOME = "https://www.grammy.com/"
GRAMMY_AWARDS = "https://www.grammy.com/awards/"
GRAMMY_AOTY_CATEGORY = "https://www.grammy.com/awards/categories/album-of-the-year/{year}/"

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_CEREMONY_RE = re.compile(
    r"\[\[(\d+)(?:st|nd|rd|th) Annual Grammy Awards\|(\d{4})\]\]",
    re.IGNORECASE,
)
_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_SMALL_RE = re.compile(r"<small\b[^>]*>.*?</small>", re.IGNORECASE | re.DOTALL)
_TAG_RE = re.compile(r"<[^>]+>")
_BOLD_ITALIC_RE = re.compile(r"'{2,}")
_VARIOUS_RE = re.compile(r"\bvarious artists?\b", re.IGNORECASE)

_SKIP_ARTIST_TITLES = {
    "various artists",
    "various artist",
    "friends",
}


def grammy_category_url(year: int | str) -> str:
    return GRAMMY_AOTY_CATEGORY.format(year=int(year))


def _wikilink_parts(title: str, display: str | None) -> tuple[str, str]:
    page = title.replace("_", " ").strip()
    label = (display or page).strip()
    label = _BOLD_ITALIC_RE.sub("", label)
    label = _TAG_RE.sub("", label)
    label = re.sub(r"\s+", " ", label).strip()
    return page, label


def _is_winner_row(chunk: str) -> bool:
    upper = chunk.upper()
    return "#FAEB86" in upper or "BACKGROUND:#FAEB86" in upper


def _winner_tables(wikitext: str) -> str:
    start = wikitext.find("==Winners and nominees==")
    if start < 0:
        start = wikitext.find('{| class="wikitable"')
    if start < 0:
        return wikitext
    end = len(wikitext)
    for marker in ("\n==References==", "\n==See also==", "\n==External links=="):
        idx = wikitext.find(marker, start)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def _is_cite_debris(line: str) -> bool:
    stripped = line.lstrip("| ").lower()
    if stripped.startswith("date=") or "access-date=" in stripped:
        return "[[" not in line
    return False


def _data_cells(chunk: str) -> list[str]:
    cells: list[str] = []
    for line in chunk.splitlines():
        if not line.startswith("|"):
            continue
        if _is_cite_debris(line):
            continue
        cells.append(line[1:].strip())
    return cells


def parse_album_title(cell: str) -> str | None:
    focus = _SMALL_RE.sub("", cell)
    for match in _WIKILINK_RE.finditer(focus):
        _page, label = _wikilink_parts(match.group(1), match.group(2))
        if label:
            return label
    cleaned = _BOLD_ITALIC_RE.sub("", _TAG_RE.sub("", focus)).strip(" '")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or None


def parse_billed_artists(cell: str) -> list[dict[str, str]]:
    """Primary billed names only. Featured-friend <small> lists are dropped."""
    focus = _SMALL_RE.sub("", cell)
    artists: list[dict[str, str]] = []
    seen: set[str] = set()
    for match in _WIKILINK_RE.finditer(focus):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        lowered = title.lower()
        if lowered in _SKIP_ARTIST_TITLES or name.lower() in _SKIP_ARTIST_TITLES:
            continue
        if "annual grammy awards" in lowered:
            continue
        if title in seen:
            continue
        seen.add(title)
        artists.append({"name": name, "enwiki_title": title})
    return artists


def is_various_artists_only(cell: str, artists: list[dict[str, str]]) -> bool:
    if artists:
        return False
    focus = _SMALL_RE.sub("", cell)
    text = _BOLD_ITALIC_RE.sub("", _TAG_RE.sub("", focus)).strip()
    return bool(_VARIOUS_RE.search(text))


def parse_winners_wikitext(wikitext: str) -> list[dict[str, Any]]:
    body = _winner_tables(wikitext)
    rows: list[dict[str, Any]] = []
    for chunk in re.split(r"\n\|-\s*", body):
        if not _is_winner_row(chunk):
            continue
        ceremony = _CEREMONY_RE.search(chunk)
        if not ceremony:
            continue
        ceremony_number = int(ceremony.group(1))
        year = int(ceremony.group(2))
        cells = _data_cells(chunk)
        if len(cells) < 2:
            continue
        album = parse_album_title(cells[0])
        artist_cell = cells[1]
        if artist_cell.lower().startswith("<small"):
            continue
        artists = parse_billed_artists(artist_cell)
        various = is_various_artists_only(artist_cell, artists)
        grammy_url = grammy_category_url(year)
        rows.append(
            {
                "year": str(year),
                "ceremony_number": ceremony_number,
                "album": album or "",
                "artist_cell": artist_cell,
                "artists": artists,
                "various_artists": various,
                "grammy_url": grammy_url,
                "wikipedia_list_url": AOTY_URL,
            }
        )
    return rows


def flatten_billed(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One billed act per Wikipedia title, with every AOTY win."""
    people: dict[str, dict[str, Any]] = {}
    for win in wins:
        if win.get("various_artists") and not win.get("artists"):
            continue
        for artist in win["artists"]:
            key = artist["enwiki_title"]
            award = {
                "year": win["year"],
                "ceremony_number": win["ceremony_number"],
                "album": win["album"],
                "grammy_url": win["grammy_url"],
                "billed_act": artist["name"],
            }
            if key not in people:
                people[key] = {
                    "name": artist["name"],
                    "enwiki_title": artist["enwiki_title"],
                    "billing": "primary",
                    "awards": [award],
                }
            else:
                people[key]["awards"].append(award)
                if not people[key]["name"] and artist["name"]:
                    people[key]["name"] = artist["name"]
    out = list(people.values())
    for person in out:
        person["awards"].sort(key=lambda item: int(item["ceremony_number"] or 0))
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    return out


def various_artist_years(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "year": win["year"],
            "ceremony_number": win["ceremony_number"],
            "album": win["album"],
            "reason": "various_artists",
        }
        for win in wins
        if win.get("various_artists") and not win.get("artists")
    ]


def resolve_enwiki_title(title: str, *, cache_path=None) -> str:
    """Follow Wikipedia redirects so Wikidata sitelinks match."""
    url = (
        "https://en.wikipedia.org/w/api.php?action=query"
        f"&titles={quote(title.replace(' ', '_'), safe='_()%,:')}"
        "&redirects=1&format=json"
    )
    payload = fetch_json(url, cache_path=cache_path)
    pages = (payload.get("query") or {}).get("pages") or {}
    for page in pages.values():
        resolved = str(page.get("title") or "").strip()
        if resolved:
            return resolved
    return title


def fetch_aoty_wikitext(*, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(AOTY_TITLE, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


_CAPTION_FIELD_RE = re.compile(
    r"\|\s*caption\s*=\s*(.*?)(?=\n\|\s*[a-zA-Z_]+\s*=|\n\}\})",
    re.IGNORECASE | re.DOTALL,
)
_MEMBER_FIELD_RE = re.compile(
    r"\|\s*(?:current_members|members)\s*=\s*(.*?)(?=\n\|\s*[a-zA-Z_]+\s*=|\n\}\})",
    re.IGNORECASE | re.DOTALL,
)


def _members_from_fields(wikitext: str, pattern: re.Pattern[str]) -> list[dict[str, str]]:
    artists: list[dict[str, str]] = []
    seen: set[str] = set()
    for field in pattern.finditer(wikitext):
        for match in _WIKILINK_RE.finditer(field.group(1)):
            title, name = _wikilink_parts(match.group(1), match.group(2))
            lowered = title.lower()
            if lowered in _SKIP_ARTIST_TITLES or "list of" in lowered:
                continue
            if title in seen:
                continue
            seen.add(title)
            artists.append({"name": name, "enwiki_title": title})
    return artists


def parse_infobox_member_titles(wikitext: str) -> list[dict[str, str]]:
    """Band-page caption or current members when Wikidata P527 is empty.

    Past-member history lists are ignored so a later touring lineup is not
    invented as the Album of the Year billed act.
    """
    caption = _members_from_fields(wikitext, _CAPTION_FIELD_RE)
    if caption:
        return caption
    return _members_from_fields(wikitext, _MEMBER_FIELD_RE)


def fetch_winner_rows(*, cache_dir=None) -> tuple[list[dict[str, Any]], str]:
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{AOTY_TITLE}.json"
    wikitext = fetch_aoty_wikitext(cache_path=cache_path)
    wins = parse_winners_wikitext(wikitext)
    return flatten_billed(wins), wikitext
