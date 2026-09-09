"""Existing celeb blog profile citations: public DOB only, no invented dates."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from enrich.containment import fact_is_near_verbatim
from pipeline.celebs.catalog import fold_name, is_celeb_profile, load_celeb_profiles, parse_claimed_date
from pipeline.celebs.copy import evidence_from_summary, sources_body
from pipeline.celebs.harvest import classify, p569_days, validate_kept
from pipeline.birthcard import birth_card_from_iso

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
JSONL = ROOT / "data" / "celebs" / "people.jsonl"
PROVENANCE = ROOT / "data" / "celebs" / "provenance.json"
POSTS = REPO / "lib" / "generated-blog-posts.json"
SCHEMA = json.loads((ROOT / "schema" / "celeb_blog.schema.json").read_text(encoding="utf-8"))
CONFLICT = json.loads((ROOT / "data" / "fixtures" / "celeb_blog_wikidata_conflict.json").read_text(encoding="utf-8"))
TODAY = date(2026, 9, 6)


def _rows() -> list[dict]:
    return [json.loads(line) for line in JSONL.read_text(encoding="utf-8").splitlines() if line.strip()]


def _posts() -> list[dict]:
    return json.loads(POSTS.read_text(encoding="utf-8"))


def test_catalog_finds_existing_blog_profiles() -> None:
    profiles = load_celeb_profiles()
    slugs = {row["slug"] for row in profiles}
    assert len(profiles) == 59
    assert "taylor-swift-birth-card-profile" in slugs
    assert "lady-gaga-birth-card-profile" in slugs
    assert all(row["path"].startswith("/blog/") for row in profiles)
    assert all(not row["path"].startswith("/birth-card/") for row in profiles)


def test_fold_name_and_claimed_date() -> None:
    assert fold_name("Beyoncé") == "beyonce"
    post = {
        "sections": [
            {
                "body": [
                    "The calculation starts with the public birth date, December 13, 1989, which maps."
                ]
            }
        ]
    }
    assert parse_claimed_date(post) == "1989-12-13"
    assert is_celeb_profile({"slug": "ada-birth-card-profile", "keywords": []})
    assert not is_celeb_profile({"slug": "what-is-a-birth-card", "keywords": ["birth card"]})


def test_multiple_p569_days_are_a_conflict() -> None:
    days = p569_days(CONFLICT)
    assert days == ["1986-03-20", "1986-03-28"]
    reason = classify(
        claimed="1986-03-28",
        wikidata_dates=days,
        source_text="Ada Fixture Dualdate is an American singer.",
        description="American singer (born 1986)",
        today=TODAY,
    )
    assert reason == "dob_conflict"


def test_claimed_mismatch_is_a_conflict() -> None:
    reason = classify(
        claimed="1986-03-28",
        wikidata_dates=["1986-03-20"],
        source_text="Ada Fixture Dualdate is an American singer.",
        description="American singer",
        today=TODAY,
    )
    assert reason == "dob_conflict"


def test_minors_are_dropped() -> None:
    reason = classify(
        claimed="2010-01-15",
        wikidata_dates=["2010-01-15"],
        source_text="A fixture minor used only in tests.",
        description="test fixture",
        today=TODAY,
    )
    assert reason == "minor"


def test_committed_rows_match_schema_and_containment() -> None:
    required = SCHEMA["required"]
    rows = _rows()
    assert len(rows) == 56
    validate_kept(rows)
    for row in rows:
        for key in required:
            assert row.get(key), key
        assert row["path"] == f"/blog/{row['slug']}"
        assert row["birth_date"] == row["wikidata_birth_date"]
        assert row["card"] == birth_card_from_iso(row["birth_date"])
        assert "wikidata.org/wiki/" not in row["path"]
        for fact in row["evidence"]:
            if "Wikipedia REST summary" in fact or "No extra biographical facts" in fact:
                continue
            ok, _score = fact_is_near_verbatim(fact, row["source_text"])
            assert ok, fact


def test_lady_gaga_is_flagged_not_cited() -> None:
    provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    assert provenance["kept"] == 56
    assert provenance["excluded"] == 1
    assert provenance["by_reason"] == {"dob_conflict": 1}
    flagged = provenance["exclusions"][0]
    assert flagged["slug"] == "lady-gaga-birth-card-profile"
    assert flagged["wikidata_dates"] == ["1986-03-20", "1986-03-28"]
    kept_slugs = {row["slug"] for row in _rows()}
    assert "lady-gaga-birth-card-profile" not in kept_slugs


def test_blog_posts_carry_citations_and_keep_cta() -> None:
    celeb = [post for post in _posts() if is_celeb_profile(post)]
    assert len(celeb) == 59
    # Daily-bot profiles (Ariana Grande, Sam Altman) are in the catalog but
    # were not run through the Wikidata citation pack.
    cited = [post for post in celeb if post.get("citations")]
    assert len(cited) == 57
    for post in cited:
        citations = post["citations"]
        headings = [section["heading"] for section in post["sections"]]
        assert "Public date sources" in headings
        assert "coordinates, not fortune-telling" in json.dumps(post["faqs"]).casefold()
        how_to = next(section for section in post["sections"] if section["heading"] == "How to use this profile")
        hrefs = [link["href"] for link in how_to.get("links") or []]
        assert "/birth-card-calculator" in hrefs
        assert "/products/personal-card-blueprint" in hrefs
        core = [link["href"] for link in post["coreLinks"]]
        assert "/products/personal-card-blueprint" in core
        assert "/checkout/" not in json.dumps(post["coreLinks"])
        if post["slug"] == "lady-gaga-birth-card-profile":
            assert citations["status"] == "flagged"
            assert citations["birthDate"] is None
            assert "Dropped, not guessed" in json.dumps(post["sections"])
            continue
        assert citations["status"] == "verified"
        assert citations["qid"].startswith("Q")
        assert citations["wikidataUrl"].endswith(citations["qid"])
        assert "wikipedia.org" in citations["wikipediaUrl"]
        assert "From the Wikipedia summary" in headings
        evidence = next(section for section in post["sections"] if section["heading"] == "From the Wikipedia summary")
        source = next(row for row in _rows() if row["slug"] == post["slug"])
        for fact in evidence["body"]:
            if "Wikipedia REST summary" in fact or "No extra biographical facts" in fact:
                continue
            ok, _score = fact_is_near_verbatim(fact, source["source_text"])
            assert ok, fact


def test_sources_copy_is_coordinate_voice() -> None:
    row = _rows()[0]
    body = " ".join(sources_body(row)).casefold()
    assert "coordinates" in body or "coordinate" in body
    assert "fortune" not in body or "not a forecast" in body
    assert "wikidata p569" in body
    extra = evidence_from_summary("One sentence.", "Ada Fixture")
    assert extra[0] == "One sentence."
    assert any("only biographical prose" in item for item in extra)
