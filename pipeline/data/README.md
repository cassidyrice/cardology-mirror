# Pipeline data drop paths

Generated outputs and the off-repo seed set are **not** committed. Copy the
verified files into `pipeline/data/seed/` (preferred) or `pipeline/data/drop/`
before a seed rebuild. Full drop instructions:
[`seed/README.md`](seed/README.md).

## Expected drop (off-repo, ~1,161 rows)

| File | Path | Columns |
|---|---|---|
| Celebrity seed CSV | `pipeline/data/seed/celebrity_birth_cards.csv` | `name,birth_date,birth_card,enwiki_views_8mo,slug` |
| Wikidata raw PSV | `pipeline/data/seed/wikidata_people_raw.psv` | `qid\|en_label\|en_description\|p569\|p569_precision\|p26\|p451\|p106\|p18\|enwiki_title\|slug` |

`--from-seed` also accepts the same files under `pipeline/data/drop/` if
`seed/` is empty.

Optional extra CSV column: `qid` (otherwise join on `slug` / normalized name).

`p26` / `p451` / `p106` may be semicolon- or comma-separated. `p18` is a
Commons filename. `p569_precision` must be ≥ 11 to keep the row.

## Generated (gitignored)

| File | Path |
|---|---|
| Dataset | `pipeline/data/people.jsonl` |
| Exclusion report | `pipeline/data/exclusions.json` |
| HTTP caches | `pipeline/data/cache/` |

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
