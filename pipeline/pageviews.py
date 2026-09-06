"""Wikimedia pageviews top/en.wikipedia — monthly tops, dedupe, junk filter."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from pipeline.http import fetch_json

TOP_URL = (
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/"
    "en.wikipedia/all-access/{year}/{month:02d}/all-days"
)

JUNK_EXACT = {"Main_Page", "-", "Wikidata", "404.php"}
JUNK_PREFIXES = (
    "Special:",
    "Wikipedia:",
    "File:",
    "Portal:",
    "Template:",
    "Category:",
    "Help:",
    "Talk:",
    "User:",
    "User_talk:",
    "Wikipedia_talk:",
    "MediaWiki:",
    "Module:",
    "Draft:",
    "TimedText:",
    "Media:",
    "WP:",
    "MOS:",
    "Template_talk:",
    "Category_talk:",
)
YEAR_ONLY = re.compile(r"^\d{4}$")
YEAR_IN = re.compile(r"^\d{4}_in_", re.IGNORECASE)
DEATHS_IN = re.compile(r"^Deaths_in_\d{4}$", re.IGNORECASE)
MONTH_YEAR = re.compile(
    r"^(January|February|March|April|May|June|July|August|September|October|November|December)_\d{4}$"
)


def is_junk_title(title: str) -> bool:
    normalized = title.replace(" ", "_")
    if normalized in JUNK_EXACT:
        return True
    if any(normalized.startswith(prefix) for prefix in JUNK_PREFIXES):
        return True
    if YEAR_ONLY.match(normalized) or YEAR_IN.match(normalized) or DEATHS_IN.match(normalized):
        return True
    if MONTH_YEAR.match(normalized):
        return True
    return False


def month_window(
    n: int,
    end_year: int | None = None,
    end_month: int | None = None,
) -> list[tuple[int, int]]:
    if n < 1:
        raise ValueError("n must be >= 1")
    today = date.today()
    year = end_year if end_year is not None else today.year
    month = end_month if end_month is not None else today.month
    months: list[tuple[int, int]] = []
    for _ in range(n):
        months.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def dedupe_titles(rows: list[dict]) -> list[dict]:
    totals: dict[str, dict] = {}
    for row in rows:
        title = str(row["title"]).replace(" ", "_")
        if is_junk_title(title):
            continue
        views = int(row.get("views") or 0)
        current = totals.get(title)
        if current is None:
            totals[title] = {"title": title, "views": views}
        else:
            current["views"] += views
    return sorted(totals.values(), key=lambda item: (-item["views"], item["title"]))


def fetch_month(year: int, month: int, *, cache_dir: Path | None = None) -> list[dict]:
    url = TOP_URL.format(year=year, month=month)
    cache_path = None
    if cache_dir is not None:
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"top-{year}-{month:02d}.json"
    payload = fetch_json(url, cache_path=cache_path)
    items = payload.get("items") or []
    articles = items[0].get("articles") if items else []
    rows: list[dict] = []
    for article in articles or []:
        rows.append(
            {
                "title": article.get("article") or "",
                "views": int(article.get("views") or 0),
                "year": year,
                "month": month,
            }
        )
    return rows


def collect_pageviews(
    months: int = 8,
    *,
    end_year: int | None = None,
    end_month: int | None = None,
    cache_dir: Path | None = None,
) -> list[dict]:
    rows: list[dict] = []
    for year, month in month_window(months, end_year=end_year, end_month=end_month):
        rows.extend(fetch_month(year, month, cache_dir=cache_dir))
    return dedupe_titles(rows)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch Wikimedia monthly top pageviews.")
    parser.add_argument("--months", type=int, default=8, help="How many months back (default 8).")
    parser.add_argument("--end-year", type=int, default=None)
    parser.add_argument("--end-month", type=int, default=None)
    parser.add_argument("--cache-dir", type=Path, default=Path("pipeline/data/cache/pageviews"))
    parser.add_argument("--out", type=Path, default=Path("pipeline/data/cache/pageviews.jsonl"))
    args = parser.parse_args(argv)

    rows = collect_pageviews(
        args.months,
        end_year=args.end_year,
        end_month=args.end_month,
        cache_dir=args.cache_dir,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"wrote {len(rows)} titles to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
