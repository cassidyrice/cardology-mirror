"""NASA astronaut harvest: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
import zlib
from datetime import date
from pathlib import Path

import pytest

from pipeline.astronauts.bios import (
    extract_birth_from_pdf,
    extract_birth_from_text,
    match_people_row,
    parse_people_payload,
)
from pipeline.astronauts.catalog import (
    display_name,
    last_name,
    merge_catalog,
    parse_candidates_html,
    parse_fact_book_text,
)
from pipeline.astronauts.wiki import match_wiki_row, search_queries
from pipeline.astronauts.dates import classify_nasa_date
from pipeline.astronauts.harvest import classify_row, unique_slug, validate_astronauts
from pipeline.birthcard import birth_card_from_iso
from pipeline.presidents.extract import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
FIXTURE_FACT_BOOK = ROOT / "data" / "fixtures" / "astronaut_fact_book.md"
FIXTURE_CANDIDATES = ROOT / "data" / "fixtures" / "astronaut_candidates.html"
FIXTURE_BIO = ROOT / "data" / "fixtures" / "astronaut_bio_armstrong.html"
FIXTURE_YEAR_ONLY = ROOT / "data" / "fixtures" / "astronaut_bio_year_only.html"
FIXTURE_ENTITY = ROOT / "data" / "fixtures" / "astronaut_wikidata_Q0AST1.json"
FIXTURE_CONFLICT = ROOT / "data" / "fixtures" / "astronaut_wikidata_conflict.json"
PEOPLE_JSONL = ROOT / "data" / "astronauts" / "people.jsonl"
PROVENANCE = ROOT / "data" / "astronauts" / "provenance.json"

TODAY = date(2026, 9, 6)


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _catalog(**overrides: object) -> dict:
    row = {
        "list_name": "Armstrong, Neil A.",
        "name": "Neil A. Armstrong",
        "slug": "neil-a-armstrong",
        "entry_year": "1962",
        "group": "2",
        "flights": 2,
        "status": "Deceased",
        "qid": "Q0AST1",
        "wikipedia_title": "Neil Fixture Armstrong",
        "source": "fact_book",
    }
    row.update(overrides)
    return row


def _nasa(**overrides: object) -> dict:
    row = {
        "name": "Neil A. Armstrong",
        "slug": "neil-a-armstrong",
        "nasa_url": "https://www.nasa.gov/people/neil-a-armstrong/",
        "nasa_birth_kind": "day",
        "nasa_birth_date": "1930-08-05",
        "html": "Armstrong was born August 5, 1930, in Wapakoneta, Ohio.",
        "pdf_urls": [],
    }
    row.update(overrides)
    return row


def test_nasa_date_parser_keeps_day_and_drops_year_only() -> None:
    assert classify_nasa_date("1930-08-05") == ("day", "1930-08-05")
    assert classify_nasa_date("August 5, 1930") == ("day", "1930-08-05")
    assert classify_nasa_date("1948-00-00") == ("year_only", None)
    assert classify_nasa_date("1948") == ("year_only", None)
    assert classify_nasa_date("August 1948") == ("year_only", None)
    assert classify_nasa_date(None) == ("missing", None)
    assert classify_nasa_date("1930-13-40") == ("invalid", None)


def test_bio_parser_reads_day_and_drops_year_only() -> None:
    day_kind, day_iso = extract_birth_from_text(FIXTURE_BIO.read_text(encoding="utf-8"))
    assert day_kind == "day"
    assert day_iso == "1930-08-05"

    year_kind, year_iso = extract_birth_from_text(FIXTURE_YEAR_ONLY.read_text(encoding="utf-8"))
    assert year_kind == "year_only"
    assert year_iso is None

    place_kind, place_iso = extract_birth_from_text(
        "Reid’s hometown is Baltimore, Maryland. She is survived by their two children."
    )
    assert place_kind == "missing"
    assert place_iso is None

    labeled_kind, labeled_iso = extract_birth_from_text("Date of Birth: January 20, 1930")
    assert labeled_kind == "day"
    assert labeled_iso == "1930-01-20"

    tagged_kind, tagged_iso = extract_birth_from_text("en-USPersonal Data: en-USBorn in 1967 in Inglewood")
    assert tagged_kind == "year_only"
    assert tagged_iso is None


def test_pdf_extractor_reads_personal_data_literal() -> None:
    raw = (
        b"%PDF-1.4\n"
        b"BT /F1 10 Tf (PERSONAL DATA: Born August 5, 1930, in Wapakoneta, Ohio.) Tj ET\n"
    )
    kind, iso = extract_birth_from_pdf(raw)
    assert kind == "day"
    assert iso == "1930-08-05"

    content = b"BT\n[(P)3 (ERSONAL DATA: Born January 20, 1930, in Glen Ridge.)] TJ\nET\n"
    compressed = zlib.compress(content)
    flate = (
        b"%PDF-1.4\n1 0 obj\n<< /Filter /FlateDecode >>\nstream\n"
        + compressed
        + b"\nendstream\nendobj\n"
    )
    flate_kind, flate_iso = extract_birth_from_pdf(flate)
    assert flate_kind == "day"
    assert flate_iso == "1930-01-20"

    tight_kind, tight_iso = extract_birth_from_text("PERSONALDATA:BornJanuary20,1930inGlenRidge")
    assert tight_kind == "day"
    assert tight_iso == "1930-01-20"


def test_fact_book_and_candidates_merge_without_duplicate() -> None:
    fact = parse_fact_book_text(FIXTURE_FACT_BOOK.read_text(encoding="utf-8"))
    assert [row["name"] for row in fact] == [
        "Neil A. Armstrong",
        "Ada Year Fixture",
        "Conflict C. Fixture",
    ]
    assert fact[0]["slug"] == "neil-a-armstrong"
    assert fact[0]["group"] == "2"
    assert fact[0]["flights"] == 2

    candidates = parse_candidates_html(FIXTURE_CANDIDATES.read_text(encoding="utf-8"))
    names = {row["name"] for row in candidates}
    assert "Ada Fixture Candidate" in names

    merged = merge_catalog(fact, candidates)
    armstrong = [row for row in merged if row["slug"] == "neil-a-armstrong"]
    assert len(armstrong) == 1
    assert any(row["slug"] == "ada-fixture-candidate" for row in merged)
    assert display_name("Wiseman, G. Reid") == "G. Reid Wiseman"
    assert display_name("Shepard, Alan B., Jr.") == "Alan B. Shepard Jr."
    assert last_name("Franklin R. Chang-Díaz") == last_name("Franklin Chang-Diaz")
    assert last_name("Scott Kelly (astronaut)") == last_name("Scott J. Kelly")
    assert last_name("Brian T. O’Leary") == last_name("Brian O'Leary")


def test_wiki_match_accepts_unique_last_name_nickname() -> None:
    row = {
        "name": "Charles Conrad Jr.",
        "slug": "charles-conrad-jr",
    }
    match = match_wiki_row(
        row,
        [
            {"title": "Pete Conrad", "qid": "Q366511"},
            {"title": "NASA Astronaut Group 2", "qid": "Q9"},
        ],
    )
    assert match is not None
    assert match["qid"] == "Q366511"
    assert search_queries("Charles Conrad Jr.")[0] == "Charles Conrad Jr."
    assert "Charles Conrad" in search_queries("Charles Conrad Jr.")

    kelly = match_wiki_row(
        {"name": "Scott J. Kelly", "slug": "scott-j-kelly"},
        [
            {"title": "Mark Kelly", "qid": "Q357510"},
            {"title": "Scott Kelly (astronaut)", "qid": "Q362190"},
        ],
    )
    assert kelly is not None
    assert kelly["qid"] == "Q362190"


def test_fact_book_section_one_ignores_later_tables() -> None:
    extra = FIXTURE_FACT_BOOK.read_text(encoding="utf-8") + """

