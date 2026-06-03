#!/usr/bin/env python3
"""Dump the additive static tables from the Python Cardology engine to JSON.

These JSON files are the canonical generated data consumed by lib/reading.ts.
They are byte-for-byte derived from the Python engine so the pure-JS reading
builder reproduces the Python CLI output exactly.

Regenerate after the Python engine's data tables change:

    python3 scripts/dump_engine_data.py

Source engine: /Users/clr/cardology-llm/engine/cardology_engine.py
Tables dumped:
  - card-descriptions.json   (CARD_DESCRIPTIONS)
  - suit-domains.json        (SUIT_DOMAINS)
  - planet-domains.json      (PLANET_DOMAINS)

Note: THREE_LENS_INTERPRETATIONS is already dumped to lib/card-meanings.json
(verified byte-identical to the engine), so it is not re-dumped here.
get_position_meaning() always returns None in this engine build (the optional
cardology_refined_meanings module is absent), so position meanings are null.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ENGINE_DIR = Path("/Users/clr/cardology-llm/engine")
if str(ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(ENGINE_DIR))

import cardology_engine as engine  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "lib" / "engine-data"
OUT.mkdir(parents=True, exist_ok=True)


def write(name: str, data) -> None:
    path = OUT / name
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, sort_keys=False)
        fh.write("\n")
    print(f"wrote {path} ({len(data)} keys)")


def main() -> int:
    write("card-descriptions.json", engine.CARD_DESCRIPTIONS)
    write("suit-domains.json", engine.SUIT_DOMAINS)
    write("planet-domains.json", engine.PLANET_DOMAINS)

    # Sanity: confirm get_position_meaning is the null-returning fallback.
    sample = engine.get_position_meaning("8♦", "Mercury")
    assert sample is None, f"get_position_meaning unexpectedly returned {sample!r}"
    print("verified get_position_meaning() -> None")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
