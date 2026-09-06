# Seed drop

The verified ~1,161-row celebrity seed lives at
`celebrity_birth_cards.csv`. Do **not** invent bios. The Wikidata PSV
drop is `wikidata_people_raw.psv` in this folder.

`pipeline/build_dataset.py --from-seed` looks here first, then
`pipeline/data/drop/`. Birth cards are always recomputed with
`pipeline/birthcard.py` (Dec 31 = **Joker**). A `birth_card` column, when
present, is checked against that formula and mismatches are reported — they
do not override D1.

## Expected files

| File | Path | Required columns |
|---|---|---|
| Celebrity seed CSV | `pipeline/data/seed/celebrity_birth_cards.csv` | `name,birth_date,birth_card,enwiki_views_8mo,slug` |
| Wikidata raw PSV | `pipeline/data/seed/wikidata_people_raw.psv` | `name\|birth_year\|birth_month\|birth_day\|enwiki_views_8mo` (verified drop). The fixture PSV uses `qid\|en_label\|…\|slug`. |

Optional extra CSV column: `qid` (otherwise the PSV is joined on `slug` /
normalized name).

Column notes:

- `birth_date` — ISO `YYYY-MM-DD`
- `birth_card` — symbol such as `5♣`, `K♠`, or `Joker` (informational)
- `enwiki_views_8mo` — integer pageviews over the 8-month window
- `slug` — kebab-case person slug

Header-only template: [`celebrity_birth_cards.header.csv`](celebrity_birth_cards.header.csv).
Synthetic (non-celebrity) fixture that uses the same columns:
[`../fixtures/celebrity_birth_cards.csv`](../fixtures/celebrity_birth_cards.csv).

## Drop and rebuild

```bash
# After copying the verified off-repo files into this folder:
python3 -m pipeline.build_dataset --from-seed \
  --out pipeline/data/people.jsonl \
  --exclusion-report pipeline/data/exclusions.json
```

Or point at explicit paths:

```bash
python3 -m pipeline.build_dataset --from-seed \
  --csv pipeline/data/seed/celebrity_birth_cards.csv \
  --psv pipeline/data/seed/wikidata_people_raw.psv \
  --out pipeline/data/people.jsonl
```

The CSV-only 5-column file is accepted as the seed index. The PSV drop is
`name|birth_year|birth_month|birth_day|enwiki_views_8mo`. Schema-valid
`people.jsonl` still needs a Q-id and `source_text`: pass `--fetch` so
`--from-seed` resolves titles via Wikidata REST + enwiki summaries. It will
not invent bios. Without the PSV, `--from-seed` exits and tells you what to
drop.

## Gitignore

`celebrity_birth_cards.csv` and `wikidata_people_raw.psv` are tracked.
Keep this README, `.gitkeep`, and the header template.
