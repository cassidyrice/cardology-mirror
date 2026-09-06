"""Parse performer inductees from the Wikipedia Rock Hall list.

Winner identity comes from the Wikipedia performers table, which cites
RockHall.com induction pages. Birth dates are not on this list.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

LIST_TITLE = "List_of_Rock_and_Roll_Hall_of_Fame_inductees"
LIST_URL = "https://en.wikipedia.org/wiki/List_of_Rock_and_Roll_Hall_of_Fame_inductees"
ROCKHALL_HOME = "https://www.rockhall.com/inductees"
ROCKHALL_INDUCTION = "https://www.rockhall.com/inductees/induction-process"
CATEGORY = "Performers"
CATEGORY_ID = "performers"

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_SORTNAME_RE = re.compile(
    r"\{\{\s*sortname\s*\|\s*([^|}]+)\s*\|\s*([^|}]+)",
    re.IGNORECASE,
)
_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_YEAR_RE = re.compile(r"\b(19[8-9]\d|20[0-2]\d)\b")
_ROCKHALL_RE = re.compile(
    r"https?://(?:www\.)?rockhall\.com/[A-Za-z0-9_./-]+",
    re.IGNORECASE,
)
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
    "rock and roll hall of fame",
    "rock & roll hall of fame",
    "hall of fame inductee",
)

COLUMNS = 6  # year, image, name, inducted members, nominations, presenter


def _wikilink_parts(title: str, display: str | None) -> tuple[str, str]:
    page = title.replace("_", " ").strip()
    label = (display or page).strip()
    label = re.sub(r"'{2,}", "", label)
    label = re.sub(r"<[^>]+>", "", label)
    label = re.sub(r"\s+", " ", label).strip()
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
    first = re.sub(r"\s+", " ", match.group(1)).strip()
    last = re.sub(r"\s+", " ", match.group(2)).strip()
    name = f"{first} {last}".strip()
    if not name:
        return None
    return name, name


def parse_first_person_link(cell: str) -> tuple[str, str] | None:
    named = parse_sortname(cell)
    if named:
        return named
    for match in _WIKILINK_RE.finditer(cell):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        if _skip_title(title):
            continue
        return name, title
    return None


def parse_member_links(cell: str) -> list[dict[str, str]]:
    members: list[dict[str, str]] = []
    seen: set[str] = set()
    for match in _WIKILINK_RE.finditer(cell or ""):
        title, name = _wikilink_parts(match.group(1), match.group(2))
        if _skip_title(title) or title in seen:
            continue
        seen.add(title)
        members.append({"name": name, "enwiki_title": title})
    return members


def parse_year(cell: str | None) -> str | None:
    if not cell:
        return None
    match = _YEAR_RE.search(cell)
    return match.group(1) if match else None


def parse_rockhall_url(text: str | None) -> str | None:
    if not text:
        return None
    for match in _ROCKHALL_RE.finditer(text):
        url = match.group(0).rstrip(").,;\"'")
        lowered = url.lower()
        if "induction-process" in lowered:
            continue
        if lowered.rstrip("/") in {"https://www.rockhall.com/inductees", "https://rockhall.com/inductees"}:
            continue
        return url
    return None


def _split_row_cells(chunk: str) -> list[str]:
    text = chunk.strip()
    if text.startswith("|-"):
        text = text[2:].lstrip()
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
            if text[i] == "|" and (i == 0 or text[i - 1] == "\n"):
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
            if left and re.match(r"^(?:rowspan|colspan|scope|class|style|id|align)\b", left):
                split_at = i
                break
            if i == 0:
                split_at = 0
                break
        i += 1
    content = cell[split_at + 1 :].strip() if split_at is not None else cell.strip()
    return rowspan, content


def performers_section(wikitext: str) -> str:
    start = wikitext.find("=== Performers ===")
    if start < 0:
        start = wikitext.find("===Performers===")
    if start < 0:
        return ""
    end_markers = (
        "=== Musical influence ===",
        "===Musical influence===",
        "=== Early influences ===",
        "=== Non-performers",
        "===Non-performers",
    )
    end = len(wikitext)
    for marker in end_markers:
        idx = wikitext.find(marker, start + 10)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def parse_performer_acts(wikitext: str) -> list[dict[str, Any]]:
    """One row per inducted act in the Performers table."""
    section = performers_section(wikitext)
    table_start = section.find("{|")
    if table_start < 0:
        return []
    table = section[table_start:]
    chunks = re.split(r"\n\|-\s*\n", table)
    remaining = [0] * COLUMNS
    cached = [""] * COLUMNS
    acts: list[dict[str, Any]] = []

    for chunk in chunks:
        if "scope=\"col\"" in chunk or re.search(r"^!\s*scope=\"col\"", chunk, re.M):
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
        named = parse_first_person_link(values[2])
        if year is None or named is None:
            continue
        name, title = named
        members = parse_member_links(values[3])
        rockhall_url = parse_rockhall_url(chunk) or parse_rockhall_url(values[3])
        kind = "group" if members else "solo"
        acts.append(
            {
                "year": year,
                "name": name,
                "enwiki_title": title,
                "kind": kind,
                "members": members,
                "rockhall_url": rockhall_url or ROCKHALL_HOME,
                "category": CATEGORY,
                "category_id": CATEGORY_ID,
                "wikipedia_list_url": LIST_URL,
            }
        )
    return acts


def expand_people(acts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Prefer individuals. Expand group members listed on the Wikipedia table."""
    people: dict[str, dict[str, Any]] = {}
    for act in acts:
        members = list(act.get("members") or [])
        if members:
            sources = members
            role = "member"
        else:
            sources = [{"name": act["name"], "enwiki_title": act["enwiki_title"]}]
            role = "solo"
        for source in sources:
            title = source["enwiki_title"]
            induction = {
                "year": act["year"],
                "act": act["name"],
                "act_wikipedia_title": act["enwiki_title"],
                "category": CATEGORY,
                "category_id": CATEGORY_ID,
                "role": role,
                "rockhall_url": act.get("rockhall_url") or ROCKHALL_HOME,
            }
            if title not in people:
                people[title] = {
                    "name": source["name"],
                    "enwiki_title": title,
                    "inductions": [induction],
                    "roles": [role],
                    "act_kinds": [act["kind"]],
                }
            else:
                people[title]["inductions"].append(induction)
                if role not in people[title]["roles"]:
                    people[title]["roles"].append(role)
                if act["kind"] not in people[title]["act_kinds"]:
                    people[title]["act_kinds"].append(act["kind"])
                if not people[title]["name"] and source["name"]:
                    people[title]["name"] = source["name"]
    out = list(people.values())
    for person in out:
        person["inductions"].sort(key=lambda item: (item["year"], item["act"], item["role"]))
        person["primary_role"] = "solo" if "solo" in person["roles"] else "member"
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    return out


def fetch_list_wikitext(*, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(LIST_TITLE, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_inductee_people(*, cache_dir=None) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str]:
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{LIST_TITLE}.json"
    wikitext = fetch_list_wikitext(cache_path=cache_path)
    acts = parse_performer_acts(wikitext)
    return expand_people(acts), acts, wikitext
