# Pipeline data drop paths

The verified seed set lives in `pipeline/data/seed/`. Copy replacements
into that folder (preferred) or `pipeline/data/drop/` before a rebuild.
Full drop instructions: [`seed/README.md`](seed/README.md).

## Expected drop (~1,161 rows)

| File | Path | Columns |
|---|---|---|
| Celebrity seed CSV | `pipeline/data/seed/celebrity_birth_cards.csv` | `name,birth_date,birth_card,enwiki_views_8mo,slug` |
| Wikidata raw PSV | `pipeline/data/seed/wikidata_people_raw.psv` | `name\|birth_year\|birth_month\|birth_day\|enwiki_views_8mo` |

`--from-seed` also accepts the same files under `pipeline/data/drop/` if
`seed/` is empty.

Optional extra CSV column: `qid` (otherwise join on `slug` / normalized name).

`p26` / `p451` / `p106` may be semicolon- or comma-separated. `p18` is a
Commons filename. `p569_precision` must be ≥ 11 to keep the row.

## Generated

| File | Path | Tracked |
|---|---|---|
| Dataset | `pipeline/data/people.jsonl` | yes (seed rebuild artifact) |
| Exclusion report | `pipeline/data/exclusions.json` | yes (counts + reasons) |
| HTTP caches | `pipeline/data/cache/` | no |
| Presidents dataset | `pipeline/data/presidents/people.jsonl` | yes |
| Presidents provenance | `pipeline/data/presidents/provenance.json` | yes |
| Federal holidays JSONL | `seo-pages/data/holidays.jsonl` | yes (written by `python3 -m pipeline.holidays`) |
| Signers dataset | `pipeline/data/signers/people.jsonl` | yes |
| Signers provenance | `pipeline/data/signers/provenance.json` | yes |
| Nobel laureates dataset | `pipeline/data/nobel/people.jsonl` | yes |
| Nobel provenance | `pipeline/data/nobel/provenance.json` | yes |

## Fixtures (committed, ≤5 synthetic people)

`pipeline/data/fixtures/` holds schema/test rows only (`Q0FIX*`). Do not treat
them as celebrity bios and do not invent real-person copy here.

```bash
python3 -m pipeline.build_dataset --from-seed \
  --csv pipeline/data/fixtures/celebrity_birth_cards.csv \
  --psv pipeline/data/fixtures/wikidata_people_raw.psv \
  --blocklist pipeline/data/fixtures/blocklist.txt \
  --out /tmp/people.jsonl \
  --exclusion-report /tmp/exclusions.json
```

## NFL franchises (committed)

`franchises.jsonl` is a curated 32-row grant-date dataset, not a generated
celebrity rebuild. `hof_franchise_histories.json` is the HOF alias snapshot.
Regenerate both with `python3 -m pipeline.build_franchises`. Do not gitignore
these two files.

## MLB first games (committed)

`mlb.jsonl` is a curated 30-row first-game dataset, not a generated
celebrity rebuild. `mlb_first_games.json` is the BBRef/Retrosheet snapshot.
Regenerate both with `python3 -m pipeline.build_mlb`. Do not gitignore
these two files. Dates are franchise first MLB games, not player DOBs.

## US National Parks (committed)

Park dates live in `seo-pages/data/parks.jsonl` (not this folder). Primary
source is Wikipedia’s National Park establishment column. NPS first-unit
dates are footnotes only. See [`../../seo-pages/data/PARKS.md`](../../seo-pages/data/PARKS.md).
