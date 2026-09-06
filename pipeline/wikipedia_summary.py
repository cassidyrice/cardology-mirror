"""Wikipedia REST page summary → source_text / source_url / short description."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from urllib.parse import quote

from pipeline.http import fetch_json

SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"


def parse_summary(payload: dict) -> dict:
    urls = payload.get("content_urls") or {}
    desktop = urls.get("desktop") or {}
    title = (payload.get("titles") or {}).get("canonical") or payload.get("title") or ""
    source_url = desktop.get("page") or (
        f"https://en.wikipedia.org/wiki/{quote(str(title).replace(' ', '_'))}" if title else ""
    )
    return {
        "title": payload.get("title") or title,
        "source_text": (payload.get("extract") or "").strip(),
        "source_url": source_url,
        "description": payload.get("description") or "",
    }


def fetch_summary(title: str, *, cache_dir: Path | None = None) -> dict:
    encoded = quote(title.replace(" ", "_"), safe="_()%,")
    url = SUMMARY_URL.format(title=encoded)
    cache_path = None
    if cache_dir is not None:
        safe = title.replace("/", "_").replace(" ", "_")
        cache_path = cache_dir / f"{safe}.json"
    payload = fetch_json(url, cache_path=cache_path)
    return parse_summary(payload)


def iter_title_rows(
    *,
    titles_path: Path | None = None,
    from_cache: Path | None = None,
) -> list[tuple[str | None, str]]:
    """Collect (qid, enwiki title) pairs from JSONL, PSV, or a Wikidata cache."""
    titles: list[tuple[str | None, str]] = []
    if titles_path is not None:
        if titles_path.suffix == ".psv":
            with titles_path.open(encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle, delimiter="|")
                for row in reader:
                    title = (
                        row.get("enwiki_title") or row.get("title") or row.get("name") or ""
                    ).strip()
                    if title:
                        titles.append(((row.get("qid") or "").strip() or None, title))
            return titles
        for line in titles_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            title = row.get("enwiki_title") or row.get("title")
            if title:
                titles.append((row.get("qid"), title))
        return titles
    if from_cache is not None:
        for path in sorted(from_cache.glob("Q*.json")):
            entity = json.loads(path.read_text(encoding="utf-8"))
            sitelink = (entity.get("sitelinks") or {}).get("enwiki") or {}
            title = sitelink.get("title")
            if title:
                titles.append((entity.get("id"), title))
    return titles


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch enwiki REST summaries.")
    parser.add_argument(
        "--titles",
        type=Path,
        help="JSONL with title/enwiki_title, or a wikidata_people_raw.psv drop.",
    )
    parser.add_argument("--from-cache", type=Path, help="Wikidata cache dir of Qid.json files.")
    parser.add_argument("--cache-dir", type=Path, default=Path("pipeline/data/cache/summaries"))
    parser.add_argument("--out", type=Path, default=Path("pipeline/data/cache/summaries.jsonl"))
    args = parser.parse_args(argv)

    if not args.titles and not args.from_cache:
        parser.error("provide --titles or --from-cache")

    titles = iter_title_rows(titles_path=args.titles, from_cache=args.from_cache)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    failures: list[dict[str, str]] = []
    with args.out.open("w", encoding="utf-8") as handle:
        for qid, title in titles:
            try:
                summary = fetch_summary(title, cache_dir=args.cache_dir)
            except Exception as exc:  # noqa: BLE001 — per-title fetch must not abort the drop
                failures.append({"qid": qid or "", "title": title, "error": str(exc)})
                continue
            summary["qid"] = qid
            handle.write(json.dumps(summary, ensure_ascii=False) + "\n")
            written += 1
    print(f"wrote {written} summaries to {args.out}")
    if failures:
        fail_path = args.out.with_suffix(".failures.json")
        fail_path.write_text(json.dumps(failures, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"failed {len(failures)} titles → {fail_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
