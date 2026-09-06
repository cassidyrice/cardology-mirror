"""MLB franchise first-game dates and birth-card mapping."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import jsonschema

from pipeline.birthcard import birth_card, birth_card_from_iso, solar_value
from pipeline.mlb import (
    AA_1882_05_02_SLUGS,
    CURRENT_30,
    EXPANSION_1969_04_08_SLUGS,
    MLB_JSONL,
    VERIFIED_SAMPLES,
    build_mlb_rows,
    year_crosscheck,
)

SCHEMA = Path(__file__).resolve().parents[1] / "schema" / "mlb.schema.json"

ADVERSARIAL = Path(__file__).resolve().parents[2] / "adversarial" / "birthcard_table.py"


def _adversarial_card(month: int, day: int) -> str:
    import importlib.util

    spec = importlib.util.spec_from_file_location("adversarial_birthcard_table", ADVERSARIAL)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.card_for(month, day)


def test_thirty_current_mlb_clubs() -> None:
    slugs = [seed["slug"] for seed in CURRENT_30]
    assert len(slugs) == 30
    assert len(set(slugs)) == 30
    rows = build_mlb_rows()
    assert len(rows) == 30
    assert {row["slug"] for row in rows} == set(slugs)


def test_verified_first_game_samples() -> None:
    rows = {row["slug"]: row for row in build_mlb_rows()}
    for slug, expected in VERIFIED_SAMPLES.items():
        assert rows[slug]["first_game"] == expected
        assert rows[slug]["first_game_precision"] == "day"
        assert rows[slug]["first_game_status"] == "verified"


def test_every_first_game_is_day_precise_and_cited() -> None:
    for row in build_mlb_rows():
        parsed = date.fromisoformat(row["first_game"])
        assert row["first_game"] == parsed.isoformat()
        assert row["first_season_name"]
        assert row["sources"][0]["role"] == "primary_first_game"
        assert "baseball-reference.com/teams/" in row["sources"][0]["url"]
        assert row["sources"][1]["role"] == "game_log_corroboration"
        assert "retrosheet.org" in row["sources"][1]["url"]
        assert row["first_game_status"] == "verified"
        assert parsed.year >= 1876


def test_birth_cards_use_pipeline_formula_not_a_third_mapping() -> None:
    for row in build_mlb_rows():
        parsed = date.fromisoformat(row["first_game"])
        expected = birth_card(parsed.month, parsed.day)
        assert row["card"]["symbol"] == expected
        assert row["card"]["symbol"] == birth_card_from_iso(row["first_game"])
        assert row["solar_value"] == solar_value(parsed.month, parsed.day)
        assert row["card"]["symbol"] == _adversarial_card(parsed.month, parsed.day)
        assert row["card"]["symbol"] != "Joker"
        assert row["card"]["label"].endswith(("Hearts", "Clubs", "Diamonds", "Spades"))
        assert " of " in row["card"]["label"]


def test_dates_are_franchise_first_games_not_player_dobs() -> None:
    for row in build_mlb_rows():
        blob = " ".join(
            [
                row["first_game_line"],
                row["first_season_name"],
                " ".join(row["notes"]),
            ]
        ).lower()
        assert "date of birth" not in blob
        assert "born " not in blob


def test_april_8_1969_expansion_quartet() -> None:
    rows = {row["slug"]: row for row in build_mlb_rows()}
    quartet = [rows[slug] for slug in EXPANSION_1969_04_08_SLUGS]
    assert len(quartet) == 4
    assert {row["first_game"] for row in quartet} == {"1969-04-08"}
    assert {row["card"]["symbol"] for row in quartet} == {"K♦"}
    assert all(row["expansion_1969_04_08_quartet"] for row in quartet)
    royals = rows["kansas-city-royals"]
    assert "san-diego-padres" in royals["same_first_game_day_slugs"]
    assert "washington-nationals" in royals["same_card_slugs"]


def test_aa_may_2_1882_trio() -> None:
    rows = {row["slug"]: row for row in build_mlb_rows()}
    trio = [rows[slug] for slug in AA_1882_05_02_SLUGS]
    assert {row["first_game"] for row in trio} == {"1882-05-02"}
    assert {row["card"]["symbol"] for row in trio} == {"4♠"}
    assert all(row["aa_1882_05_02_trio"] for row in trio)


def test_yankees_use_1903_highlanders_not_1901_baltimore() -> None:
    yankees = next(row for row in build_mlb_rows() if row["slug"] == "new-york-yankees")
    assert yankees["first_game"] == "1903-04-22"
    assert yankees["first_season_name"] == "New York Highlanders"
    assert "1901" not in yankees["first_game"]


def test_braves_use_1876_nl_not_1871_na() -> None:
    braves = next(row for row in build_mlb_rows() if row["slug"] == "atlanta-braves")
    assert braves["first_game"] == "1876-04-22"
    assert braves["year_crosscheck"] == "wikipedia_lists_older_year"
    assert 1871 in braves["wikipedia_years"]


def test_twins_and_rangers_are_different_senator_clubs() -> None:
    rows = {row["slug"]: row for row in build_mlb_rows()}
    assert rows["minnesota-twins"]["first_game"] == "1901-04-26"
    assert rows["texas-rangers"]["first_game"] == "1961-04-10"
    assert rows["minnesota-twins"]["first_season_name"] == "Washington Senators"
    assert rows["texas-rangers"]["first_season_name"] == "Washington Senators"


def test_year_crosscheck_helpers() -> None:
    assert year_crosscheck("1876-04-22", "1871* (NA) 1876 (NL)") == "wikipedia_lists_older_year"
    assert year_crosscheck("1961-04-11", "1961") == "year_mentioned"
    assert year_crosscheck("1962-04-10", "1962 (NL) 2013 (AL)") == "year_mentioned"


def test_committed_jsonl_matches_builder() -> None:
    committed = [
        json.loads(line)
        for line in MLB_JSONL.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    built = build_mlb_rows()
    assert committed == built


def test_jsonl_validates_against_mlb_schema() -> None:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    for row in build_mlb_rows():
        jsonschema.validate(row, schema)


def test_no_person_or_card_slug_collisions() -> None:
    reserved = {"joker"}
    card_like = []
    for row in build_mlb_rows():
        slug = row["slug"]
        assert slug not in reserved
        assert "of-" not in slug
        card_like.append(slug)
    assert "ace-of-hearts" not in card_like
    assert "atlanta-braves" in card_like
