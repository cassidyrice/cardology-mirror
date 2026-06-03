# engine-data (generated)

These JSON files are **generated** from the Python Cardology engine at
`/Users/clr/cardology-llm/engine/cardology_engine.py`. They are the canonical
static tables consumed by `lib/reading.ts` so the pure-JS reading builder
reproduces the Python CLI output exactly.

| file | source table | notes |
|------|--------------|-------|
| `card-descriptions.json` | `CARD_DESCRIPTIONS` | 39 cards have descriptions; others resolve to `null` (matching Python `.get()`). |
| `suit-domains.json` | `SUIT_DOMAINS` | keyed by suit glyph `♥ ♣ ♦ ♠`. |
| `planet-domains.json` | `PLANET_DOMAINS` | keyed by planet name. |

`THREE_LENS_INTERPRETATIONS` is **not** dumped here — it already lives at
`lib/card-meanings.json` (verified byte-identical to the engine).

`get_position_meaning()` always returns `None` in this engine build (the optional
`cardology_refined_meanings` module is absent), so every `position_meaning` /
`pluto_meaning` / `result_meaning` is `null`.

## Regenerate

```bash
python3 scripts/dump_engine_data.py
```
