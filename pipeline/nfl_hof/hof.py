"""Fetch ProFootballHOF.com biography pages for optional DOB verify."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

from pipeline.http import fetch_text
from pipeline.nfl_hof.catalog import hof_url
from pipeline.nfl_hof.dates import parse_hof_html

HOF_HOME = "https://www.profootballhof.com/"


def fetch_hof_bio(
    hof_id: str,
    *,
    cache_dir,
    name: str = "",
) -> dict[str, Any]:
    slug = hof_id.strip().strip("/")
    url = hof_url(slug)
    safe = quote(slug, safe="")
    cache_path = cache_dir / f"{safe}.html" if cache_dir is not None else None
    try:
        html = fetch_text(url, cache_path=cache_path, timeout=25.0, sleep_s=0.15)
    except Exception as exc:  # noqa: BLE001 — verify is optional ("where needed")
        return {
            "name": name,
            "hof_id": slug,
            "hof_url": url,
            "html": "",
            "hof_birth_kind": "missing",
            "hof_birth_date": None,
            "error": f"{type(exc).__name__}: {exc}",
        }
    kind, iso = parse_hof_html(html)
    return {
        "name": name,
        "hof_id": slug,
        "hof_url": url,
        "html": html,
        "hof_birth_kind": kind,
        "hof_birth_date": iso,
        "error": None,
    }
