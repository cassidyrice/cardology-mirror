"""NASA Fact Book list of U.S. astronauts — identifiers only, not dates.

Primary catalog: NASA Astronaut Fact Book section 1.0
(https://www.nasa.gov/reference/astronaut-fact-book/). That table is the
public flown / selected corps list. Group 24 candidates are appended from
the NASA astronaut-candidates page when they are missing from the table.

Dates always come from NASA bios + Wikidata P569. Do not invent extras.
"""

from __future__ import annotations

import html
import re
import unicodedata
from typing import Any

from pipeline.build_dataset import slugify
from pipeline.http import fetch_text

FACT_BOOK_URL = "https://www.nasa.gov/reference/astronaut-fact-book/"
CANDIDATES_URL = "https://www.nasa.gov/humans-in-space/astronauts/astronaut-candidates/"
ASTRONAUTS_HOME = "https://www.nasa.gov/astronauts"

_TAGS = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_MD_ROW = re.compile(
    r"^\|\s*(?P<name>[^|]+?)\s*\|\s*(?P<year>[^|]+?)\s*\|\s*"
    r"(?P<group>[^|]+?)\s*\|\s*(?P<flights>[^|]+?)\s*\|\s*(?P<status>[^|]+?)\s*\|$"
)
_HTML_ROW = re.compile(
    r"<tr[^>]*>\s*"
    r"<t[dh][^>]*>(?P<name>.*?)</t[dh]>\s*"
    r"<t[dh][^>]*>(?P<year>.*?)</t[dh]>\s*"
    r"<t[dh][^>]*>(?P<group>.*?)</t[dh]>\s*"
    r"<t[dh][^>]*>(?P<flights>.*?)</t[dh]>\s*"
    r"<t[dh][^>]*>(?P<status>.*?)</t[dh]>\s*"
    r"</tr>",
    re.IGNORECASE | re.DOTALL,
)
_SUFFIXES = re.compile(r"\b(jr|sr|ii|iii|iv)\.?$", re.IGNORECASE)
_TRAILING_PAREN = re.compile(r"\s*\([^)]*\)\s*$")
_CANDIDATE_HEADING = re.compile(
    r'<h2 class="heading-36[^"]*">\s*(?P<name>[^<]+?)\s*</h2>',
    re.IGNORECASE,
)
_TABLE = re.compile(r"<table\b[^>]*>.*?</table>", re.IGNORECASE | re.DOTALL)
_PDF_HREF = re.compile(r'href="(?P<href>[^"]+\.pdf[^"]*)"', re.IGNORECASE)
_ANY_HREF = re.compile(r'href="(?P<href>[^"]+)"', re.IGNORECASE)
_VALID_STATUS = frozenset({"active", "management", "former", "deceased", "candidate"})



def strip_tags(value: str) -> str:
    return _WS.sub(" ", _TAGS.sub(" ", html.unescape(value))).strip()


_NAME_SUFFIXES = {"jr", "jr.", "sr", "sr.", "ii", "iii", "iv"}


def display_name(last_first: str) -> str:
    """Turn Fact Book ``Last, First M.`` / ``Last, First, Jr.`` into a display name."""
    cleaned = _WS.sub(" ", last_first.replace("\u00a0", " ")).strip()
    if "," not in cleaned:
        return cleaned
    parts = [part.strip(" ,") for part in cleaned.split(",") if part.strip(" ,")]
    if not parts:
        return cleaned
    last = parts[0]
    rest = parts[1:]
    suffix = ""
    if rest and rest[-1].casefold() in _NAME_SUFFIXES:
        suffix = rest.pop()
        if suffix.casefold().rstrip(".") == "jr":
            suffix = "Jr."
        elif suffix.casefold().rstrip(".") == "sr":
            suffix = "Sr."
        else:
            suffix = suffix.upper() if suffix.casefold() in {"ii", "iii", "iv"} else suffix
    first = " ".join(rest)
    name = f"{first} {last}".strip()
    if suffix:
        name = f"{name} {suffix}"
    return _WS.sub(" ", name).strip()


def preferred_slug(name: str) -> str:
    return slugify(name)


def _fold_accents(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", value) if unicodedata.category(char) != "Mn"
    )


def bare_name(value: str) -> str:
    """Drop a trailing Wikipedia disambiguation parenthetical."""
    return _TRAILING_PAREN.sub("", html.unescape(value)).strip()


def normalize_name(value: str) -> str:
    cleaned = bare_name(value)
    cleaned = _fold_accents(cleaned)
    cleaned = cleaned.replace(",", " ").replace(".", " ")
    cleaned = cleaned.replace("'", "").replace("\u2019", "").replace("\u2018", "")
    cleaned = cleaned.replace("(", " ").replace(")", " ").replace("-", " ")
    cleaned = _WS.sub(" ", cleaned.casefold()).strip()
    return cleaned


def last_name(value: str) -> str:
    if "," in value:
        return normalize_name(value.split(",", 1)[0])
    tokens = [token for token in normalize_name(value).split() if token]
    if not tokens:
        return ""
    if _SUFFIXES.match(tokens[-1] or ""):
        tokens = tokens[:-1]
    return tokens[-1] if tokens else ""


def name_tokens(value: str) -> set[str]:
    return {token for token in normalize_name(value).split() if token and token not in {"the"}}


