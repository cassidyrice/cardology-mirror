"""Seed-path rebuild + Commons license gate (offline fixtures only)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.build_dataset import (
    build_from_seed,
    is_allowed_commons_license,
    load_summaries_jsonl,
    load_wikidata_overlay,
    titles_from_seed,
    validate_people,
)
from pipeline.exclusions import ExclusionReason

FIXTURES = Path(__file__).resolve().parents[1] / "data" / "fixtures"
TODAY = date(2026, 9, 6)


def test_allowed_commons_licenses() -> None:
    assert is_allowed_commons_license("CC0")
    assert is_allowed_commons_license("CC-BY-4.0")
    assert is_allowed_commons_license("CC BY-SA 3.0")
    assert is_allowed_commons_license("cc-by-sa-4.0")
    assert not is_allowed_commons_license("Fair")
    assert not is_allowed_commons_license("All rights reserved")
    assert not is_allowed_commons_license("")


def test_seed_rebuild_writes_valid_jsonl_and_exclusion_report(tmp_path: Path) -> None:
    people_path = tmp_path / "people.jsonl"
    report_path = tmp_path / "exclusions.json"

    result = build_from_seed(
        csv_path=FIXTURES / "celebrity_birth_cards.csv",
        psv_path=FIXTURES / "wikidata_people_raw.psv",
        out_jsonl=people_path,
        exclusion_report=report_path,
        today=TODAY,
        blocklist_path=FIXTURES / "blocklist.txt",
        summaries={
            "Q0FIX1": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Ada_Fixture",
                "description": "synthetic fixture mathematician",
            },
            "Q0FIX2": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Bea_Fixture",
                "description": "synthetic fixture writer",
            },
            "Q0FIX3": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Cal_Fixture",
                "description": "synthetic fixture athlete",
            },
            "Q0FIX4": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Dee_Fixture",
                "description": "American serial killer",
            },
        },
        image_licenses={"Ada_Fixture.png": "CC-BY-SA-4.0", "Secret.png": "All rights reserved"},
    )

    rows = [json_line for json_line in people_path.read_text(encoding="utf-8").splitlines() if json_line]
    people = [json.loads(line) for line in rows]
    validate_people(people)

    qids = {row["qid"] for row in people}
    assert qids == {"Q0FIX1", "Q0FIX2", "Q0FIX3"}
    ada = next(row for row in people if row["qid"] == "Q0FIX1")
    assert ada["card"] == "8♦"
    assert ada["image"] is not None
    bea = next(row for row in people if row["qid"] == "Q0FIX2")
    assert bea["card"] == "Joker"
    assert bea["image"] is None  # disallowed license

    report = json.loads(report_path.read_text(encoding="utf-8"))
    reasons = {item["qid"]: item["reason"] for item in report["excluded"]}
    assert reasons["Q0FIX4"] == ExclusionReason.DESCRIPTION_KEYWORD.value
    assert result["kept"] == 3
    assert result["excluded"] >= 1
    assert report["warnings"] == []


def test_seed_birth_card_mismatch_is_reported_not_trusted(tmp_path: Path) -> None:
    csv_path = tmp_path / "seed.csv"
    csv_path.write_text(
        "name,birth_date,birth_card,enwiki_views_8mo,slug\n"
        "Ada Fixture,1991-02-17,Joker,100,ada-fixture\n",
        encoding="utf-8",
    )
    people_path = tmp_path / "people.jsonl"
    report_path = tmp_path / "exclusions.json"
    build_from_seed(
        csv_path=csv_path,
        psv_path=FIXTURES / "wikidata_people_raw.psv",
        out_jsonl=people_path,
        exclusion_report=report_path,
        today=TODAY,
        blocklist_path=FIXTURES / "blocklist.txt",
        summaries={
            "Q0FIX1": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Ada_Fixture",
                "description": "synthetic fixture mathematician",
            }
        },
        image_licenses={"Ada_Fixture.png": "CC-BY-SA-4.0"},
    )
    ada = json.loads(people_path.read_text(encoding="utf-8").splitlines()[0])
    assert ada["card"] == "8♦"
    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["warnings"][0]["reason"] == "birth_card_mismatch"
    assert report["warnings"][0]["seed_birth_card"] == "Joker"
    assert report["warnings"][0]["computed_card"] == "8♦"


def test_load_summaries_jsonl_indexes_by_qid(tmp_path: Path) -> None:
    path = tmp_path / "summaries.jsonl"
    path.write_text(
        json.dumps(
            {
                "qid": "Q0FIX1",
                "source_text": "Wikipedia extract only.",
                "source_url": "https://example.test/wiki/Ada_Fixture",
                "description": "synthetic fixture mathematician",
            }
        )
        + "\n"
        + json.dumps({"source_text": "missing qid is ignored"})
        + "\n",
        encoding="utf-8",
    )
    loaded = load_summaries_jsonl(path)
    assert set(loaded) == {"Q0FIX1"}
    assert loaded["Q0FIX1"]["source_text"] == "Wikipedia extract only."
    assert load_summaries_jsonl(tmp_path / "missing.jsonl") == {}


def test_five_column_psv_joins_wikidata_overlay_for_qid(tmp_path: Path) -> None:
    csv_path = tmp_path / "seed.csv"
    csv_path.write_text(
        "name,birth_date,birth_card,enwiki_views_8mo,slug\n"
        "Ada Fixture,1991-02-17,8♦,100,ada-fixture\n",
        encoding="utf-8",
    )
    psv_path = tmp_path / "wikidata_people_raw.psv"
    psv_path.write_text(
        "name|birth_year|birth_month|birth_day|enwiki_views_8mo\n"
        "Ada Fixture|1991|2|17|100\n",
        encoding="utf-8",
    )
    overlay_path = tmp_path / "wikidata_people.jsonl"
    overlay_path.write_text(
        json.dumps(
            {
                "qid": "Q0FIX1",
                "lookup_title": "Ada Fixture",
                "label": "Ada Fixture",
                "description": "synthetic fixture mathematician",
                "enwiki_title": "Ada Fixture",
                "birth_date": "1991-02-17",
                "precision": 11,
                "spouse_qids": ["Q0FIX2"],
                "occupations": ["mathematician"],
            }
        )
        + "\n",
        encoding="utf-8",
    )
    people_path = tmp_path / "people.jsonl"
    report_path = tmp_path / "exclusions.json"
    result = build_from_seed(
        csv_path=csv_path,
        psv_path=psv_path,
        out_jsonl=people_path,
        exclusion_report=report_path,
        today=TODAY,
        blocklist_path=FIXTURES / "blocklist.txt",
        summaries={
            "Q0FIX1": {
                "source_text": "Wikipedia extract only.",
                "source_url": "https://example.test/wiki/Ada_Fixture",
                "description": "synthetic fixture mathematician",
            }
        },
        extra_psv_index=load_wikidata_overlay(overlay_path),
    )
    people = [json.loads(line) for line in people_path.read_text(encoding="utf-8").splitlines() if line]
    assert result["kept"] == 1
    assert people[0]["qid"] == "Q0FIX1"
    assert people[0]["birth_date"] == "1991-02-17"
    assert people[0]["card"] == "8♦"
    assert people[0]["source_text"] == "Wikipedia extract only."
    assert titles_from_seed(csv_path, psv_path) == ["Ada Fixture"]


def test_accented_seed_slug_is_ascii_for_schema(tmp_path: Path) -> None:
    csv_path = tmp_path / "seed.csv"
    csv_path.write_text(
        "name,birth_date,birth_card,enwiki_views_8mo,slug\n"
        "Timothée Chalamet,1995-12-27,5♣,100,timothée-chalamet-birth-card\n",
        encoding="utf-8",
    )
    psv_path = tmp_path / "wikidata_people_raw.psv"
    psv_path.write_text(
        "qid|en_label|en_description|p569|p569_precision|p26|p451|p106|p18|enwiki_title|slug\n"
        "Q0FIX1|Timothée Chalamet|synthetic fixture actor|1995-12-27|11|||actor||Timothée Chalamet|timothee-chalamet\n",
        encoding="utf-8",
    )
    people_path = tmp_path / "people.jsonl"
    report_path = tmp_path / "exclusions.json"
    build_from_seed(
        csv_path=csv_path,
        psv_path=psv_path,
        out_jsonl=people_path,
        exclusion_report=report_path,
        today=TODAY,
        blocklist_path=FIXTURES / "blocklist.txt",
        summaries={
            "Q0FIX1": {
                "source_text": "Synthetic fixture used only for schema tests.",
                "source_url": "https://example.test/wiki/Timothee_Chalamet",
                "description": "synthetic fixture actor",
            }
        },
    )
    person = json.loads(people_path.read_text(encoding="utf-8").splitlines()[0])
    assert person["slug"] == "timothee-chalamet-birth-card"
    validate_people([person])


def test_wikidata_birth_mismatch_does_not_keep_wrong_qid(tmp_path: Path) -> None:
    csv_path = tmp_path / "seed.csv"
    csv_path.write_text(
        "name,birth_date,birth_card,enwiki_views_8mo,slug\n"
        "Randy Jackson,1961-10-29,5♣,100,randy-jackson-birth-card\n",
        encoding="utf-8",
    )
    psv_path = tmp_path / "wikidata_people_raw.psv"
    psv_path.write_text(
        "name|birth_year|birth_month|birth_day|enwiki_views_8mo\n"
        "Randy Jackson|1961|10|29|100\n",
        encoding="utf-8",
    )
    people_path = tmp_path / "people.jsonl"
    report_path = tmp_path / "exclusions.json"
    result = build_from_seed(
        csv_path=csv_path,
        psv_path=psv_path,
        out_jsonl=people_path,
        exclusion_report=report_path,
        today=TODAY,
        blocklist_path=FIXTURES / "blocklist.txt",
        extra_psv_index={
            "randy jackson": {
                "qid": "Q337521",
                "en_label": "Randy Jackson",
                "en_description": "American musician",
                "p569": "1956-06-23",
                "p569_precision": "11",
                "enwiki_title": "Randy Jackson",
            }
        },
        summaries={
            "Q337521": {
                "source_text": "Wrong Randy Jackson biography.",
                "source_url": "https://example.test/wiki/Randy_Jackson",
            }
        },
    )
    assert result["kept"] == 0
    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["excluded"][0]["reason"] == "missing_qid"
    assert report["warnings"][0]["reason"] == "wikidata_birth_mismatch"
