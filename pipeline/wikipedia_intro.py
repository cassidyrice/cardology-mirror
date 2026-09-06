"""Wikipedia full lead-section extract → `source_text_full` on an existing JSONL.

The REST `page/summary` endpoint returns only the first sentence or two. That is
enough to state who someone is, but not enough grounded prose to build a page
that is meaningfully different from every other page in the same hub. The Action
API `prop=extracts&exintro` returns the whole lead section (typically 150-400
words) from the same article, under the same CC BY-SA 4.0 licence, cited the
same way.

This does not add a new source. It reads more of the source already cited.

Usage:
    python3 -m pipeline.wikipedia_intro pipeline/data/senators/people.jsonl
    python3 -m pipeline.wikipedia_intro <jsonl> --title-field wikipedia_title \\
        --out-field source_text_full [--cache-dir .cache/wiki-intro] [--dry-run]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import quote

from pipeline.http import fetch_json

API_URL = "https://en.wikipedia.org/w/api.php"
BATCH = 20
# The API allows 20 titles per request for lead-only extracts but only 1 when
# the whole article is requested, so full mode is one call per title.
FULL_BATCH = 1
# Cap stored article text. Enough for several sections, small enough that the
# JSONL stays readable and the rendered page stays a page, not a mirror.
FULL_CHARS = 4000


def _batch_url(titles: list[str], *, full: bool = False) -> str:
    joined = quote("|".join(titles), safe="")
    intro = "" if full else "&exintro=1"
    return (
        f"{API_URL}?action=query&format=json&formatversion=2"
        f"&prop=extracts{intro}&explaintext=1&redirects=1&titles={joined}"
    )


def fetch_intros(
    titles: list[str], *, cache_dir: Path | None = None, full: bool = False
) -> dict[str, str]:
    """Map requested title -> plain text. Redirects are followed."""
    out: dict[str, str] = {}
    size = FULL_BATCH if full else BATCH
    for start in range(0, len(titles), size):
        chunk = titles[start : start + size]
        cache_path = None
        if cache_dir is not None:
            kind = "full" if full else "intro"
            cache_path = cache_dir / f"{kind}-{start:05d}-{len(chunk)}.json"
        payload = fetch_json(_batch_url(chunk, full=full), cache_path=cache_path)
        query = payload.get("query") or {}
        # normalized + redirects let us map back to the title we asked for
        alias: dict[str, str] = {}
        for key in ("normalized", "redirects"):
            for item in query.get(key) or []:
                alias[item["to"]] = alias.get(item["from"], item["from"])
        for page in query.get("pages") or []:
            if page.get("missing"):
                continue
            title = page.get("title") or ""
            extract = (page.get("extract") or "").strip()
            if full:
                extract = extract[:FULL_CHARS]
            if not extract:
                continue
            out[title] = extract
            requested = alias.get(title)
            if requested:
                out[requested] = extract
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jsonl", type=Path)
    parser.add_argument("--title-field", default="wikipedia_title")
    parser.add_argument("--out-field", default="source_text_full")
    parser.add_argument("--cache-dir", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--full",
        action="store_true",
        help="fetch the whole article, not just the lead (1 title per request)",
    )
    parser.add_argument(
        "--only-shorter-than",
        type=int,
        default=None,
        metavar="WORDS",
        help="only fetch rows whose current out-field is shorter than this",
    )
    args = parser.parse_args()

    rows = [json.loads(line) for line in args.jsonl.read_text(encoding="utf-8").splitlines() if line.strip()]
    titles = [str(row.get(args.title_field) or "").strip() for row in rows]

    if args.only_shorter_than is not None:
        needed = {
            title
            for row, title in zip(rows, titles)
            if title and len(str(row.get(args.out_field) or "").split()) < args.only_shorter_than
        }
    else:
        needed = {t for t in titles if t}
    wanted = sorted(needed)
    print(f"{len(rows)} rows · {len(wanted)} titles to fetch{' (full articles)' if args.full else ''}")

    intros = fetch_intros(wanted, cache_dir=args.cache_dir, full=args.full)

    filled = 0
    missing: list[str] = []
    for row, title in zip(rows, titles):
        text = intros.get(title, "")
        if not text:
            missing.append(title or row.get("name", "?"))
            continue
        # Only ever lengthen: never replace a longer verified text with a shorter one.
        existing = str(row.get(args.out_field) or "")
        if len(text) > len(existing):
            row[args.out_field] = text
            filled += 1

    words = [len(str(r.get(args.out_field, "")).split()) for r in rows]
    have = [w for w in words if w]
    print(f"filled {filled} · missing {len(missing)}")
    if have:
        print(f"lead-section words: min {min(have)} · avg {sum(have) // len(have)} · max {max(have)}")
    if missing:
        print("missing titles:", ", ".join(missing[:10]))

    if args.dry_run:
        print("(dry run — file not written)")
        return 0

    args.jsonl.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )
    print(f"wrote {args.jsonl}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
