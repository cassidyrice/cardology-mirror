"""Hub people batch includes only day-precision + source_text rows."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.make_hub_batch import write_hub_batch
from enrich.prompt import SYSTEM_INSTRUCTIONS

REPO = Path(__file__).resolve().parents[2]
MEANINGS = REPO / "pipeline" / "data" / "card_meanings.json"


def _person(qid: str, *, birth_date: str = "1955-01-27", source_text: str = "Ready.") -> dict:
    return {
        "qid": qid,
        "name": qid,
        "slug": qid.lower(),
        "birth_date": birth_date,
        "card": "K♣",
        "source_text": source_text,
        "source_url": "https://en.wikipedia.org/wiki/Test",
    }


def _write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")


def test_hub_batch_excludes_enriched_retry_and_date_only(tmp_path: Path) -> None:
    presidents = tmp_path / "presidents.jsonl"
    governors = tmp_path / "governors.jsonl"
    _write_jsonl(
        presidents,
        [
            _person("QNEW1", source_text="President source text."),
            _person("QENR1", source_text="Already enriched president."),
            _person("QYEAR", birth_date="1955", source_text="Year only."),
            _person("QNOSRC", source_text=""),
        ],
    )
    _write_jsonl(
        governors,
        [
            _person("QNEW1", source_text="Duplicate across packs."),
            _person("QNEW2", source_text="Governor source text."),
            _person("QSUB18", source_text="Already on remainder job."),
        ],
    )
    enriched = tmp_path / "enriched.jsonl"
    retry = tmp_path / "retry.jsonl"
    _write_jsonl(enriched, [{"qid": "QENR1"}])
    _write_jsonl(retry, [{"qid": "QSUB18"}])

    result = write_hub_batch(
        meanings_path=MEANINGS,
        enriched_path=enriched,
        retry_path=retry,
        people_out=tmp_path / "hub_people.jsonl",
        batch_out=tmp_path / "vertex_hub_batch.jsonl",
        inventory_out=tmp_path / "inventory.json",
        estimate_out=tmp_path / "estimate.json",
        pack_paths={"presidents": presidents, "governors": governors},
        target_usd_band=20.0,
    )
    assert result["requests"] == 2
    rows = [
        json.loads(line)
        for line in (tmp_path / "vertex_hub_batch.jsonl").read_text(encoding="utf-8").splitlines()
        if line
    ]
    assert {row["custom_id"] for row in rows} == {"QNEW1", "QNEW2"}
    for row in rows:
        text = row["request"]["contents"][0]["parts"][0]["text"]
        assert SYSTEM_INSTRUCTIONS in text
        assert "near-verbatim contiguous substring" in text
        assert "≤ 145 chars" in text
        config = row["request"]["generationConfig"]
        assert config["temperature"] == 0.0
        assert config["thinkingConfig"]["thinkingLevel"] == "LOW"
    estimate = json.loads((tmp_path / "estimate.json").read_text(encoding="utf-8"))
    assert estimate["requests"] == 2
    assert estimate["target_usd_band"] == 20.0
    inventory = json.loads((tmp_path / "inventory.json").read_text(encoding="utf-8"))
    assert inventory["by_pack_new"]["presidents"] == 1
    assert inventory["by_pack_new"]["governors"] == 1
    assert inventory["excluded_from_submit"]["already_enriched"] == 1
    assert inventory["excluded_from_submit"]["already_submitted_remainder_18"] == 1