def _first_status_table(html_text: str) -> str | None:
    for table in _TABLE.finditer(html_text):
        blob = strip_tags(table.group(0)).casefold()
        if "status" in blob and "entry year" in blob and "astronaut" in blob:
            return table.group(0)
    return None


def parse_fact_book_text(text: str) -> list[dict[str, Any]]:
    """Parse the Fact Book 1.0 table from HTML or markdown."""
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    table = _first_status_table(text)
    source = table or text
    for match in _HTML_ROW.finditer(source):
        parsed = _row_from_parts(
            strip_tags(match.group("name")),
            strip_tags(match.group("year")),
            strip_tags(match.group("group")),
            strip_tags(match.group("flights")),
            strip_tags(match.group("status")),
            pdf_url=_first_pdf(match.group("name")),
            page_url=_first_nasa_page(match.group("name")),
        )
        if parsed is None:
            continue
        key = parsed["list_name"].casefold()
        if key in seen:
            continue
        seen.add(key)
        rows.append(parsed)
    if rows:
        return rows

    started = False
    for line in text.splitlines():
        stripped = line.strip()
        if started and stripped.startswith("##"):
            break
        match = _MD_ROW.match(stripped)
        if not match:
            continue
        started = True
        parsed = _row_from_parts(
            match.group("name").strip(),
            match.group("year").strip(),
            match.group("group").strip(),
            match.group("flights").strip(),
            match.group("status").strip(),
        )
        if parsed is None:
            continue
        key = parsed["list_name"].casefold()
        if key in seen:
            continue
        seen.add(key)
        rows.append(parsed)
    return rows


def _first_pdf(cell_html: str) -> str | None:
    match = _PDF_HREF.search(cell_html)
    if not match:
        return None
    href = html.unescape(match.group("href")).strip()
    if href.startswith("http"):
        return href.split("?")[0]
    return None


def _first_nasa_page(cell_html: str) -> str | None:
    for match in _ANY_HREF.finditer(cell_html):
        href = html.unescape(match.group("href")).strip().split("?")[0]
        if not href.startswith("http"):
            continue
        if ".pdf" in href.lower():
            continue
        if "nasa.gov" in href.lower():
            return href
    return None


def _row_from_parts(
    list_name: str,
    year: str,
    group: str,
    flights: str,
    status: str,
    pdf_url: str | None = None,
    page_url: str | None = None,
) -> dict[str, Any] | None:
    if not list_name or list_name.casefold() in {"astronaut", "---"}:
        return None
    if set(list_name) <= {"-"}:
        return None
    if not (year.isdigit() and len(year) == 4 and 1950 <= int(year) <= 2030):
        return None
    if status.casefold() not in _VALID_STATUS:
        return None
    group_s = group.strip()
    if not group_s.isdigit() or not 1 <= int(group_s) <= 24:
        return None
    name = display_name(list_name)
    slug = preferred_slug(name)
    if not slug:
        return None
    flights_n = int(flights) if flights.isdigit() else 0
    row = {
        "list_name": list_name,
        "name": name,
        "slug": slug,
        "entry_year": year,
        "group": group_s,
        "flights": flights_n,
        "status": status.title() if status.casefold() != "candidate" else "Candidate",
        "source": "fact_book",
    }
    if pdf_url:
        row["nasa_pdf_url"] = pdf_url
    if page_url:
        row["nasa_page_url"] = page_url
    return row


def parse_candidates_html(html_text: str) -> list[dict[str, Any]]:
    """Headings on the NASA astronaut-candidates page (Group 24)."""
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for match in _CANDIDATE_HEADING.finditer(html_text):
        name = strip_tags(match.group("name"))
        lowered = name.casefold()
        if not name or "class of" in lowered or "astronaut" in lowered:
            continue
        if "nasa" in lowered or "discover" in lowered or "media" in lowered:
            continue
        if len(name.split()) < 2:
            continue
        slug = preferred_slug(name)
        if not slug or slug in seen:
            continue
        seen.add(slug)
        rows.append(
            {
                "list_name": name,
                "name": name,
                "slug": slug,
                "entry_year": "2025",
                "group": "24",
                "flights": 0,
                "status": "Candidate",
                "source": "candidates",
            }
        )
    return rows


def merge_catalog(
    fact_book: list[dict[str, Any]],
    candidates: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    rows = list(fact_book)
    have = {normalize_name(row["name"]) for row in rows}
    have_last_first = {last_name(row["name"]) + "|" + next(iter(name_tokens(row["name"]) - {last_name(row["name"])}), "") for row in rows}
    for row in candidates or []:
        key = normalize_name(row["name"])
        last = last_name(row["name"])
        first = next(iter(name_tokens(row["name"]) - {last}), "")
        if key in have or f"{last}|{first}" in have_last_first:
            continue
        rows.append(row)
        have.add(key)
    rows.sort(key=lambda row: (row["name"].casefold(), row.get("group") or ""))
    return rows


def fetch_catalog(
    *,
    fact_book_cache: Any = None,
    candidates_cache: Any = None,
) -> list[dict[str, Any]]:
    fact_html = fetch_text(FACT_BOOK_URL, cache_path=fact_book_cache)
    candidates_html = fetch_text(CANDIDATES_URL, cache_path=candidates_cache)
    return merge_catalog(parse_fact_book_text(fact_html), parse_candidates_html(candidates_html))
