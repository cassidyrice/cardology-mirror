"""Current US Cabinet harvest: infobox parse, day-precision, no invented DOBs."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.birthcard import birth_card_from_iso
from pipeline.cabinet.catalog import (
    SITTING_CABINET,
    SITTING_ENWIKI_TITLES,
    SITTING_OFFICE_IDS,
    SITTING_QIDS,
    SITTING_SLUGS,
)
from pipeline.cabinet.harvest import classify_row, office_phrase, validate_cabinet
from pipeline.cabinet.wiki_infobox import (
    extract_whitehouse_headings,
    normalize_person_name,
    parse_birth_template,
    parse_infobox_wikitext,
    whitehouse_has_name,
)

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_INFOBOX = ROOT / "data" / "fixtures" / "cabinet_infobox.wikitext"
FIXTURE_WHITEHOUSE = ROOT / "data" / "fixtures" / "cabinet_whitehouse.html"
PEOPLE_JSONL = ROOT / "data" / "cabinet" / "people.jsonl"
PROVENANCE = ROOT / "data" / "cabinet" / "provenance.json"


def _entity(iso: str, *, precision: int = 11, description: str = "American politician") -> dict:
    return {
        "id": "Q0CAB1",
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": "Example Cabinet"}},
        "claims": {
            "P569": [
                {
                    "rank": "normal",
                    "mainsnak": {
                        "snaktype": "value",
                        "datavalue": {
                            "value": {
                                "time": f"+{iso}T00:00:00Z",
                                "precision": precision,
                                "calendarmodel": "http://www.wikidata.org/entity/Q1985727",
                            }
                        },
                    },
                }
            ]
        },
    }


def _catalog(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "office_id": "example",
        "office": "Secretary of Example",
        "acting": False,
        "name": "Ada Fixture Cabinet",
        "slug": "ada-fixture-cabinet",
        "qid": "Q0CAB1",
        "enwiki_title": "Ada Fixture Cabinet",
        "whitehouse_name": "Ada Fixture Cabinet",
        "succession": 1,
    }
    row.update(overrides)
    return row


def test_catalog_is_vp_plus_fifteen_secretaries() -> None:
    assert len(SITTING_CABINET) == 16
    assert len(set(SITTING_QIDS)) == 16
    assert len(set(SITTING_SLUGS)) == 16
    assert len(set(SITTING_OFFICE_IDS)) == 16
    assert len(set(SITTING_ENWIKI_TITLES)) == 16
    assert [int(row["succession"]) for row in SITTING_CABINET] == list(range(1, 17))
    assert SITTING_CABINET[0]["office_id"] == "vice-president"
    assert SITTING_CABINET[-1]["office_id"] == "homeland-security"
    labor = next(row for row in SITTING_CABINET if row["office_id"] == "labor")
    assert labor["acting"] is True
    assert labor["name"] == "Keith Sonderling"


def test_office_phrase_marks_acting() -> None:
    assert office_phrase("Secretary of Labor", acting=True) == "Acting Secretary of Labor"
    assert office_phrase("Vice President", acting=False) == "Vice President"


def test_infobox_parser_reads_day_year_only_and_nested_fields() -> None:
    wikitext = FIXTURE_INFOBOX.read_text(encoding="utf-8")
    chunks = wikitext.split("{{Infobox officeholder")
    first = parse_infobox_wikitext(chunks[1])
    assert first["kind"] == "day"
    assert first["birth_date"] == "1960-01-15"
    second = parse_infobox_wikitext(chunks[2])
    assert second["kind"] == "year_only"
    assert second["birth_date"] is None
    third = parse_infobox_wikitext(chunks[3])
    assert third["kind"] == "day"
    assert third["birth_date"] == "1971-05-28"


def test_year_only_template_is_not_invented() -> None:
    parsed = parse_birth_template("| birth_date = {{birth date and age|1960}}")
    assert parsed["kind"] == "year_only"
    assert parsed["birth_date"] is None


def test_whitehouse_name_match_ignores_punctuation() -> None:
    html = FIXTURE_WHITEHOUSE.read_text(encoding="utf-8")
    assert extract_whitehouse_headings(html) == ["Ada Fixture Cabinet", "Pat Yearonly"]
    assert whitehouse_has_name(html, "Ada Fixture Cabinet")
    assert normalize_person_name("Robert F. Kennedy, Jr.") == normalize_person_name(
        "Robert F. Kennedy Jr."
    )
    assert whitehouse_has_name(
        "<h2>Keith E. Sonderling</h2>",
        "Keith Sonderling",
        "Keith E. Sonderling",
    )
    assert whitehouse_has_name(
        "<h2>Robert F. Kennedy, Jr.</h2>",
        "Robert F. Kennedy Jr.",
    )


def test_classify_keeps_matching_day_precision() -> None:
    listed = {
        "kind": "day",
        "birth_date": "1960-01-15",
        "wikipedia_title": "Ada Fixture Cabinet",
    }
    reason, draft = classify_row(
        catalog=_catalog(),
        listed=listed,
        entity=_entity("1960-01-15"),
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1960-01-15"
    assert draft["dob_crosscheck"] == "match"


def test_classify_drops_year_only_conflict_precision_minor_and_d3() -> None:
    catalog = _catalog()
    year_only = {"kind": "year_only", "birth_date": None}
    reason, draft = classify_row(
        catalog=catalog,
        listed=year_only,
        entity=_entity("1960-01-01"),
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "year_only"
    assert draft is None

    conflict = {"kind": "day", "birth_date": "1976-10-06"}
    reason, draft = classify_row(
        catalog=catalog,
        listed=conflict,
        entity=_entity("1976-10-08"),
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "dob_conflict"
    assert draft is not None
    assert draft["wikipedia_infobox_date"] == "1976-10-06"
    assert draft["wikidata_birth_date"] == "1976-10-08"

    entity = _entity("1976-10-06")
    entity["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1976-10-06"},
        entity=entity,
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "wikidata_precision"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "2015-01-15"},
        entity=_entity("2015-01-15"),
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1960-01-15"},
        entity=_entity("1960-01-15", description="American dictator"),
        on_whitehouse=True,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    reason, draft = classify_row(
        catalog=catalog,
        listed={"kind": "day", "birth_date": "1960-01-15"},
        entity=_entity("1960-01-15"),
        on_whitehouse=False,
        today=date(2026, 9, 6),
        blocklist=set(),
    )
    assert reason == "missing_from_whitehouse"
    assert draft is None


def test_committed_cabinet_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        return
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_cabinet(rows)
    assert 1 <= len(rows) <= 16
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    catalog_slugs = set(SITTING_SLUGS)
    for row in rows:
        assert row["slug"] in catalog_slugs
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["dob_crosscheck"] == "match"
        assert row["birth_date"] == row["wikipedia_infobox_date"] == row["wikidata_birth_date"]
        assert "wikipedia.org" in row["source_url"]
        assert "whitehouse.gov" in row["whitehouse_url"]
        assert row["source_text"]
    assert rows == sorted(rows, key=lambda item: (item["succession"], item["name"]))

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["catalog_sitting"] == 16
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["cabinet_level_officials"] is False
