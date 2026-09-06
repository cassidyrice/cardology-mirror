"""Declaration signers catalog: verified subset, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.build_dataset import slugify
from pipeline.signers.catalog import (
    SIGNERS,
    contested_signers,
    verified_signers,
    year_only_signers,
)
from pipeline.signers.harvest import validate_signers, wikipedia_crosscheck, wikidata_qa

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_JSONL = ROOT / "data" / "signers" / "people.jsonl"
PROVENANCE = ROOT / "data" / "signers" / "provenance.json"

YEAR_ONLY_SLUGS = (
    "button-gwinnett",
    "john-hart",
    "john-morton",
    "james-smith",
    "thomas-stone",
    "george-taylor",
    "matthew-thornton",
    "george-walton",
    "george-wythe",
)
HELD_SLUGS = {
    "john-hancock": "hancock_os_ns",
    "benjamin-harrison-v": "harrison_v",
    "joseph-hewes": "hewes",
}
NS_DATES = {
    "josiah-bartlett": "1729-12-02",
    "william-hooper": "1742-06-28",
    "samuel-huntington": "1731-07-16",
    "robert-morris": "1734-01-31",
    "john-adams": "1735-10-30",
    "benjamin-franklin": "1706-01-17",
}


def test_catalog_is_the_56_signers() -> None:
    assert len(SIGNERS) == 56
    slugs = [row["slug"] for row in SIGNERS]
    assert len(set(slugs)) == 56
    qids = [row["qid"] for row in SIGNERS]
    assert len(set(qids)) == 56
    for row in SIGNERS:
        assert slugify(row["name"]) == row["slug"] or row["slug"] in {
            "charles-carroll-of-carrollton",
            "thomas-heyward-jr",
            "thomas-lynch-jr",
            "thomas-nelson-jr",
            "benjamin-harrison-v",
        }


def test_year_only_are_nine_and_have_no_public_day() -> None:
    year_only = year_only_signers()
    assert {row["slug"] for row in year_only} == set(YEAR_ONLY_SLUGS)
    assert len(year_only) == 9
    for row in year_only:
        assert row["public_birth_date"] is None
        assert row["nara_birth_raw"].startswith("c. ")
        assert "day of birth is unknown" in (row["footnote"] or "")


def test_held_contested_are_hancock_harrison_hewes() -> None:
    held = contested_signers()
    assert {row["slug"] for row in held} == set(HELD_SLUGS)
    assert len(held) == 3
    for row in held:
        assert row["public_birth_date"] is None
        assert row["hold_reason"] == HELD_SLUGS[row["slug"]]
        assert row["footnote"]


def test_verified_subset_has_day_precision_and_cards() -> None:
    verified = verified_signers()
    assert len(verified) == 44
    slugs = {row["slug"] for row in verified}
    assert slugs.isdisjoint(YEAR_ONLY_SLUGS)
    assert slugs.isdisjoint(HELD_SLUGS)
    for row in verified:
        parsed = date.fromisoformat(row["public_birth_date"])
        assert parsed.isoformat() == row["public_birth_date"]
        assert row["calendar_note"] in {"new_style", "nara_day"}
        assert birth_card_from_iso(row["public_birth_date"])


def test_new_style_preferences() -> None:
    by_slug = {row["slug"]: row for row in verified_signers()}
    for slug, expected in NS_DATES.items():
        assert by_slug[slug]["public_birth_date"] == expected
        assert by_slug[slug]["calendar_note"] == "new_style"


def test_wikipedia_crosscheck_flags_nara_vs_wiki() -> None:
    by_slug = {row["slug"]: row for row in SIGNERS}
    assert wikipedia_crosscheck(by_slug["john-adams"]) == "match"
    assert wikipedia_crosscheck(by_slug["william-hooper"]) == "new_style"
    assert wikipedia_crosscheck(by_slug["john-penn"]) == "mismatch"
    assert wikipedia_crosscheck(by_slug["william-williams"]) == "mismatch"


def test_wikidata_qa_does_not_invent_dates() -> None:
    missing = wikidata_qa(None, "1735-10-30")
    assert missing["wikidata_qa"] == "missing"
    year_only_entity = {"claims": {"P569": [{"rank": "normal", "mainsnak": {"snaktype": "novalue"}}]}}
    qa = wikidata_qa(year_only_entity, "1735-10-30")
    assert qa["wikidata_qa"] in {"year_only", "missing"}


def test_committed_signers_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("signers people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_signers(rows)
    assert len(rows) == 44
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == 44
    assert set(slugs).isdisjoint(YEAR_ONLY_SLUGS)
    assert set(slugs).isdisjoint(HELD_SLUGS)
    assert rows == sorted(rows, key=lambda row: (row["name"], row["slug"]))
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        if row["wikidata_precision"] is not None:
            assert row["wikidata_precision"] == 11

    by_slug = {row["slug"]: row for row in rows}
    assert by_slug["josiah-bartlett"]["birth_date"] == "1729-12-02"
    assert by_slug["william-hooper"]["birth_date"] == "1742-06-28"
    assert by_slug["john-adams"]["birth_date"] == "1735-10-30"
    assert by_slug["thomas-jefferson"]["card"] == birth_card_from_iso("1743-04-13")

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == 44
        assert provenance["year_only_count"] == 9
        assert provenance["contested_count"] == 3
        held_slugs = {item["slug"] for item in provenance["held"]}
        assert held_slugs == set(HELD_SLUGS)
