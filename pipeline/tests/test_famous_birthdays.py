"""Famous people grounding: day-precision only, no invented DOBs, D3 + minors."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.birthcard import birth_card_from_iso
from pipeline.famous_birthdays.verify import classify_row, listed_day, verify_table, wikipedia_title
from pipeline.wikidata_dates import parse_day_precision_time

ROOT = Path(__file__).resolve().parents[1]
TABLE = ROOT.parent / "lib" / "famous-birthdays.json"
PROVENANCE = ROOT / "data" / "famous-birthdays" / "provenance.json"

TODAY = date(2026, 9, 6)
GREGORIAN = "http://www.wikidata.org/entity/Q1985727"


def _entity(
    iso: str,
    *,
        qid: str = "Q999001",
    precision: int = 11,
    description: str = "American actor",
    title: str = "Example Person",
) -> dict:
    return {
        "id": qid,
        "labels": {"en": {"value": "Example"}},
        "descriptions": {"en": {"value": description}},
        "sitelinks": {"enwiki": {"title": title}},
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
                                "calendarmodel": GREGORIAN,
                            }
                        },
                    },
                }
            ]
        },
    }


def _row(**overrides: object) -> dict:
    row = {
        "name": "Ada Fixture",
        "born": "1975-12-30",
        "known_for": "American golfer",
        "wikipedia": "https://en.wikipedia.org/wiki/Ada_Fixture",
    }
    row.update(overrides)
    return row


def test_wikipedia_title_decodes_underscores() -> None:
    assert wikipedia_title("https://en.wikipedia.org/wiki/C._S._Lewis") == "C. S. Lewis"
    assert wikipedia_title("https://en.wikipedia.org/wiki/Tiger_Woods") == "Tiger Woods"


def test_listed_day_rejects_year_only() -> None:
    assert listed_day("1975-12-30") == "1975-12-30"
    assert listed_day("1975-00-00") is None
    assert listed_day("1975") is None


def test_keeps_matching_day_precision() -> None:
    entity = _entity("1975-12-30", qid="Q54584", title="Tiger Woods")
    kept, exclusion = classify_row(_row(), "A♥", entity, today=TODAY)
    assert exclusion is None
    assert kept is not None
    assert kept["qid"] == "Q54584"
    assert kept["born"] == "1975-12-30"


def test_drops_year_only_listed_date() -> None:
    kept, exclusion = classify_row(_row(born="1975-00-00"), "A♥", _entity("1975-12-30"), today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "year_only"


def test_drops_wikidata_year_only() -> None:
    entity = _entity("1975-12-30", precision=9)
    kept, exclusion = classify_row(_row(), "A♥", entity, today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "wikidata_precision"
    assert parse_day_precision_time(entity, "P569") is None


def test_drops_dob_conflict() -> None:
    kept, exclusion = classify_row(_row(), "A♥", _entity("1975-12-29"), today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "dob_conflict"
    assert exclusion["wikidata_birth_date"] == "1975-12-29"


def test_drops_missing_qid() -> None:
    kept, exclusion = classify_row(_row(), "A♥", None, today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "missing_qid"


def test_drops_minors() -> None:
    born = "2012-12-30"
    kept, exclusion = classify_row(
        _row(born=born),
        birth_card_from_iso(born),
        _entity(born),
        today=TODAY,
    )
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "minor"


def test_drops_d3_description() -> None:
    entity = _entity("1975-12-30", description="American serial killer")
    kept, exclusion = classify_row(_row(), "A♥", entity, today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "description_keyword"


def test_drops_card_mismatch() -> None:
    kept, exclusion = classify_row(_row(), "2♥", _entity("1975-12-30"), today=TODAY)
    assert kept is None
    assert exclusion is not None
    assert exclusion["reason"] == "card_mismatch"


def test_does_not_invent_a_day() -> None:
    table = {"A♥": [_row(born="1975")]}
    kept, exclusions = verify_table(table, {}, today=TODAY)
    assert kept["A♥"] == []
    assert exclusions[0]["reason"] == "year_only"


def test_committed_table_is_grounded() -> None:
    table = json.loads(TABLE.read_text(encoding="utf-8"))
    assert len(table) == 53
    people = 0
    for card, rows in table.items():
        for row in rows:
            people += 1
            assert row["qid"].startswith("Q")
            assert listed_day(row["born"]) == row["born"]
            assert birth_card_from_iso(row["born"]) == card
            assert row["wikipedia"].startswith("https://en.wikipedia.org/wiki/")
            assert row["name"]
            assert row["known_for"]
    assert people >= 200


def test_provenance_records_drops() -> None:
    payload = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    assert payload["do_not_invent_dates"] is True if "do_not_invent_dates" in payload else True
    assert payload["rules"]["do_not_invent_dates"] is True
    assert payload["rules"]["year_before_1900_cut"] is False
    assert payload["catalog"] == payload["kept"] + payload["excluded"]
    assert payload["cards"] == 53
