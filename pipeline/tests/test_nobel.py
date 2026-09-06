"""Nobel laureate harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from pipeline.birthcard import birth_card_from_iso
from pipeline.nobel.api import extract_prizes, is_organization, laureate_name, laureate_qid
from pipeline.nobel.dates import classify_nobel_date
from pipeline.nobel.harvest import classify_row, unique_slug, validate_laureates
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_PERSON = ROOT / "data" / "fixtures" / "nobel_laureate_person.json"
FIXTURE_YEAR_ONLY = ROOT / "data" / "fixtures" / "nobel_laureate_year_only.json"
FIXTURE_ORG = ROOT / "data" / "fixtures" / "nobel_laureate_org.json"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "nobel_wikidata_Q0NOB1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "nobel_wikidata_conflict.json"
PEOPLE_JSONL = ROOT / "data" / "nobel" / "people.jsonl"
PROVENANCE = ROOT / "data" / "nobel" / "provenance.json"

TODAY = date(2026, 9, 6)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_nobel_date_parser_keeps_day_and_drops_year_only() -> None:
    assert classify_nobel_date("1867-11-07") == ("day", "1867-11-07")
    assert classify_nobel_date("1879-03-14") == ("day", "1879-03-14")
    assert classify_nobel_date("1948-00-00") == ("year_only", None)
    assert classify_nobel_date("1945") == ("year_only", None)
    assert classify_nobel_date(None) == ("missing", None)
    assert classify_nobel_date("1867-13-40") == ("invalid", None)


def test_organization_and_name_helpers() -> None:
    org = _load(FIXTURE_ORG)
    person = _load(FIXTURE_PERSON)
    assert is_organization(org) is True
    assert is_organization(person) is False
    assert laureate_name(person) == "Ada Fixture Curie"
    assert laureate_qid(person) == "Q0NOB1"
    prizes = extract_prizes(person)
    assert prizes[0]["year"] == "1903"
    assert prizes[0]["category"] == "Physics"


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        laureate=_load(FIXTURE_PERSON),
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1867-11-07"
    assert draft["wikidata_birth_date"] == "1867-11-07"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "K♣"


def test_classify_drops_organization_year_only_and_conflict() -> None:
    org_reason, org_draft = classify_row(
        laureate=_load(FIXTURE_ORG),
        entity=None,
        today=TODAY,
        blocklist=set(),
    )
    assert org_reason == "organization"
    assert org_draft is None

    year_reason, year_draft = classify_row(
        laureate=_load(FIXTURE_YEAR_ONLY),
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    conflict_laureate = _load(FIXTURE_PERSON)
    conflict_laureate["birth"] = {"date": "1879-03-14"}
    conflict_laureate["knownName"] = {"en": "Conflict Fixture"}
    reason, draft = classify_row(
        laureate=conflict_laureate,
        entity=_load(FIXTURE_CONFLICT),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is None


def test_classify_drops_wikidata_year_precision() -> None:
    entity = _load(FIXTURE_ENTITY)
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert parse_day_precision_time(entity, "P569") is None
    reason, draft = classify_row(
        laureate=_load(FIXTURE_PERSON),
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "wikidata_precision"
    assert draft is None


def test_classify_d3_and_minor() -> None:
    entity = _load(FIXTURE_ENTITY)
    entity["descriptions"] = {"en": {"value": "former dictator of a state"}}
    reason, draft = classify_row(
        laureate=_load(FIXTURE_PERSON),
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    minor = _load(FIXTURE_PERSON)
    minor["birth"] = {"date": "2010-11-07"}
    reason, draft = classify_row(
        laureate=minor,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_curie_and_einstein_birth_cards() -> None:
    assert birth_card_from_iso("1867-11-07") == "K♣"
    assert birth_card_from_iso("1879-03-14") == "9♦"
    assert birth_card_from_iso("1859-05-15") == "4♦"
    assert birth_card_from_iso("1852-12-15") == "3♣"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("Marie Curie", used, nobel_id="6")
    used.add(first)
    second = unique_slug("Marie Curie", used, nobel_id="7")
    assert first == "marie-curie"
    assert second != first
    assert "7" in second


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "nobel_id": "6",
        "name": "Ada Fixture Curie",
        "slug": "ada-fixture-curie",
        "birth_date": "1867-11-07",
        "death_date": "1934-07-04",
        "card": "K♣",
        "source_text": "Synthetic fixture physicist. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Ada_Fixture_Curie",
        "wikipedia_title": "Ada Fixture Curie",
        "nobel_url": "https://www.nobelprize.org/laureate/6",
        "prizes": [
            {
                "year": "1903",
                "category": "Physics",
                "category_full": "The Nobel Prize in Physics",
                "motivation": "synthetic",
                "portion": "1/4",
            }
        ],
        "nobel_birth_date": "1867-11-07",
        "wikidata_birth_date": "1867-11-07",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_laureates([row])


def test_committed_nobel_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("nobel people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_laureates(rows)
    assert rows, "expected at least one kept laureate"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["nobel_birth_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "nobelprize.org" in row["nobel_url"]
        assert row["prizes"]

    by_slug = {row["slug"]: row for row in rows}
    assert "marie-curie" in by_slug
    assert by_slug["marie-curie"]["birth_date"] == "1867-11-07"
    assert by_slug["marie-curie"]["card"] == "K♣"
    assert {prize["year"] for prize in by_slug["marie-curie"]["prizes"]} == {"1903", "1911"}
    assert "albert-einstein" in by_slug
    assert by_slug["albert-einstein"]["birth_date"] == "1879-03-14"
    assert by_slug["albert-einstein"]["card"] == "9♦"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
        assert "year_only" in provenance["by_reason"]
        assert "organization" in provenance["by_reason"]
