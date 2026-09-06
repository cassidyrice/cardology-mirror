"""Parse named humans from the Wikipedia TIME Person of the Year list.

Identity is the Choice column in the Person(s) of the Year table.
Duals / joint years with a separate Choice row per person are split.
Abstractions, machines, and groups-as-concepts stay out — including
years that only name people in Notes (“represented by”, “spotlights”).
TIME vault pages are context only and are never parsed here.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

LIST_TITLE = "Time_Person_of_the_Year"
LIST_URL = "https://en.wikipedia.org/wiki/Time_Person_of_the_Year"
TIME_HOME = "https://time.com/"
TIME_VAULT = "https://time.com/vault/"
TIME_POTY = "https://time.com/person-of-the-year/"

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_SORTNAME_RE = re.compile(
    r"\{\{\s*sortname\s*\|\s*([^|}]+)\s*\|\s*([^|}]+)(?:\s*\|\s*([^|}]*))?(?:\s*\|\s*([^|}]*))?",
    re.IGNORECASE,
)
_SORT_RE = re.compile(r"\{\{\s*sort\s*\|", re.IGNORECASE)
_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_YEAR_RE = re.compile(r"\b(19\d{2}|20[0-2]\d)\b")
_TAG_RE = re.compile(r"<[^>]+>")
_BOLD_ITALIC_RE = re.compile(r"'{2,}")
_SKIP_TITLE_PREFIXES = (
    "file:",
    "image:",
    "category:",
    "wikipedia:",
    "template:",
    "help:",
    "special:",
)
_SKIP_TITLE_SUBSTR = (
    "person of the year",
    "time (magazine)",
    "personal computer",
    "artificial intelligence",
    "middle america",
    "baby boomer",
    "ebola virus",
    "military of the united states",
    "science and technology in the united states",
    "environmentalism",
    "whistleblower",
    "apollo 8",
    "astronaut",
)
_SORT_TEMPLATE_RE = re.compile(
    r"\{\{\s*sort\s*\|\s*([^}|]+?)(?:\s*\|\s*([^}]+?))?\s*\}\}",
    re.IGNORECASE | re.DOTALL,
)
_REPRESENTED_BY_RE = re.compile(r"Represented by\b", re.IGNORECASE)
_CONCEPT_TITLE_RE = re.compile(
    r"\b(revolution|war|uprising|movement|computer|earth|soldier|fighter|"
    r"scientist|protester|guardian|inheritor|ebola|architect|whistleblower|"
    r"peacemaker|samaritan|astronaut|freedom fighter|fighting.man|spirit of)\b",
    re.IGNORECASE,
)
_NA_RE = re.compile(r"\{\{\s*N/A\s*\}\}", re.IGNORECASE)

COLUMNS = 6  # year, image, choice, lifetime, notes, runners-up


def _clean_label(value: str) -> str:
    text = _BOLD_ITALIC_RE.sub("", value)
    text = _TAG_RE.sub("", text)
    text = re.sub(r"\{\{[^}]*\}\}", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" ,;")
    text = re.sub(r"\s+\(\d+\)\s*$", "", text)
    return text


def _wikilink_parts(title: str, display: str | None) -> tuple[str, str]:
    page = title.replace("_", " ").strip()
    label = _clean_label(display or page)
    return page, label


def _skip_title(title: str) -> bool:
    lowered = title.lower().strip()
    if not lowered:
        return True
    if any(lowered.startswith(prefix) for prefix in _SKIP_TITLE_PREFIXES):
        return True
    return any(part in lowered for part in _SKIP_TITLE_SUBSTR)


def parse_sortname(cell: str) -> tuple[str, str] | None:
    match = _SORTNAME_RE.search(cell)
    if not match:
        return None
    first = _clean_label(match.group(1))
    last = _clean_label(match.group(2))
    article = _clean_label(match.group(3) or "")
    name = f"{first} {last}".strip()
    title = article or name
    if not name or not title:
        return None
    return name, title


def parse_person_link(cell: str) -> tuple[str, str] | None:
    named = parse_sortname(cell)
    if named:
        return named
    for match in _WIKILINK_RE.finditer(cell):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        if _skip_title(title):
            continue
        if not name:
            continue
        return name, title
    return None


def parse_sort_display(cell: str) -> str | None:
    match = _SORT_TEMPLATE_RE.search(cell)
    if not match:
        return None
    display = _clean_label(match.group(2) or match.group(1) or "")
    display = _WIKILINK_RE.sub(lambda m: _wikilink_parts(m.group(1), m.group(2))[1], display)
    display = _clean_label(display)
    return display or None


def parse_concept_label(cell: str) -> str:
    named = parse_person_link(cell)
    if named:
        return named[0]
    display = parse_sort_display(cell)
    if display:
        return display
    cleaned = _clean_label(re.sub(r"\{\{[^}]+\}\}", " ", cell))
    return cleaned or "unnamed concept"


def _clause_before_outer_period(text: str) -> str:
    depth = 0
    i = 0
    while i < len(text):
        if text.startswith("[[", i):
            depth += 1
            i += 2
            continue
        if text.startswith("]]", i) and depth:
            depth -= 1
            i += 2
            continue
        if text[i] == "." and depth == 0:
            return text[:i]
        i += 1
    return text[:400]


def parse_represented_by(notes: str) -> list[tuple[str, str]]:
    """Named honorees listed as 'Represented by A, B, and C.' — not cover spotlights."""
    if not notes:
        return []
    match = _REPRESENTED_BY_RE.search(notes)
    if not match:
        return []
    clause = _clause_before_outer_period(notes[match.end() :])
    people: list[tuple[str, str]] = []
    seen: set[str] = set()
    for link in _WIKILINK_RE.finditer(clause):
        title, name = _wikilink_parts(link.group(1), link.group(2))
        if _skip_title(title) or _CONCEPT_TITLE_RE.search(title) or title in seen:
            continue
        seen.add(title)
        people.append((name, title))
    return people


def choice_is_concept(cell: str) -> bool:
    """{{sort|...}} without sortname is a class/idea unless the wikilink is a person."""
    if parse_sortname(cell):
        return False
    if not _SORT_RE.search(cell):
        return False
    named = parse_person_link(cell)
    if named is None:
        return True
    _name, title = named
    if _skip_title(title) or _CONCEPT_TITLE_RE.search(title):
        return True
    return False


_LIFETIME_PERSON_RE = re.compile(
    r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]\s*:\s*\d{4}",
)


def parse_lifetime_people(lifetime: str) -> list[tuple[str, str]]:
    """Apollo 8-style Lifetime lines: [[Name]]: 1928–2023. Never notes/spotlights."""
    if not lifetime or _NA_RE.search(lifetime):
        return []
    people: list[tuple[str, str]] = []
    seen: set[str] = set()
    for link in _LIFETIME_PERSON_RE.finditer(lifetime):
        title, name = _wikilink_parts(link.group(1), link.group(2))
        if _skip_title(title) or title in seen:
            continue
        seen.add(title)
        people.append((name, title))
    return people


def parse_year(cell: str | None) -> str | None:
    if not cell:
        return None
    match = _YEAR_RE.search(cell)
    return match.group(1) if match else None


def poty_section(wikitext: str) -> str:
    start = wikitext.find("==Person(s) of the Year==")
    if start < 0:
        start = wikitext.find("==Persons of the Year==")
    if start < 0:
        return ""
    end = len(wikitext)
    for marker in (
        "\n== Other categories ==",
        "\n==Other categories==",
        "\n==Online poll==",
        "\n==See also==",
        "\n==References==",
    ):
        idx = wikitext.find(marker, start + 10)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def _split_row_cells(chunk: str) -> list[str]:
    text = chunk.strip()
    text = re.sub(r"^id\s*=\s*\"[^\"]+\"\s*", "", text, count=1)
    if text.startswith("|-"):
        text = re.sub(r"^\|-[^\n]*\n?", "", text, count=1)
    cells: list[str] = []
    buf: list[str] = []
    i = 0
    template_depth = 0
    link_depth = 0
    while i < len(text):
        if text.startswith("{{", i):
            template_depth += 1
            buf.append("{{")
            i += 2
            continue
        if text.startswith("}}", i) and template_depth:
            template_depth -= 1
            buf.append("}}")
            i += 2
            continue
        if text.startswith("[[", i):
            link_depth += 1
            buf.append("[[")
            i += 2
            continue
        if text.startswith("]]", i) and link_depth:
            link_depth -= 1
            buf.append("]]")
            i += 2
            continue
        if template_depth == 0 and link_depth == 0:
            if text.startswith("||", i):
                cells.append("".join(buf).strip())
                buf = []
                i += 2
                continue
            if text[i] in {"|", "!"} and (i == 0 or text[i - 1] == "\n"):
                if buf:
                    cells.append("".join(buf).strip())
                    buf = []
                i += 1
                continue
        buf.append(text[i])
        i += 1
    if buf:
        cells.append("".join(buf).strip())
    return cells


def _cell_rowspan_and_content(cell: str) -> tuple[int, str]:
    rowspan = 1
    match = re.search(r"rowspan\s*=\s*\"?(\d+)\"?", cell, re.IGNORECASE)
    if match:
        rowspan = int(match.group(1))
    template_depth = 0
    link_depth = 0
    split_at: int | None = None
    i = 0
    while i < len(cell):
        if cell.startswith("{{", i):
            template_depth += 1
            i += 2
            continue
        if cell.startswith("}}", i) and template_depth:
            template_depth -= 1
            i += 2
            continue
        if cell.startswith("[[", i):
            link_depth += 1
            i += 2
            continue
        if cell.startswith("]]", i) and link_depth:
            link_depth -= 1
            i += 2
            continue
        if cell[i] == "|" and template_depth == 0 and link_depth == 0:
            left = cell[:i].strip().lower()
            if left and re.match(
                r"^(?:rowspan|colspan|scope|class|style|id|align|!\s*scope)\b",
                left,
            ):
                split_at = i
                break
            if i == 0:
                split_at = 0
                break
        i += 1
    content = cell[split_at + 1 :].strip() if split_at is not None else cell.strip()
    content = re.sub(r"^scope=\"row\"\s*\|?\s*", "", content, flags=re.IGNORECASE)
    return rowspan, content


def _is_header_chunk(chunk: str) -> bool:
    if "scope=\"col\"" in chunk or "scope='col'" in chunk:
        return True
    return bool(re.search(r"^!\s*scope=\"col\"", chunk, re.M))


def parse_choice_rows(wikitext: str) -> list[dict[str, Any]]:
    """One row per Choice cell in the Person(s) of the Year table."""
    section = poty_section(wikitext)
    table_start = section.find("{|")
    if table_start < 0:
        return []
    table = section[table_start:]
    chunks = re.split(r"\n\|-[^\n]*\n", table)
    remaining = [0] * COLUMNS
    cached = [""] * COLUMNS
    rows: list[dict[str, Any]] = []

    for chunk in chunks:
        if _is_header_chunk(chunk):
            continue
        cells = _split_row_cells(chunk)
        if not cells:
            continue
        values = [""] * COLUMNS
        cell_iter = iter(cells)
        for col in range(COLUMNS):
            if remaining[col] > 0:
                values[col] = cached[col]
                remaining[col] -= 1
                continue
            try:
                raw = next(cell_iter)
            except StopIteration:
                values[col] = ""
                continue
            rowspan, content = _cell_rowspan_and_content(raw)
            values[col] = content
            if rowspan > 1:
                remaining[col] = rowspan - 1
                cached[col] = content

        year = parse_year(values[0])
        if year is None:
            continue
        choice = values[2]
        lifetime = values[3]
        notes = values[4]
        if not choice.strip():
            continue
        named = None if choice_is_concept(choice) else (parse_sortname(choice) or parse_person_link(choice))
        if named is not None:
            name, title = named
            rows.append(
                {
                    "year": year,
                    "kind": "person",
                    "name": name,
                    "enwiki_title": title,
                    "choice_label": name,
                    "wikipedia_list_url": LIST_URL,
                }
            )
            continue

        label = parse_concept_label(choice) or f"{year} unnamed choice"
        represented = parse_represented_by(notes)
        lifetime_people = parse_lifetime_people(lifetime)
        named_honorees = represented or lifetime_people
        if named_honorees:
            for name, title in named_honorees:
                rows.append(
                    {
                        "year": year,
                        "kind": "person",
                        "name": name,
                        "enwiki_title": title,
                        "choice_label": label,
                        "wikipedia_list_url": LIST_URL,
                    }
                )
            continue
        rows.append(
            {
                "year": year,
                "kind": "concept",
                "name": label,
                "enwiki_title": "",
                "choice_label": label,
                "wikipedia_list_url": LIST_URL,
            }
        )
    return rows


def flatten_people(choice_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """One person per Wikipedia title. Concepts stay on the held list."""
    year_counts: dict[str, int] = {}
    for row in choice_rows:
        if row["kind"] == "person":
            year_counts[row["year"]] = year_counts.get(row["year"], 0) + 1

    people: dict[str, dict[str, Any]] = {}
    concepts: list[dict[str, Any]] = []
    for row in choice_rows:
        if row["kind"] != "person":
            concepts.append(
                {
                    "year": row["year"],
                    "name": row["name"],
                    "choice_label": row["choice_label"],
                    "reason": "concept",
                }
            )
            continue
        shared = year_counts.get(row["year"], 0) > 1
        honor = {
            "year": row["year"],
            "choice_label": row["choice_label"],
            "shared": shared,
            "wikipedia_list_url": LIST_URL,
            "time_context_url": TIME_VAULT,
        }
        key = row["enwiki_title"]
        if key not in people:
            people[key] = {
                "name": row["name"],
                "enwiki_title": row["enwiki_title"],
                "honors": [honor],
            }
        else:
            people[key]["honors"].append(honor)
            if not people[key]["name"] and row["name"]:
                people[key]["name"] = row["name"]

    out = list(people.values())
    for person in out:
        person["honors"].sort(key=lambda item: item["year"])
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    concepts.sort(key=lambda item: (item["year"], item["name"]))
    return out, concepts


def resolve_enwiki_title(title: str, *, cache_path=None) -> str:
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


def fetch_list_wikitext(*, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(LIST_TITLE, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_honoree_people(*, cache_dir=None) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str]:
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{LIST_TITLE}.json"
    wikitext = fetch_list_wikitext(cache_path=cache_path)
    choice_rows = parse_choice_rows(wikitext)
    people, concepts = flatten_people(choice_rows)
    return people, concepts, wikitext
