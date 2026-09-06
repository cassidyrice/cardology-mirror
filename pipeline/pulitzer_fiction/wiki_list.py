"""Parse Pulitzer Prize for Fiction winners from the Wikipedia list.

Winner identity comes from the Wikipedia Fiction winners table, which cites
Pulitzer.org year pages. Only yellow winner rows are kept. Finalists and
“Not awarded” years are out of scope. Birth dates are not on this list.
Co-winners / joint recipients (yellow rows sharing a year) are kept.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

FICTION_TITLE = "Pulitzer_Prize_for_Fiction"
FICTION_URL = "https://en.wikipedia.org/wiki/Pulitzer_Prize_for_Fiction"
PULITZER_HOME = "https://www.pulitzer.org/"
PULITZER_FICTION = "https://www.pulitzer.org/prize-winners-by-category/219"
PULITZER_YEAR = "https://www.pulitzer.org/prize-winners-by-year/{year}"

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_YEAR_RE = re.compile(r"\[\[(\d{4}) in literature\|(\d{4})\]\]", re.IGNORECASE)
_PULITZER_YEAR_RE = re.compile(
    r"https?://(?:www\.)?pulitzer\.org/prize-winners-by-year/(\d{4})",
    re.IGNORECASE,
)
_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_ITALIC_LINK_RE = re.compile(r"'{2,5}\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]'{2,5}")
_TAG_RE = re.compile(r"<[^>]+>")
_BOLD_ITALIC_RE = re.compile(r"'{2,}")
_NOT_AWARDED_RE = re.compile(r"not awarded", re.IGNORECASE)
_WINNER_BG_RE = re.compile(r"background\s*:\s*#fff7c9|#fff7c9", re.IGNORECASE)


def pulitzer_year_url(year: int | str) -> str:
    return PULITZER_YEAR.format(year=int(year))


def _wikilink_parts(title: str, display: str | None) -> tuple[str, str]:
    page = title.replace("_", " ").strip()
    label = (display or page).strip()
    label = _BOLD_ITALIC_RE.sub("", label)
    label = _TAG_RE.sub("", label)
    label = re.sub(r"\s+", " ", label).strip()
    return page, label


def _winner_tables(wikitext: str) -> str:
    start = wikitext.find("==Winners==")
    if start < 0:
        start = wikitext.find('{| class="wikitable sortable"')
    if start < 0:
        return wikitext
    end = len(wikitext)
    for marker in (
        "\n==Repeat winners==",
        "\n==Authors with multiple nominations==",
        "\n== Notes ==",
        "\n==Notes==",
        "\n==References==",
        "\n==See also==",
    ):
        idx = wikitext.find(marker, start)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def _is_winner_row(chunk: str) -> bool:
    return _WINNER_BG_RE.search(chunk) is not None


def parse_year(chunk: str) -> str | None:
    match = _YEAR_RE.search(chunk)
    if not match:
        return None
    return match.group(2)


def parse_pulitzer_url(chunk: str, year: str) -> str:
    match = _PULITZER_YEAR_RE.search(chunk)
    if match:
        return pulitzer_year_url(match.group(1))
    return pulitzer_year_url(year)


def parse_author(chunk: str) -> dict[str, str] | None:
    for match in _WIKILINK_RE.finditer(chunk):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        lowered = title.lower()
        if lowered.endswith(" in literature"):
            continue
        if "pulitzer" in lowered:
            continue
        if not name:
            continue
        return {"name": name, "enwiki_title": title}
    return None


def parse_work(chunk: str, *, skip_titles: set[str] | None = None) -> str | None:
    skip = {item.lower() for item in (skip_titles or set())}
    for match in _ITALIC_LINK_RE.finditer(chunk):
        page, label = _wikilink_parts(match.group(1), match.group(2))
        if not label:
            continue
        if page.lower() in skip or label.lower() in skip:
            continue
        if page.lower().endswith(" in literature"):
            continue
        return label
    cleaned = _BOLD_ITALIC_RE.sub("", _TAG_RE.sub("", chunk))
    cleaned = re.sub(r"\{\{[^}]+\}\}", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" |")
    return None


def parse_winners_wikitext(wikitext: str) -> list[dict[str, Any]]:
    body = _winner_tables(wikitext)
    rows: list[dict[str, Any]] = []
    current_year: str | None = None
    year_counts: dict[str, int] = {}

    for chunk in re.split(r"\n\|-\s*", body):
        if _NOT_AWARDED_RE.search(chunk) and not _is_winner_row(chunk):
            year = parse_year(chunk)
            if year:
                current_year = year
            continue
        year = parse_year(chunk) or current_year
        if year:
            current_year = year
        if not _is_winner_row(chunk):
            continue
        if not year:
            continue
        author = parse_author(chunk)
        if author is None:
            continue
        work = parse_work(chunk, skip_titles={author["enwiki_title"], author["name"]})
        if not work:
            continue
        year_counts[year] = year_counts.get(year, 0) + 1
        rows.append(
            {
                "year": year,
                "name": author["name"],
                "enwiki_title": author["enwiki_title"],
                "work": work,
                "pulitzer_url": parse_pulitzer_url(chunk, year),
                "wikipedia_list_url": FICTION_URL,
                "category": "Pulitzer Prize for Fiction",
                "category_id": "fiction",
            }
        )

    for row in rows:
        row["shared"] = year_counts.get(row["year"], 0) > 1
    return rows


def flatten_winners(wins: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One person per Wikipedia title, with every Fiction win."""
    people: dict[str, dict[str, Any]] = {}
    for win in wins:
        key = win["enwiki_title"]
        award = {
            "year": win["year"],
            "work": win["work"],
            "category": win["category"],
            "category_id": win["category_id"],
            "pulitzer_url": win["pulitzer_url"],
            "shared": bool(win.get("shared")),
        }
        if key not in people:
            people[key] = {
                "name": win["name"],
                "enwiki_title": win["enwiki_title"],
                "awards": [award],
            }
        else:
            people[key]["awards"].append(award)
            if not people[key]["name"] and win["name"]:
                people[key]["name"] = win["name"]
    out = list(people.values())
    for person in out:
        person["awards"].sort(key=lambda item: int(item["year"] or 0))
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    return out


def not_awarded_years(wikitext: str) -> list[dict[str, Any]]:
    body = _winner_tables(wikitext)
    years: list[dict[str, Any]] = []
    seen: set[str] = set()
    for chunk in re.split(r"\n\|-\s*", body):
        if not _NOT_AWARDED_RE.search(chunk):
            continue
        if _is_winner_row(chunk):
            continue
        year = parse_year(chunk)
        if not year or year in seen:
            continue
        seen.add(year)
        years.append({"year": year, "reason": "not_awarded"})
    return years


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


def fetch_fiction_wikitext(*, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(FICTION_TITLE, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_winner_rows(*, cache_dir=None) -> tuple[list[dict[str, Any]], str]:
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{FICTION_TITLE}.json"
    wikitext = fetch_fiction_wikitext(cache_path=cache_path)
    wins = parse_winners_wikitext(wikitext)
    return flatten_winners(wins), wikitext
