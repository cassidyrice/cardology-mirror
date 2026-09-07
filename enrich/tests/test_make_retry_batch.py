"""Retry batch is people.jsonl ∩ retry.jsonl qids only."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.make_batch import write_batch
from enrich.make_retry_batch import load_retry_qids, write_retry_batch

REPO = Path(__file__).resolve().parents[2]
FIXTURE_PEOPLE = REPO / "pipeline" / "data" / "fixtures" / "people.jsonl"
MEANINGS = REPO / "pipeline" / "data" / "card_meanings.json"
PEOPLE = REPO / "pipeline" / "data" / "people.jsonl"
RETRY = REPO / "enrich" / "artifacts" / "retry.jsonl"
ENRICHED = REPO / "pipeline" / "data" / "people_enriched.jsonl"


def test_write_batch_filters_include_qids(tmp_path: Path) -> None:
    out = tmp_path / "subset.jsonl"
    result = write_batch(
        people_path=FIXTURE_PEOPLE,
        meanings_path=MEANINGS,
        out_path=out,
        include_qids={"Q0FIX2"},
    )
    assert result["people"] == 3
    assert result["requests"] == 1
    rows = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines() if line]
    assert [row["custom_id"] for row in rows] == ["Q0FIX2"]


def test_load_retry_qids_skips_duplicates(tmp_path: Path) -> None:
    path = tmp_path / "retry.jsonl"
    path.write_text(
        json.dumps({"qid": "Q1"}) + "\n" + json.dumps({"qid": "Q1"}) + "\n",
        encoding="utf-8",
    )
    assert load_retry_qids(path) == ["Q1"]


def test_retry_batch_matches_current_retry_qids_and_avoids_enriched(tmp_path: Path) -> None:
    out = tmp_path / "vertex_retry_batch.jsonl"
    result = write_retry_batch(
        people_path=PEOPLE,
        meanings_path=MEANINGS,
        retry_path=RETRY,
        out_path=out,
    )
    retry_qids = set(load_retry_qids(RETRY))
    rows = [json.loads(line) for line in out.read_text(encoding="utf-8").splitlines() if line]
    batch_qids = {row["custom_id"] for row in rows}
    enriched_qids = {
        json.loads(line)["qid"]
        for line in ENRICHED.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
    assert result["retry_ids"] == len(retry_qids)
    assert result["requests"] == len(retry_qids)
    assert result["missing_in_people"] == []
    assert batch_qids == retry_qids
    assert batch_qids.isdisjoint(enriched_qids)
    assert len(retry_qids) == 0
    assert len(enriched_qids) == 4870
