"""Fetch NASA people pages and extract day-precision birth dates."""

from __future__ import annotations

import html
import re
import zlib
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote, urljoin

from pipeline.astronauts.catalog import last_name, name_tokens
from pipeline.astronauts.dates import classify_nasa_date
from pipeline.http import fetch_bytes, fetch_json, fetch_text

NASA_PEOPLE_API = "https://www.nasa.gov/wp-json/wp/v2/people"
NASA_ORIGIN = "https://www.nasa.gov"

_TAGS = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")
_PDF_HREF = re.compile(
    r'href="(?P<href>[^"]+\.pdf[^"]*)"',
    re.IGNORECASE,
)
_MONTH = (
    r"(?P<month>January|February|March|April|May|June|July|August|"
    r"September|October|November|December)"
)
_DAY = r"(?P<day>\d{1,2})(?:st|nd|rd|th)?"
_YEAR = r"(?P<year>\d{4})"
_BORN_DAY = re.compile(
    rf"\bborn\b(?:\s*(?:on|in))?\s*{_MONTH}\s*{_DAY},?\s*{_YEAR}",
    re.IGNORECASE,
)
_BORN_DMY = re.compile(
    rf"\bborn\b(?:\s*(?:on|in))?\s*{_DAY}\s*{_MONTH},?\s*{_YEAR}",
    re.IGNORECASE,
)
_PERSONAL_DATA = re.compile(
    rf"PERSONAL\s*DATA:\s*Born\s*{_MONTH}\s*{_DAY},?\s*{_YEAR}",
    re.IGNORECASE,
)
_BORN_YEAR_ONLY = re.compile(
    r"\bborn\b(?:\s*(?:on|in))?\s*(?:in\s*)?(?P<year>\d{4})\b",
    re.IGNORECASE,
)
_BORN_PLACE_ONLY = re.compile(
    r"\bborn\b(?:\s+in)\s+(?P<place>[A-Z][^.;]{0,80})",
    re.IGNORECASE,
)
_DOB_LABEL = re.compile(
    rf"(?:date of birth|birth date|dob)\s*[:\-]\s*{_MONTH}\s*{_DAY},?\s*{_YEAR}",
    re.IGNORECASE,
)
_PDF_LITERAL = re.compile(rb"\((?:\\.|[^\\()])*\)")
_PDF_HEX = re.compile(rb"<([0-9A-Fa-f]{8,})>")
_PDF_STREAM = re.compile(rb"stream\r?\n?")


def strip_tags(value: str) -> str:
    return _WS.sub(" ", _TAGS.sub(" ", html.unescape(value))).strip()


def extract_birth_from_text(text: str) -> tuple[str, str | None]:
    """Return (kind, ISO) from NASA bio prose. Never invent a day."""
    cleaned = re.sub(r"(?i)\b[a-z]{2}-[A-Z]{2}", " ", text)
    cleaned = strip_tags(cleaned)
    personal = _PERSONAL_DATA.search(cleaned)
    if personal:
        return classify_nasa_date(
            f"{personal.group('month')} {personal.group('day')}, {personal.group('year')}"
        )
    labeled = _DOB_LABEL.search(cleaned)
    if labeled:
        return classify_nasa_date(
            f"{labeled.group('month')} {labeled.group('day')}, {labeled.group('year')}"
        )
    day = _BORN_DAY.search(cleaned)
    if day:
        return classify_nasa_date(f"{day.group('month')} {day.group('day')}, {day.group('year')}")
    dmy = _BORN_DMY.search(cleaned)
    if dmy:
        return classify_nasa_date(f"{dmy.group('month')} {dmy.group('day')}, {dmy.group('year')}")
    if _BORN_YEAR_ONLY.search(cleaned):
        return "year_only", None
    if _BORN_PLACE_ONLY.search(cleaned):
        return "missing", None
    return "missing", None


def extract_pdf_urls(html_text: str, *, page_url: str) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for match in _PDF_HREF.finditer(html_text):
        href = html.unescape(match.group("href")).strip()
        if not href:
            continue
        absolute = urljoin(page_url, href)
        if absolute in seen:
            continue
        seen.add(absolute)
        urls.append(absolute)
    return urls


def _unescape_pdf_literal(raw: bytes) -> str:
    piece = raw.decode("latin-1")
    if piece.startswith("(") and piece.endswith(")"):
        piece = piece[1:-1]
    piece = piece.replace("\\n", " ").replace("\\r", " ").replace("\\t", " ")
    piece = re.sub(r"\\([()\\])", r"\1", piece)
    return piece


