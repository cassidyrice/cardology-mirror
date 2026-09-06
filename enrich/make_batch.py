"""Write a Vertex-ready Gemini batch JSONL. Does not submit a job or spend money."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable

from enrich.prompt import SYSTEM_INSTRUCTIONS, render_user_prompt

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PEOPLE = ROOT / "pipeline" / "data" / "people.jsonl"
DEFAULT_MEANINGS = ROOT / "pipeline" / "data" / "card_meanings.json"
DEFAULT_OUT = ROOT / "enrich" / "out" / "vertex_batch.jsonl"


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def load_meanings(path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"card_meanings.json must be an object: {path}")
    return payload


def meaning_text(meanings: dict[str, dict[str, Any]], card: str) -> str:
    entry = meanings.get(card)
    if not entry:
        raise KeyError(f"no harvested meaning for card {card!r}")
    text = (entry.get("meaning") or "").strip()
    if not text:
        raise KeyError(f"empty meaning for card {card!r}")
    return text


def vertex_request(user_text: str) -> dict[str, Any]:
    return {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{SYSTEM_INSTRUCTIONS}\n\n{user_text}"}],
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingLevel": "LOW"},
        },
    }


def iter_batch_rows(
    people: Iterable[dict[str, Any]],
    meanings: dict[str, dict[str, Any]],
    include_qids: set[str] | None = None,
) -> Iterable[dict[str, Any]]:
    for person in people:
        source_text = (person.get("source_text") or "").strip()
        card = str(person.get("card") or "")
        qid = str(person.get("qid") or person.get("slug") or "")
        if include_qids is not None and qid not in include_qids:
            continue
        if not source_text or not card or not qid:
            continue
        user_text = render_user_prompt(
            name=str(person.get("name") or ""),
            slug=str(person.get("slug") or ""),
            birth_date=str(person.get("birth_date") or ""),
            card=card,
            card_meaning=meaning_text(meanings, card),
            source_text=source_text,
        )
        yield {
            "custom_id": qid,
            "request": vertex_request(user_text),
        }


def write_batch(
    *,
    people_path: Path,
    meanings_path: Path,
    out_path: Path,
    include_qids: set[str] | None = None,
) -> dict[str, int]:
    if not people_path.is_file():
        raise SystemExit(
            f"people.jsonl not found: {people_path}\n"
            "Build it from the seed drop or pass --people pipeline/data/fixtures/people.jsonl"
        )
    people = load_jsonl(people_path)
    meanings = load_meanings(meanings_path)
    rows = list(iter_batch_rows(people, meanings, include_qids=include_qids))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return {"people": len(people), "requests": len(rows)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Write Vertex Gemini batch JSONL. Does not submit a job."
    )
    parser.add_argument("--people", type=Path, default=DEFAULT_PEOPLE)
    parser.add_argument("--meanings", type=Path, default=DEFAULT_MEANINGS)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args(argv)
    result = write_batch(
        people_path=args.people,
        meanings_path=args.meanings,
        out_path=args.out,
    )
    print(
        f"wrote {result['requests']} Vertex requests from {result['people']} people → {args.out}"
    )
    print("No batch job was submitted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
