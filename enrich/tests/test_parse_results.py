"""parse_results joins predictions and rejects containment failures."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.contract import validate_enrichment, word_count
from enrich.parse_results import parse_results
from enrich.prompt import SYSTEM_INSTRUCTIONS

REPO = Path(__file__).resolve().parents[2]
FIXTURE_PEOPLE = REPO / "pipeline" / "data" / "fixtures" / "people.jsonl"


def _card_in_life(name: str) -> str:
    sentence = (
        f"{name} appears in the fixture source_text as a synthetic person used only "
        "for schema tests, and this sentence adds no life events beyond that line."
    )
    words = sentence
    while word_count(words) < 120:
        words = f"{words} {sentence}"
    assert 120 <= word_count(words) <= 180
    return words


def _ok_payload(name: str) -> dict:
    return {
        "hook": f"{name} is a synthetic fixture used only for schema tests.",
        "evidence": [
            {
                "fact": "Synthetic fixture used only for schema tests.",
                "trait": "test double",
            },
            {
                "fact": "used only for schema tests",
                "trait": "non-biographical",
            },
            {
                "fact": "Synthetic fixture used only",
                "trait": "limited source",
            },
        ],
        "card_in_life": _card_in_life(name),
        "faq": [
            {"q": f"Who is {name}?", "a": "A synthetic fixture used only for schema tests."},
            {"q": "Is this a real biography?", "a": "No. Synthetic fixture used only for schema tests."},
            {"q": "Where does the fact come from?", "a": "The fixture source_text only."},
        ],
        "meta_description": f"{name}: synthetic fixture used only for schema tests.",
    }


def _pred(custom_id: str, payload: dict) -> dict:
    return {
        "custom_id": custom_id,
        "response": {
            "candidates": [
                {"content": {"parts": [{"text": json.dumps(payload)}]}}
            ]
        },
    }


def test_contract_rejects_short_card_in_life() -> None:
    payload = _ok_payload("Ada Fixture")
    payload["card_in_life"] = "too short"
    errors = validate_enrichment(payload)
    assert any("card_in_life" in err for err in errors)


def test_parse_accepts_contained_fixture_and_rejects_invented_fact(tmp_path: Path) -> None:
    good = _ok_payload("Ada Fixture")
    bad = _ok_payload("Bea Fixture")
    bad["evidence"][0]["fact"] = "Bea won a Nobel Prize for physics in 2001."

    predictions = tmp_path / "predictions.jsonl"
    with predictions.open("w", encoding="utf-8") as handle:
        handle.write(json.dumps(_pred("Q0FIX1", good)) + "\n")
        handle.write(json.dumps(_pred("Q0FIX2", bad)) + "\n")

    enriched = tmp_path / "people_enriched.jsonl"
    retry = tmp_path / "retry.jsonl"
    report_path = tmp_path / "report.json"
    report = parse_results(
        people_path=FIXTURE_PEOPLE,
        predictions_path=predictions,
        enriched_path=enriched,
        retry_path=retry,
        report_path=report_path,
    )

    assert report["accepted"] == 1
    assert report["rejected"] == 2
    rows = [json.loads(line) for line in enriched.read_text(encoding="utf-8").splitlines()]
    assert rows[0]["qid"] == "Q0FIX1"
    assert rows[0]["hook"].startswith("Ada Fixture")
    assert rows[0]["enrich_status"] == "ok"
    assert "Q0FIX3" not in {row["qid"] for row in rows}

    retry_rows = [json.loads(line) for line in retry.read_text(encoding="utf-8").splitlines()]
    reasons = {row["qid"]: row["reasons"] for row in retry_rows}
    assert any("containment" in reason for reason in reasons["Q0FIX2"])
    assert reasons["Q0FIX3"] == ["no prediction"]
    assert "Use ONLY the facts in <source_text>" in SYSTEM_INSTRUCTIONS


def test_parse_recovers_slug_when_custom_id_missing(tmp_path: Path) -> None:
    payload = _ok_payload("Ada Fixture")
    row = {
        "request": {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": "<person>\nslug: ada-fixture\n</person>"}],
                }
            ]
        },
        "response": {
            "candidates": [{"content": {"parts": [{"text": json.dumps(payload)}]}}]
        },
    }
    predictions = tmp_path / "predictions.jsonl"
    predictions.write_text(json.dumps(row) + "\n", encoding="utf-8")
    report = parse_results(
        people_path=FIXTURE_PEOPLE,
        predictions_path=predictions,
        enriched_path=tmp_path / "out.jsonl",
        retry_path=tmp_path / "retry.jsonl",
        report_path=tmp_path / "report.json",
    )
    assert report["accepted"] == 1
