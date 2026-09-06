"""Harvested card_meanings.json must cover the full deck + Joker."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.birthcard import DECK
from pipeline.harvest_card_meanings import EXPECTED_CARD_COUNT, harvest_deck, load_sources

MEANINGS_PATH = Path(__file__).resolve().parents[1] / "data" / "card_meanings.json"


def test_card_meanings_json_is_complete() -> None:
    payload = json.loads(MEANINGS_PATH.read_text(encoding="utf-8"))
    expected = [symbol for symbol in DECK if symbol] + ["Joker"]
    assert len(expected) == EXPECTED_CARD_COUNT
    assert set(payload) == set(expected)
    for symbol in expected:
        entry = payload[symbol]
        assert entry["symbol"] == symbol
        assert entry["meaning"].strip()
        assert entry["page"].startswith("/birth-card/")


def test_harvest_matches_committed_file() -> None:
    harvested = harvest_deck(*load_sources())
    committed = json.loads(MEANINGS_PATH.read_text(encoding="utf-8"))
    assert harvested == committed


def test_joker_is_december_31_lineage() -> None:
    payload = json.loads(MEANINGS_PATH.read_text(encoding="utf-8"))
    meaning = payload["Joker"]["meaning"]
    assert "December 31" in meaning
    assert "Joker" in meaning
    assert "55" in meaning