def _decode_pdf_hex(hex_blob: str) -> str:
    compact = re.sub(r"\s+", "", hex_blob)
    if len(compact) % 2:
        return ""
    try:
        return bytes.fromhex(compact).decode("latin-1", errors="replace")
    except ValueError:
        return ""


def inflate_pdf_streams(raw: bytes) -> list[bytes]:
    """Decompress FlateDecode streams with the stdlib. Skip undecodable blobs."""
    streams: list[bytes] = []
    for match in _PDF_STREAM.finditer(raw):
        start = match.end()
        end = raw.find(b"endstream", start)
        if end < 0:
            continue
        data = raw[start:end]
        for suffix in (b"\r\n", b"\n", b"\r"):
            if data.endswith(suffix):
                data = data[: -len(suffix)]
                break
        inflated: bytes | None = None
        for wbits in (zlib.MAX_WBITS, -15):
            try:
                inflated = zlib.decompress(data, wbits)
                break
            except zlib.error:
                continue
        if inflated:
            streams.append(inflated)
    return streams


def join_pdf_literals(raw: bytes) -> str:
    """Concatenate PDF string literals in order (TJ arrays keep letter spacing)."""
    return "".join(_unescape_pdf_literal(match.group()) for match in _PDF_LITERAL.finditer(raw))


def pdf_text_candidates(raw: bytes) -> list[str]:
    """Reconstruct likely NASA bio prose from a PDF. Never invent tokens."""
    candidates: list[str] = []
    literals: list[str] = []
    for match in _PDF_LITERAL.finditer(raw):
        piece = _unescape_pdf_literal(match.group())
        if piece.strip():
            literals.append(piece)
    hex_bits: list[str] = []
    for match in _PDF_HEX.finditer(raw):
        decoded = _decode_pdf_hex(match.group(1).decode("ascii", errors="ignore"))
        if decoded.strip():
            hex_bits.append(decoded)
    candidates.extend(
        [
            " ".join(literals),
            "".join(literals),
            " ".join(hex_bits),
            raw.decode("latin-1", errors="replace"),
        ]
    )
    for stream in inflate_pdf_streams(raw):
        joined = join_pdf_literals(stream)
        if joined.strip():
            candidates.append(joined)
        if b"Tj" in stream or b"TJ" in stream:
            candidates.append(stream.decode("latin-1", errors="replace"))
    seen: set[str] = set()
    out: list[str] = []
    for text in candidates:
        if text and text not in seen:
            seen.add(text)
            out.append(text)
    return out


def pdf_plaintext(raw: bytes) -> str:
    """Best-effort text from a NASA bio PDF without extra dependencies."""
    candidates = pdf_text_candidates(raw)
    for text in candidates:
        kind, iso = extract_birth_from_text(text)
        if kind == "day" and iso:
            return text
    return candidates[0] if candidates else ""


def extract_birth_from_pdf(raw: bytes) -> tuple[str, str | None]:
    """Day-precision NASA PDF date if present. Never invent a day."""
    best_kind = "missing"
    for text in pdf_text_candidates(raw):
        kind, iso = extract_birth_from_text(text)
        if kind == "day" and iso:
            return kind, iso
        if kind == "year_only" and best_kind == "missing":
            best_kind = "year_only"
    return best_kind, None


def parse_people_payload(item: dict[str, Any]) -> dict[str, Any]:
    title = strip_tags(str((item.get("title") or {}).get("rendered") or item.get("slug") or ""))
    content = str((item.get("content") or {}).get("rendered") or "")
    link = str(item.get("link") or "")
    kind, iso = extract_birth_from_text(content)
    return {
        "name": title,
        "slug": str(item.get("slug") or ""),
        "nasa_url": link,
        "html": content,
        "nasa_birth_kind": kind,
        "nasa_birth_date": iso,
        "pdf_urls": extract_pdf_urls(content, page_url=link or NASA_ORIGIN),
    }


def _people_query(url: str, cache_path: Path | None) -> list[dict[str, Any]]:
    try:
        payload = fetch_json(url, cache_path=cache_path)
    except HTTPError as exc:
        if exc.code in {400, 404}:
            return []
        raise
    if not isinstance(payload, list):
        return []
    return [parse_people_payload(item) for item in payload if isinstance(item, dict)]


def fetch_people_by_slug(slug: str, *, cache_dir: Path | None = None) -> list[dict[str, Any]]:
    safe = slug or "slug"
    cache_path = (cache_dir / f"slug-{safe}.json") if cache_dir is not None else None
    url = f"{NASA_PEOPLE_API}?slug={quote(slug)}"
    return _people_query(url, cache_path)


