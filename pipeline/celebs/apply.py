"""Patch existing celeb blog posts with citations. CTA sections stay untouched."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from pipeline.celebs.catalog import POSTS_PATH, is_celeb_profile
from pipeline.celebs.copy import (
    EVIDENCE_HEADING,
    SOURCES_HEADING,
    conflict_body,
    coordinate_note,
    date_faq,
    evidence_from_summary,
    fortune_faq,
    sources_body,
)

TODAY = date(2026, 9, 6).isoformat()
PROTECTED_HEADINGS = {
    "how to use this profile",
    "the ruling-card layer",
    "public-life interpretation",
    "strength and shadow range",
}


def _replace_section(sections: list[dict[str, Any]], heading: str, body: list[str], links: list[dict[str, str]] | None) -> None:
    incoming = {"heading": heading, "body": body}
    if links:
        incoming["links"] = links
    for index, section in enumerate(sections):
        if section.get("heading") == heading:
            sections[index] = incoming
            return
    # Keep CTA / how-to-use last when present.
    insert_at = len(sections)
    for index, section in enumerate(sections):
        if str(section.get("heading") or "").casefold() in PROTECTED_HEADINGS:
            insert_at = index
            break
    sections.insert(insert_at, incoming)


def _upsert_faq(faqs: list[dict[str, str]], item: dict[str, str]) -> None:
    needle = item["q"].casefold()
    for index, faq in enumerate(faqs):
        if str(faq.get("q") or "").casefold() == needle:
            faqs[index] = item
            return
    faqs.append(item)


def _wikidata_url(qid: str) -> str:
    return f"https://www.wikidata.org/wiki/{qid}"


def apply_kept(post: dict[str, Any], row: dict[str, Any]) -> None:
    links = [
        {"label": f"Wikidata {row['qid']}", "href": _wikidata_url(row["qid"])},
        {"label": f"Wikipedia: {row['wikipedia_title']}", "href": row["source_url"]},
    ]
    _replace_section(post["sections"], SOURCES_HEADING, sources_body(row), links)
    evidence = row.get("evidence") or evidence_from_summary(row["source_text"], row["wikipedia_title"])
    _replace_section(post["sections"], EVIDENCE_HEADING, evidence, None)
    _upsert_faq(post["faqs"], date_faq(row))
    _upsert_faq(post["faqs"], fortune_faq(row["name"]))
    first = post["sections"][0] if post["sections"] else None
    if first and coordinate_note() not in " ".join(first.get("body") or []):
        first.setdefault("body", []).append(coordinate_note())
    post["citations"] = {
        "qid": row["qid"],
        "wikidataUrl": _wikidata_url(row["qid"]),
        "wikipediaUrl": row["source_url"],
        "wikipediaTitle": row["wikipedia_title"],
        "birthDate": row["birth_date"],
        "dobCrosscheck": row["dob_crosscheck"],
        "status": "verified",
    }
    post["dateModified"] = TODAY


def apply_flagged(post: dict[str, Any], row: dict[str, Any]) -> None:
    links = []
    if row.get("qid"):
        links.append({"label": f"Wikidata {row['qid']}", "href": _wikidata_url(row["qid"])})
    if row.get("source_url"):
        links.append(
            {"label": f"Wikipedia: {row.get('wikipedia_title') or row['name']}", "href": row["source_url"]}
        )
    _replace_section(post["sections"], SOURCES_HEADING, conflict_body(row), links or None)
    _upsert_faq(
        post["faqs"],
        {
            "q": f"Where does {row['name']}'s birth date come from?",
            "a": (
                "Wikidata P569 lists more than one day-precision date. "
                "This page does not cite a verified public day. Dropped, not guessed."
            ),
        },
    )
    _upsert_faq(post["faqs"], fortune_faq(row["name"]))
    post["citations"] = {
        "qid": row.get("qid"),
        "wikidataUrl": _wikidata_url(row["qid"]) if row.get("qid") else None,
        "wikipediaUrl": row.get("source_url"),
        "wikipediaTitle": row.get("wikipedia_title"),
        "birthDate": None,
        "dobCrosscheck": "flagged_conflict",
        "status": "flagged",
        "reason": row.get("reason"),
        "wikidataDates": row.get("wikidata_dates"),
    }
    post["dateModified"] = TODAY


def apply_citations(
    kept: list[dict[str, Any]],
    excluded: list[dict[str, Any]],
    *,
    posts_path: Path = POSTS_PATH,
) -> int:
    posts = json.loads(posts_path.read_text(encoding="utf-8"))
    kept_by_slug = {row["slug"]: row for row in kept}
    flagged_by_slug = {
        row["slug"]: row
        for row in excluded
        if row.get("reason") == "dob_conflict"
    }
    changed = 0
    for post in posts:
        if not is_celeb_profile(post):
            continue
        before_cta = [
            (link.get("href"), link.get("label"))
            for section in post.get("sections") or []
            if str(section.get("heading") or "").casefold() == "how to use this profile"
            for link in section.get("links") or []
        ]
        before_core = [(link.get("href"), link.get("label")) for link in post.get("coreLinks") or []]
        if post["slug"] in kept_by_slug:
            apply_kept(post, kept_by_slug[post["slug"]])
            changed += 1
        elif post["slug"] in flagged_by_slug:
            apply_flagged(post, flagged_by_slug[post["slug"]])
            changed += 1
        after_cta = [
            (link.get("href"), link.get("label"))
            for section in post.get("sections") or []
            if str(section.get("heading") or "").casefold() == "how to use this profile"
            for link in section.get("links") or []
        ]
        after_core = [(link.get("href"), link.get("label")) for link in post.get("coreLinks") or []]
        if before_cta != after_cta or before_core != after_core:
            raise RuntimeError(f"CTA changed on {post['slug']}")
    posts_path.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed
