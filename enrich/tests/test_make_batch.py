"""Vertex batch stub writes requests and never invents biography."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.make_batch import write_batch
from enrich.prompt import SYSTEM_INSTRUCTIONS

REPO = Path(__file__).resolve().parents[2]
FIXTURE_PEOPLE = REPO / "pipeline" / "data" / "fixtures" / "people.jsonl"
MEANINGS = REPO / "pipeline" / "data" / "card_meanings.json"


def test_make_batch_writes_vertex_jsonl_from_fixtures(tmp_path: Path) -> None:
    out = tmp_path / "vertex_batch.jsonl"
    result = write_batch(people_path=FIXTURE_PEOPLE, meanings_path=MEANINGS, out_path=out)
    assert result["people"] == 3
    assert result["requests"] == 3

    rows = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines() if line]
    assert {row["custom_id"] for row in rows} == {"Q0FIX1", "Q0FIX2", "Q0FIX3"}
    for row in rows:
        text = row["request"]["contents"][0]["parts"][0]["text"]
        assert SYSTEM_INSTRUCTIONS in text
        assert "<source_text>" in text
        assert "Synthetic fixture used only for schema tests." in text
        assert row["request"]["generationConfig"]["responseMimeType"] == "application/json"


def test_make_batch_includes_joker_meaning(tmp_path: Path) -> None:
    out = tmp_path / "vertex_batch.jsonl"
    write_batch(people_path=FIXTURE_PEOPLE, meanings_path=MEANINGS, out_path=out)
    rows = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines() if line]
    joker = next(row for row in rows if row["custom_id"] == "Q0FIX2")
    text = joker["request"]["contents"][0]["parts"][0]["text"]
    assert "birth_card: Joker" in text
    assert "December 31" in text


def test_prompt_forbids_facts_outside_source_text() -> None:
    assert "Use ONLY the facts in <source_text>" in SYSTEM_INSTRUCTIONS
    assert "do not state it" in SYSTEM_INSTRUCTIONS
