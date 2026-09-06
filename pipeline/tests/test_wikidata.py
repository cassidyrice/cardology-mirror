"""Parse wbgetentities payloads; no SPARQL and no live Wikidata calls."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.wikidata import (
    batch_ids,
    extract_person,
    load_cached_entity,
)

FIXTURE_ENTITY = (
    Path(__file__).resolve().parents[1] / "data" / "fixtures" / "wikidata_Q0FIX1.json"
)


def test_batch_ids_are_groups_of_50() -> None:
    ids = [f"Q{i}" for i in range(120)]
    batches = list(batch_ids(ids, size=50))
    assert [len(b) for b in batches] == [50, 50, 20]


def test_extract_person_from_cached_entity() -> None:
    raw = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    person = extract_person(raw)
    assert person is not None
    assert person["qid"] == "Q0FIX1"
    assert person["label"] == "Ada Fixture"
    assert person["birth_date"] == "1991-02-17"
    assert person["precision"] == 11
    assert person["spouse_qids"] == ["Q0FIX2"]
    assert person["occupations"] == ["Q82594"]
    assert person["image"] == "Ada_Fixture.png"
    assert person["description"] == "synthetic fixture mathematician"


def test_extract_person_rejects_low_precision() -> None:
    raw = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    raw["claims"]["P569"][0]["mainsnak"]["datavalue"]["value"]["precision"] = 9
    assert extract_person(raw) is None


def test_load_cached_entity_roundtrip(tmp_path: Path) -> None:
    raw = json.loads(FIXTURE_ENTITY.read_text(encoding="utf-8"))
    cache = tmp_path / "cache"
    cache.mkdir()
    (cache / "Q0FIX1.json").write_text(json.dumps(raw), encoding="utf-8")
    loaded = load_cached_entity(cache, "Q0FIX1")
    assert loaded["id"] == "Q0FIX1"