def search_people(name: str, *, cache_dir: Path | None = None) -> list[dict[str, Any]]:
    cleaned = re.sub(r"[()]", " ", name)
    cleaned = _WS.sub(" ", cleaned).strip()
    safe = re.sub(r"[^a-z0-9]+", "-", cleaned.casefold()).strip("-") or "query"
    cache_path = (cache_dir / f"search-{safe}.json") if cache_dir is not None else None
    url = f"{NASA_PEOPLE_API}?search={quote(cleaned)}&per_page=10"
    return _people_query(url, cache_path)


def candidate_slugs(name: str, preferred: str) -> list[str]:
    slugs: list[str] = []
    seen: set[str] = set()
    tokens = [token for token in preferred.split("-") if token]
    guesses = [preferred]
    if len(tokens) >= 3:
        guesses.append(f"{tokens[0]}-{tokens[-1]}")
        guesses.append("-".join(tokens[:-1]))
    first = name.split()[0].casefold() if name.split() else ""
    last = name.split()[-1].casefold() if name.split() else ""
    if first and last:
        guesses.append(f"{first}-{last}")
    for slug in guesses:
        cleaned = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            slugs.append(cleaned)
    return slugs


def match_people_row(catalog_row: dict[str, Any], hits: list[dict[str, Any]]) -> dict[str, Any] | None:
    last = last_name(str(catalog_row.get("name") or ""))
    tokens = name_tokens(str(catalog_row.get("name") or ""))
    scored: list[tuple[int, dict[str, Any]]] = []
    for hit in hits:
        hit_last = last_name(str(hit.get("name") or ""))
        hit_tokens = name_tokens(str(hit.get("name") or ""))
        if last and hit_last and last != hit_last:
            continue
        overlap = len(tokens & hit_tokens)
        if overlap < 2:
            continue
        scored.append((overlap, hit))
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    best_len = scored[0][0]
    best = [row for length, row in scored if length == best_len]
    if len(best) != 1:
        # Prefer a hit whose page mentions astronaut when tied.
        astronaut = [row for row in best if "astronaut" in strip_tags(row.get("html") or "").casefold()]
        if len(astronaut) == 1:
            return astronaut[0]
        return None
    return best[0]


def fetch_nasa_page(
    url: str,
    *,
    name: str,
    slug: str,
    cache_dir: Path | None = None,
) -> dict[str, Any]:
    """Fetch a Fact Book–linked NASA HTML biography. Never invent a day."""
    cache_path = None
    if cache_dir is not None:
        safe = re.sub(r"[^a-z0-9]+", "-", url.casefold()).strip("-")[:80]
        cache_path = cache_dir / f"{safe}.html"
    try:
        html_text = fetch_text(url, cache_path=cache_path, timeout=30.0)
    except Exception:
        html_text = ""
    kind, iso = extract_birth_from_text(html_text) if html_text else ("missing", None)
    return {
        "name": name,
        "slug": slug,
        "nasa_url": url,
        "html": html_text,
        "nasa_birth_kind": kind,
        "nasa_birth_date": iso,
        "pdf_urls": extract_pdf_urls(html_text, page_url=url) if html_text else [],
    }


def enrich_with_pdf(
    parsed: dict[str, Any],
    *,
    cache_dir: Path | None = None,
) -> dict[str, Any]:
    """If the HTML date is missing, try linked NASA PDF bios."""
    if parsed.get("nasa_birth_kind") == "day" and parsed.get("nasa_birth_date"):
        return parsed
    for url in parsed.get("pdf_urls") or []:
        cache_path = None
        if cache_dir is not None:
            safe = re.sub(r"[^a-z0-9]+", "-", url.casefold()).strip("-")[:80]
            cache_path = cache_dir / f"{safe}.bin"
        try:
            raw = fetch_bytes(url, cache_path=cache_path, timeout=30.0)
        except Exception:
            continue
        kind, iso = extract_birth_from_pdf(raw)
        if kind == "day" and iso:
            parsed = dict(parsed)
            parsed["nasa_birth_kind"] = kind
            parsed["nasa_birth_date"] = iso
            parsed["nasa_pdf_url"] = url
            return parsed
        if kind == "year_only" and parsed.get("nasa_birth_kind") == "missing":
            parsed = dict(parsed)
            parsed["nasa_birth_kind"] = "year_only"
    return parsed
