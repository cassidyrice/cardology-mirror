"""Wave slice prefers largest holes and skips already-enriched / empty / TPU drops."""

from __future__ import annotations

import json
from pathlib import Path

from enrich.make_batch import write_batch
from enrich.make_wave_slice import select_slice, write_wave_slice
from enrich.prompt import SYSTEM_INSTRUCTIONS

REPO = Path(__file__).resolve().parents[2]
MEANINGS = REPO / "pipeline" / "data" / "card_meanings.json"


def _person(qid: str, name: str, *, source: str | None = "A ready Wikipedia extract.") -> dict:
    row = {
        "qid": qid,
        "name": name,
        "slug": name.lower().replace(" ", "-"),
        "birth_date": "1950-01-15",
        "card": "A♠",
    }
    if source is not None:
        row["source_text"] = source
    return row


def _write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )


def test_select_slice_largest_holes_then_limit(tmp_path: Path) -> None:
    packs = {
        "rock_hall": tmp_path / "rock.jsonl",
        "olympics_summer": tmp_path / "oly.jsonl",
        "tiny": tmp_path / "tiny.jsonl",
    }
    _write_jsonl(
        packs["rock_hall"],
        [_person(f"QROCK{i}", f"Rock {i}") for i in range(6)]
        + [_person("QNOSRC", "No Source", source=None)],
    )
    _write_jsonl(
        packs["olympics_summer"],
        [_person(f"QOLY{i}", f"Oly {i}") for i in range(3)]
        + [_person("QROCK0", "Rock 0 overlap")],
    )
    _write_jsonl(packs["tiny"], [_person("QTINY", "Tiny")])
    enriched = tmp_path / "enriched.jsonl"
    _write_jsonl(enriched, [{"qid": "QROCK1"}])

    people, stats = select_slice(
        pack_paths=packs,
        enriched={"QROCK1"},
        limit=5,
    )
    assert stats["hole_order"][0] == "rock_hall"
    # 5 rock + 3 oly + 1 tiny; QROCK1 already enriched, QNOSRC dropped, QROCK0 overlap
    assert stats["unique_missing"] == 9
    assert [row["qid"] for row in people] == [
        "QROCK0",
        "QROCK2",
        "QROCK3",
        "QROCK4",
        "QROCK5",
    ]
    assert "QNOSRC" not in {row["qid"] for row in people}
    assert "QROCK1" not in {row["qid"] for row in people}
    assert stats["by_pack_taken"]["rock_hall"] == 5
    assert stats["by_pack_taken"]["olympics_summer"] == 0
    assert stats["by_pack_taken"]["tiny"] == 0
    assert stats["held_for_later_slices"] == 4


def test_select_slice_skips_tpu_drop_qids(tmp_path: Path) -> None:
    packs = {"nfl_hof": tmp_path / "nfl.jsonl"}
    _write_jsonl(
        packs["nfl_hof"],
        [
            _person("QKEEP1", "Keep One"),
            _person("Q3133396", "Herb Reed drop"),
            _person("QKEEP2", "Keep Two"),
        ],
    )
    people, stats = select_slice(
        pack_paths=packs,
        enriched=set(),
        limit=1079,
        exclude={"Q3133396", "Q228808"},
    )
    assert [row["qid"] for row in people] == ["QKEEP1", "QKEEP2"]
    assert stats["unique_missing"] == 2
    assert stats["dropped_excluded"] == 1
    assert "Q3133396" not in {row["qid"] for row in people}


def test_write_wave_slice_uses_locked_contract(tmp_path: Path) -> None:
    packs = {"rock_hall": tmp_path / "rock.jsonl"}
    _write_jsonl(packs["rock_hall"], [_person("QSLICE1", "Slice One")])
    enriched = tmp_path / "enriched.jsonl"
    _write_jsonl(enriched, [])
    result = write_wave_slice(
        meanings_path=MEANINGS,
        enriched_path=enriched,
        people_out=tmp_path / "people.jsonl",
        batch_out=tmp_path / "batch.jsonl",
        inventory_out=tmp_path / "inv.json",
        estimate_out=tmp_path / "est.json",
        qids_out=tmp_path / "qids.jsonl",
        pack_paths=packs,
        limit=1079,
        target_usd_band=20.0,
    )
    assert result["requests"] == 1
    assert result["stop"] is False
    rows = [
        json.loads(line)
        for line in (tmp_path / "batch.jsonl").read_text(encoding="utf-8").splitlines()
        if line
    ]
    text = rows[0]["request"]["contents"][0]["parts"][0]["text"]
    assert SYSTEM_INSTRUCTIONS in text
    config = rows[0]["request"]["generationConfig"]
    assert config["temperature"] == 0.0
    assert config["thinkingConfig"]["thinkingLevel"] == "LOW"
    written = write_batch(
        people_path=tmp_path / "people.jsonl",
        meanings_path=MEANINGS,
        out_path=tmp_path / "batch2.jsonl",
    )
    assert written["requests"] == 1
