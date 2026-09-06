# MLB first-game dates (debut coordinates)

Isolated `/mlb` scaffold. Dates are **franchise first MLB games**, not player
dates of birth. A later pack can cover player debuts.

## Rule

Primary date: the first regular-season box of the season Baseball-Reference
lists as the club’s **From** year. That date travels with the franchise through
relocations and renames.

- Not a player DOB.
- Not the first game in the current city when the franchise moved.
- Not National Association / local founding lore (Atlanta 1871, Chicago 1870).
- Day-precision only. Year-only and day conflicts are dropped, not invented.

Corroboration: Retrosheet first-season game logs (public domain). Wikipedia’s
MLB teams table is a **year** cross-check only.

Birth cards: `pipeline.birthcard` (December 31 = Joker). Year unused.

## Counts (2026-09-06)

| Result | Count | Reason |
|---|---:|---|
| **Kept pages** | **30** | Current MLB clubs with day-precise BBRef/Retrosheet first games |
| Hub | 1 | `/mlb` |
| **Total HTML pages** | **31** | Hub + 30 clubs |
| Year-only | 0 | — |
| Day conflict | 0 | BBRef schedule day matches Retrosheet first box |
| Player DOBs | 0 | Different queued pack |
| **Excluded** | **0** | |

30/30 current clubs are day-clean.

## Definitional notes (kept, not dropped)

These are source-definition choices, not day conflicts:

- **Atlanta Braves** — BBRef first NL game 1876-04-22, not 1871 NA.
- **Chicago Cubs** — BBRef first NL game 1876-04-25, not 1870 NABBP.
- **New York Yankees** — BBRef 1903-04-22 Highlanders, not 1901 Baltimore.
- **Cincinnati Reds** — 1882 AA club, not the 1876–1879 NL Reds.
- **Minnesota Twins** vs **Texas Rangers** — two different Senators clubs.

## Rebuild

```bash
python3 -m pipeline.build_mlb
python3 -m pytest pipeline/tests/test_mlb.py
bun run build:seo-mlb
bun run test:seo-mlb
```
