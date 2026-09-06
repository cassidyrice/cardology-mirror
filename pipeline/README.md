# Celebrity birth-card dataset pipeline

Static/SEO only. Rebuilds `people.jsonl` from public Wikimedia APIs or from the
verified off-repo seed drop. Does not touch checkout, Stripe, webhooks,
`generate_reading`, or any payment path.

## Birth-card rule (D1)

```
solar_value = 55 − (2 × month + day)
if solar_value ≤ 0: Joker   # Dec 31 only
deck: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
```

Lineage note: `lib/engine-core/engine.js` wraps solar 0 to 52 so spreads stay
52-wide (Dec 31 → K♠). This pipeline follows the public SEO rule and emits
**Joker**, never K♠, for December 31.

Feb 29 is computed directly (9♣), not remapped to Feb 28.

## Setup

```bash
python3 -m pip install -r pipeline/requirements.txt
python3 -m pytest pipeline/tests
```

Wikimedia requires a descriptive User-Agent. Override if needed:

```bash
export PIPELINE_USER_AGENT='CardBlueprintsBirthCardPipeline/0.1 (https://cardblueprints.com; you@example.com)'
```

## 8-month rebuild (pageviews → wikidata → build)

D4: run this path against the existing ~1,161-row seed first. Scale to ~24
months / ~4k rows later by passing `--months 24`.

```bash
# 1. Monthly top/en.wikipedia pageviews, junk-filtered and deduped
python3 -m pipeline.pageviews --months 8 \
  --cache-dir pipeline/data/cache/pageviews \
  --out pipeline/data/cache/pageviews.jsonl

# 2. wbgetentities in batches of 50 (REST only — no query.wikidata.org SPARQL)
python3 -m pipeline.wikidata \
  --titles pipeline/data/cache/pageviews.jsonl \
  --cache pipeline/data/cache/wikidata \
  --out pipeline/data/cache/wikidata_people.jsonl

# 3. enwiki REST summaries → source_text
python3 -m pipeline.wikipedia_summary \
  --from-cache pipeline/data/cache/wikidata \
  --cache-dir pipeline/data/cache/summaries \
  --out pipeline/data/cache/summaries.jsonl

# 4. Assemble people.jsonl + exclusion report
python3 -m pipeline.build_dataset \
  --pageviews pipeline/data/cache/pageviews.jsonl \
  --wikidata-cache pipeline/data/cache/wikidata \
  --summaries pipeline/data/cache/summaries.jsonl \
  --out pipeline/data/people.jsonl \
  --exclusion-report pipeline/data/exclusions.json
```

Or one shot after step caches exist / to fetch them:

```bash
python3 -m pipeline.build_dataset --fetch --months 8 \
  --out pipeline/data/people.jsonl
```

## Seed drop (~1,161 rows)

Verified `celebrity_birth_cards.csv` and `wikidata_people_raw.psv` live
off-repo. Copy them into the drop paths documented in
[`data/README.md`](data/README.md), then:

```bash
python3 -m pipeline.build_dataset --from-seed \
  --out pipeline/data/people.jsonl \
  --exclusion-report pipeline/data/exclusions.json
```

Birth cards are recomputed with `birthcard.py` (Dec 31 = Joker). Images are
kept only when the Commons license is CC0, CC-BY, or CC-BY-SA.

## Exclusions

| Reason | Rule |
|---|---|
| `description_keyword` | Wikipedia short description contains serial killer / murderer / terrorist / dictator (D3) |
| `minor` | born after today − 18 years |
| `precision` | Wikidata P569 precision &lt; 11 |
| `year_before_1900` | birth year &lt; 1900 |
| `blocklist` | Q-id / slug / name in [`blocklist.txt`](blocklist.txt) |
| `missing_qid` / `missing_birth` / `missing_source` | unusable row |

Counts land in `pipeline/data/exclusions.json` under `by_reason`.

## Schema

`schema/person.schema.json` validates each JSONL row:

`qid`, `name`, `slug`, `birth_date`, `card`, `views`, `occupations`,
`spouse_qids`, `image` (URL or null), `source_text`, `source_url`.

Tiny synthetic fixtures (not celebrity bios) live in `data/fixtures/` and are
what CI validates.
