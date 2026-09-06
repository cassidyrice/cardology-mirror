"""NFL franchise grant dates and birth-card mapping."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import jsonschema

from pipeline.birthcard import birth_card, birth_card_from_iso, solar_value
from pipeline.franchises import (
    AFL_1959_08_14_SLUGS,
    CURRENT_32,
    FRANCHISES_JSONL,
    VERIFIED_SAMPLES,
    build_franchise_rows,
    parse_hof_franchise_date,
    year_crosscheck,
)

SCHEMA = Path(__file__).resolve().parents[1] / "schema" / "franchise.schema.json"

ADVERSARIAL = Path(__file__).resolve().parents[2] / "adversarial" / "birthcard_table.py"


def _adversarial_card(month: int, day: int) -> str:
    import importlib.util

    spec = importlib.util.spec_from_file_location("adversarial_birthcard_table", ADVERSARIAL)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.card_for(month, day)


def test_thirty_two_current_franchises() -> None:
    slugs = [seed["slug"] for seed in CURRENT_32]
    assert len(slugs) == 32
    assert len(set(slugs)) == 32
    rows = build_franchise_rows()
    assert len(rows) == 32
    assert {row["slug"] for row in rows} == set(slugs)


def test_verified_hof_grant_samples() -> None:
    rows = {row["slug"]: row for row in build_franchise_rows()}
    for slug, expected in VERIFIED_SAMPLES.items():
        assert rows[slug]["grant_date"] == expected
        assert rows[slug]["grant_date_precision"] == "day"
        assert rows[slug]["grant_date_status"] == "verified"


def test_every_grant_date_is_day_precise_and_cited() -> None:
    for row in build_franchise_rows():
        parsed = date.fromisoformat(row["grant_date"])
        iso, league = parse_hof_franchise_date(row["hof_franchise_date_raw"])
        assert iso == row["grant_date"]
        assert row["hof_league_mark"] == league
        assert row["hof_row_name"]
        assert row["sources"][0]["role"] == "primary_grant_date"
        assert "profootballhof.com" in row["sources"][0]["url"]
        assert parsed.year >= 1920
        assert row["grant_date_status"] == "verified"


def test_birth_cards_use_pipeline_formula_not_a_third_mapping() -> None:
    for row in build_franchise_rows():
        parsed = date.fromisoformat(row["grant_date"])
        expected = birth_card(parsed.month, parsed.day)
        assert row["card"]["symbol"] == expected
        assert row["card"]["symbol"] == birth_card_from_iso(row["grant_date"])
        assert row["solar_value"] == solar_value(parsed.month, parsed.day)
        assert row["card"]["symbol"] == _adversarial_card(parsed.month, parsed.day)
        assert row["card"]["symbol"] != "Joker"
        assert row["card"]["label"].endswith(("Hearts", "Clubs", "Diamonds", "Spades"))
        assert " of " in row["card"]["label"]


def test_afl_august_14_1959_quintet() -> None:
    rows = {row["slug"]: row for row in build_franchise_rows()}
    quintet = [rows[slug] for slug in AFL_1959_08_14_SLUGS]
    assert len(quintet) == 5
    assert {row["grant_date"] for row in quintet} == {"1959-08-14"}
    assert {row["card"]["symbol"] for row in quintet} == {"Q♣"}
    assert all(row["afl_1959_08_14_quintet"] for row in quintet)
    cowboys = rows["dallas-cowboys"]
    vikings = rows["minnesota-vikings"]
    assert cowboys["grant_date"] == vikings["grant_date"] == "1960-01-28"
    assert cowboys["card"]["symbol"] == "Q♣"
    assert "denver-broncos" in cowboys["same_card_slugs"]
    assert "dallas-cowboys" not in cowboys["same_grant_day_slugs"]
    assert "minnesota-vikings" in cowboys["same_grant_day_slugs"]


def test_packers_use_nfl_grant_not_1919_lore() -> None:
    packers = next(row for row in build_franchise_rows() if row["slug"] == "green-bay-packers")
    assert packers["grant_date"] == "1921-08-27"
    assert packers["year_crosscheck"] == "wikipedia_lists_older_year"
    assert 1919 in packers["wikipedia_years"]


def test_colts_use_1953_grant_not_aafc_1946() -> None:
    colts = next(row for row in build_franchise_rows() if row["slug"] == "indianapolis-colts")
    assert colts["grant_date"] == "1953-01-23"
    assert "1946" not in colts["hof_franchise_date_raw"]


def test_year_crosscheck_helpers() -> None:
    assert year_crosscheck("1921-08-27", "1919 1921 (NFL)") == "wikipedia_lists_older_year"
    assert year_crosscheck("1999-10-06", "2002") == "grant_precedes_first_season"
    assert year_crosscheck("1960-01-28", "1960") == "year_mentioned"


def test_committed_jsonl_matches_builder() -> None:
    committed = [
        json.loads(line)
        for line in FRANCHISES_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    built = build_franchise_rows()
    assert committed == built


def test_jsonl_validates_against_franchise_schema() -> None:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    for row in build_franchise_rows():
        jsonschema.validate(row, schema)


def test_no_person_or_card_slug_collisions() -> None:
    reserved = {"joker"}
    card_like = []
    for row in build_franchise_rows():
        slug = row["slug"]
        assert slug not in reserved
        assert "of-" not in slug
        card_like.append(slug)
    assert "ace-of-hearts" not in card_like
    assert "dallas-cowboys" in card_like
