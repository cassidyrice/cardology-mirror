"""Parse Kennedy Center Honors recipients from the Wikipedia roster.

Honoree identity comes from the Wikipedia Recipients tables, which cite
Kennedy Center honors pages. Birth dates are not on this list. Groups and
collectives expand only Wikipedia-listed members (usually the efn roster).
Institutions without listed people are recorded so harvest can drop them.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_json

LIST_TITLE = "Kennedy_Center_Honors"
LIST_URL = "https://en.wikipedia.org/wiki/Kennedy_Center_Honors"
KC_HOME = "https://www.kennedy-center.org/whats-on/honors/"
KC_ARTISTS = "https://www.kennedy-center.org/artists/"

_WIKITEXT_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse&page={title}&prop=wikitext&format=json"
)

_WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
_YEAR_RE = re.compile(r"\b(19(?:7[8-9]|[89]\d)|20[0-2]\d)\b")
_KC_RE = re.compile(
    r"https?://(?:www\.)?kennedy-center\.org/[A-Za-z0-9_./#%-]+",
    re.IGNORECASE,
)
_RESCINDED_RE = re.compile(r"rescind", re.IGNORECASE)
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
    "kennedy center honors",
    "kennedy center honoree",
    "white house",
    "first lady",
    "united states secretary",
    "secretary of state",
)
_INSTITUTION_TITLES = {
    "apollo theater",
}

_CITE_TEMPLATES = ("cite ", "citation", "harvard", "sfn")


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
    if re.fullmatch(r"\d{4}", lowered):
        return True
    return any(part in lowered for part in _SKIP_TITLE_SUBSTR)


def parse_kc_url(text: str | None) -> str | None:
    if not text:
        return None
    for match in _KC_RE.finditer(text):
        url = match.group(0).rstrip(").,;\"'")
        lowered = url.lower()
        if "press-release" in lowered and lowered.endswith(".pdf"):
            continue
        return url
    return None


def recipients_section(wikitext: str) -> str:
    start = wikitext.find("==Recipients==")
    if start < 0:
        start = wikitext.find("== Recipients ==")
    if start < 0:
        return ""
    end = len(wikitext)
    for marker in (
        "\n==Prospective honorees",
        "\n== Prospective honorees",
        "\n==See also==",
        "\n== See also ==",
        "\n==Notes==",
        "\n== Notes ==",
        "\n==References==",
    ):
        idx = wikitext.find(marker, start + 10)
        if 0 <= idx < end:
            end = idx
    return wikitext[start:end]


def _extract_tables(section: str) -> list[str]:
    tables: list[str] = []
    start = 0
    while True:
        idx = section.find("{|", start)
        if idx < 0:
            break
        depth = 0
        i = idx
        while i < len(section):
            if section.startswith("{|", i):
                depth += 1
                i += 2
                continue
            if section.startswith("|}", i):
                depth -= 1
                i += 2
                if depth == 0:
                    tables.append(section[idx:i])
                    start = i
                    break
                continue
            i += 1
        else:
            tables.append(section[idx:])
            break
    return tables


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
    return [cell for cell in cells if cell != ""]


def _cell_content(cell: str) -> str:
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
    return cell[split_at + 1 :].strip() if split_at is not None else cell.strip()


def _scan_template(text: str, start: int) -> tuple[str, int]:
    if not text.startswith("{{", start):
        return "", start
    depth = 0
    i = start
    while i < len(text):
        if text.startswith("{{", i):
            depth += 1
            i += 2
            continue
        if text.startswith("}}", i):
            depth -= 1
            i += 2
            if depth == 0:
                return text[start:i], i
            continue
        i += 1
    return text[start:], len(text)


def _scan_link(text: str, start: int) -> tuple[str, int]:
    if not text.startswith("[[", start):
        return "", start
    depth = 0
    i = start
    while i < len(text):
        if text.startswith("[[", i):
            depth += 1
            i += 2
            continue
        if text.startswith("]]", i):
            depth -= 1
            i += 2
            if depth == 0:
                return text[start:i], i
            continue
        i += 1
    return text[start:], len(text)


def _template_name(raw: str) -> str:
    inner = raw[2:]
    cut = re.split(r"[|:\n]", inner, maxsplit=1)[0]
    return cut.strip().lower()


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


def parse_honoree_slots(cell: str) -> list[dict[str, Any]]:
    """Top-level honoree links in a year cell. efn members expand a group."""
    slots: list[dict[str, Any]] = []
    i = 0
    while i < len(cell):
        if cell.startswith("{{", i):
            raw, nxt = _scan_template(cell, i)
            name = _template_name(raw)
            if name.startswith(_CITE_TEMPLATES) or name in {"refn", "ref"}:
                i = nxt
                continue
            i = nxt
            continue
        if cell.startswith("[[", i):
            raw, nxt = _scan_link(cell, i)
            match = _WIKILINK_RE.search(raw)
            i = nxt
            if not match:
                continue
            title, name = _wikilink_parts(match.group(1), match.group(2))
            if _skip_title(title):
                continue
            rest = re.sub(r"^[\s'\"`,.;:]+", "", cell[nxt:])
            efn_match = re.match(r"\{\{\s*efn\b", rest, re.IGNORECASE)
            efn_raw = ""
            if efn_match:
                efn_raw, _efn_end = _scan_template(rest, rest.find("{{"))
            members = parse_member_links(efn_raw) if efn_raw else []
            members = [item for item in members if item["enwiki_title"] != title]
            rescinded = bool(efn_raw and _RESCINDED_RE.search(efn_raw))
            if rescinded:
                members = []
                kind = "rescinded"
            elif members:
                kind = "group"
            elif title.lower() in _INSTITUTION_TITLES:
                kind = "institution"
            else:
                kind = "solo"
            slots.append(
                {
                    "name": name,
                    "enwiki_title": title,
                    "kind": kind,
                    "members": members,
                    "rescinded": rescinded,
                }
            )
            continue
        i += 1
    return slots


def parse_year_cell(cell: str) -> str | None:
    match = _YEAR_RE.search(cell or "")
    return match.group(1) if match else None


def parse_recipient_acts(wikitext: str) -> list[dict[str, Any]]:
    """One row per billed honoree slot (person, duo member, group, or institution)."""
    section = recipients_section(wikitext)
    acts: list[dict[str, Any]] = []
    for table in _extract_tables(section):
        for chunk in re.split(r"\n\|-\s*\n", table):
            if "scope=\"col\"" in chunk or re.search(r"^!\s*(?:scope=\"col\"|Year)", chunk, re.M):
                continue
            cells = [_cell_content(cell) for cell in _split_row_cells(chunk)]
            if not cells:
                continue
            year = parse_year_cell(cells[0])
            if year is None and len(cells) > 1:
                year = parse_year_cell(cells[0] + " " + cells[1])
            if year is None:
                continue
            honorees = cells[1] if len(cells) > 1 else ""
            if not honorees or not _WIKILINK_RE.search(honorees):
                continue
            kc_url = parse_kc_url(chunk) or KC_HOME
            for slot in parse_honoree_slots(honorees):
                acts.append(
                    {
                        "year": year,
                        "name": slot["name"],
                        "enwiki_title": slot["enwiki_title"],
                        "kind": slot["kind"],
                        "members": slot["members"],
                        "rescinded": slot["rescinded"],
                        "kennedy_center_url": kc_url,
                        "wikipedia_list_url": LIST_URL,
                    }
                )
    return acts


def expand_people(acts: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Prefer individuals. Expand listed group/collective members only."""
    people: dict[str, dict[str, Any]] = {}
    dropped: list[dict[str, Any]] = []
    for act in acts:
        if act.get("rescinded") or act.get("kind") == "rescinded":
            dropped.append(
                {
                    "name": act.get("name"),
                    "enwiki_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "reason": "rescinded",
                    "kind": "rescinded",
                }
            )
            continue
        members = list(act.get("members") or [])
        if act.get("kind") == "institution" and not members:
            dropped.append(
                {
                    "name": act.get("name"),
                    "enwiki_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "reason": "institution",
                    "kind": "institution",
                }
            )
            continue
        if members:
            sources = members
            role = "member"
        elif act.get("kind") == "group":
            dropped.append(
                {
                    "name": act.get("name"),
                    "enwiki_title": act.get("enwiki_title"),
                    "year": act.get("year"),
                    "reason": "band_no_listed_members",
                    "kind": "group",
                }
            )
            continue
        else:
            sources = [{"name": act["name"], "enwiki_title": act["enwiki_title"]}]
            role = "solo"
        for source in sources:
            title = source["enwiki_title"]
            honor = {
                "year": act["year"],
                "act": act["name"],
                "act_wikipedia_title": act["enwiki_title"],
                "role": role,
                "kennedy_center_url": act.get("kennedy_center_url") or KC_HOME,
            }
            if title not in people:
                people[title] = {
                    "name": source["name"],
                    "enwiki_title": title,
                    "honors": [honor],
                    "roles": [role],
                    "act_kinds": [act["kind"]],
                }
            else:
                people[title]["honors"].append(honor)
                if role not in people[title]["roles"]:
                    people[title]["roles"].append(role)
                if act["kind"] not in people[title]["act_kinds"]:
                    people[title]["act_kinds"].append(act["kind"])
                if not people[title]["name"] and source["name"]:
                    people[title]["name"] = source["name"]
    out = list(people.values())
    for person in out:
        person["honors"].sort(key=lambda item: (item["year"], item["act"], item["role"]))
        person["primary_role"] = "solo" if "solo" in person["roles"] else "member"
    out.sort(key=lambda item: (item["name"].lower(), item["enwiki_title"]))
    return out, dropped


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


def fetch_list_wikitext(*, cache_path=None) -> str:
    url = _WIKITEXT_URL.format(title=quote(LIST_TITLE, safe="_"))
    payload = fetch_json(url, cache_path=cache_path)
    return ((payload.get("parse") or {}).get("wikitext") or {}).get("*") or ""


def fetch_honoree_people(*, cache_dir=None) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], str]:
    cache_path = None
    if cache_dir is not None:
        cache_path = cache_dir / f"{LIST_TITLE}.json"
    wikitext = fetch_list_wikitext(cache_path=cache_path)
    acts = parse_recipient_acts(wikitext)
    people, dropped = expand_people(acts)
    return people, acts, dropped, wikitext
