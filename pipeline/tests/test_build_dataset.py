"""Seed-path rebuild + Commons license gate (offline fixtures only)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from pipeline.build_dataset import build_from_seed, is_allowed_commons_license, validate_people
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