## 5.0 ASTRONAUTS AFFILIATIONS TO STATES
| Astronaut | Entry Year | Group | # of flights | STATUS |
| Junk, Extra P. | 1990 | 13 | 1 | Former |
"""
    fact = parse_fact_book_text(extra)
    assert [row["slug"] for row in fact] == [
        "neil-a-armstrong",
        "ada-year-fixture",
        "conflict-c-fixture",
    ]


def test_classify_keeps_matching_day_precision() -> None:
    reason, draft = classify_row(
        catalog=_catalog(),
        nasa=_nasa(),
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason is None
    assert draft is not None
    assert draft["birth_date"] == "1930-08-05"
    assert draft["wikidata_birth_date"] == "1930-08-05"
    assert draft["dob_crosscheck"] == "match"
    assert birth_card_from_iso(draft["birth_date"]) == "8♦"


def test_classify_drops_year_only_conflict_and_missing_bio() -> None:
    year_reason, year_draft = classify_row(
        catalog=_catalog(name="Ada Year Fixture", qid="Q0AST9"),
        nasa=_nasa(nasa_birth_kind="year_only", nasa_birth_date=None),
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert year_reason == "year_only"
    assert year_draft is None

    missing_reason, missing_draft = classify_row(
        catalog=_catalog(),
        nasa=None,
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert missing_reason == "missing_nasa_bio"
    assert missing_draft is None

    reason, draft = classify_row(
        catalog=_catalog(name="Conflict Fixture", qid="Q0AST2"),
        nasa=_nasa(nasa_birth_date="1930-08-05"),
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
        catalog=_catalog(),
        nasa=_nasa(),
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
        catalog=_catalog(),
        nasa=_nasa(),
        entity=entity,
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "description_keyword"
    assert draft is None

    reason, draft = classify_row(
        catalog=_catalog(),
        nasa=_nasa(nasa_birth_date="2010-08-05"),
        entity=_load(FIXTURE_ENTITY),
        today=TODAY,
        blocklist=set(),
    )
    assert reason == "minor"
    assert draft is None


def test_armstrong_and_aldrin_birth_cards() -> None:
    assert birth_card_from_iso("1930-08-05") == "8♦"
    assert birth_card_from_iso("1930-01-20") == "7♦"
    assert birth_card_from_iso("1953-12-31") == "Joker"


def test_unique_slug_disambiguates() -> None:
    used: set[str] = set()
    first = unique_slug("James Williams", used, qid="Q1")
    used.add(first)
    second = unique_slug("James Williams", used, qid="Q2")
    assert first == "james-williams"
    assert second != first
    assert "q2" in second


def test_people_payload_and_name_match() -> None:
    payload = {
        "title": {"rendered": "Neil A. Armstrong"},
        "slug": "neil-a-armstrong",
        "link": "https://www.nasa.gov/people/neil-a-armstrong/",
        "content": {"rendered": FIXTURE_BIO.read_text(encoding="utf-8")},
    }
    parsed = parse_people_payload(payload)
    assert parsed["nasa_birth_kind"] == "day"
    assert parsed["nasa_birth_date"] == "1930-08-05"
    assert parsed["pdf_urls"]

    match = match_people_row(_catalog(), [parsed])
    assert match is not None
    assert match["slug"] == "neil-a-armstrong"


def test_schema_rejects_mismatch_crosscheck() -> None:
    row = {
        "qid": "Q999001",
        "name": "Neil Fixture Armstrong",
        "slug": "neil-fixture-armstrong",
        "status": "Deceased",
        "group": "2",
        "flights": 2,
        "entry_year": "1962",
        "birth_date": "1930-08-05",
        "death_date": "2012-08-25",
        "card": "8♦",
        "source_text": "Synthetic fixture astronaut. Not a real biography.",
        "source_url": "https://en.wikipedia.org/wiki/Neil_Fixture_Armstrong",
        "wikipedia_title": "Neil Fixture Armstrong",
        "nasa_url": "https://www.nasa.gov/people/neil-fixture-armstrong/",
        "nasa_birth_date": "1930-08-05",
        "wikidata_birth_date": "1930-08-05",
        "dob_crosscheck": "mismatch",
    }
    with pytest.raises(ValueError, match="match"):
        validate_astronauts([row])


def test_committed_astronauts_jsonl_if_present() -> None:
    if not PEOPLE_JSONL.is_file():
        pytest.skip("astronauts people.jsonl not harvested yet")
    rows = [
        json.loads(line)
        for line in PEOPLE_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    validate_astronauts(rows)
    assert rows, "expected at least one kept astronaut"
    slugs = [row["slug"] for row in rows]
    assert len(set(slugs)) == len(rows)
    for row in rows:
        assert birth_card_from_iso(row["birth_date"]) == row["card"]
        assert row["nasa_birth_date"] == row["wikidata_birth_date"] == row["birth_date"]
        assert row["dob_crosscheck"] == "match"
        assert row["source_text"]
        assert "wikipedia.org" in row["source_url"]
        assert "nasa.gov" in row["nasa_url"]

    by_slug = {row["slug"]: row for row in rows}
    if "neil-a-armstrong" in by_slug:
        assert by_slug["neil-a-armstrong"]["birth_date"] == "1930-08-05"
        assert by_slug["neil-a-armstrong"]["card"] == "8♦"

    if PROVENANCE.is_file():
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        assert provenance["people_count"] == len(rows)
        assert provenance["kept"] == len(rows)
        assert provenance["rules"]["do_not_invent_dates"] is True
        assert provenance["rules"]["year_before_1900_applied"] is False
