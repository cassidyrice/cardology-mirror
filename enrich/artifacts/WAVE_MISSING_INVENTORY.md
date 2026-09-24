# Wave people missing Vertex enrich (inventory only)

Counted on `main` `29dae81`. **No Vertex job submitted. No merge. No deploy.**

Enriched file: `pipeline/data/people_enriched.jsonl` — **2133** rows / QIDs (matches hub after-count).

## Totals (wave catalogs, governors excluded from unique)

| | N |
|---|---|
| Unique people across wave catalogs | **2894** |
| Already in `people_enriched` | **149** |
| Missing / need Vertex | **2745** |
| Missing and Vertex-ready (`source_text` + `card` + `qid`) | **2745** |

Governors are 49/49 already in the hub job. Including them: unique 2943 / already 198 / missing still 2745.

MLB is a 30-row franchise first-game date pack, not people — not counted.

Hub/seed already covered and not double-counted as missing: celeb seed 1058, presidents 45, SCOTUS 9, signers 44, Nobel 950 (+ 4 known `card_in_life` shorts from the hub job). Born-on is the same 1058 seed.

## Breakdown (kept person pages vs missing enrich)

Kept = rows in that pack’s `people.jsonl` (provenance `kept`). Missing = those QIDs not in `people_enriched`.

| Wave | Pack | Kept pages | Already enriched | Missing |
|---|---|---:|---:|---:|
| 2 | senators | 99 | 5 | 94 |
| 2 | cabinet | 16 | 6 | 10 |
| 2-hub | governors | 49 | 49 | 0 |
| 3 | olympics summer | 541 | 2 | 539 |
| 3 | olympics winter | 30 | 0 | 30 |
| 3 | astronauts | 221 | 1 | 220 |
| 3 | oscars | 166 | 34 | 132 |
| 3 | emmys | 159 | 17 | 142 |
| 3 | tonys | 256 | 10 | 246 |
| 5 | NFL HoF | 308 | 1 | 307 |
| 5 | Grammy AOTY | 89 | 14 | 75 |
| 5 | Rock Hall | 753 | 32 | 721 |
| 6 | Pulitzer Fiction | 90 | 7 | 83 |
| 7 | House chairs | 29 | 0 | 29 |
| 7 | Kennedy Center Honors | 259 | 24 | 235 |
| 7 | TIME Person of the Year | 74 | 32 | 42 |

Sum of kept pages excluding governors: 3090. Unique after cross-pack dedupe: 2894 (196 overlap, mostly Kennedy Center ↔ Rock Hall / Oscars / Tonys / Grammys).

Cabinet’s 10 missing QIDs are the same list `hub_inventory.json` held last time.

## Sample missing

- Michael Phelps `Q39562` (olympics summer)
- Adrien Brody `Q104514` (oscars)
- Tom Hanks `Q34012` (oscars)
- Leonardo DiCaprio `Q38111` (oscars)
- Alan B. Shepard Jr. `Q174979` (astronauts)
- Adam B. Schiff `Q350843` (senators)
- Mike Johnson `Q19880665` (house chairs)
- Scott Bessent `Q7435987` (cabinet)
- Alan Alda `Q310394` (emmys)
- Adam Clayton `Q175907` (Grammy AOTY + Kennedy Center + Rock Hall)

## Vertex cost estimate (not an invoice)

Same method as `enrich/estimate.py` / prior hub + retry batches: `gemini-3.1-pro-preview` Flex/Batch, $1 / $6 per 1M tokens, 500 output tokens/row, LOW = 800 thought tokens/row (unpublished), HIGH upper = 2500 thought tokens/row (same band as the 1058-row and 1079-row jobs). Local `make_batch` only; thinkingLevel=LOW in the JSONL.

| Band | USD |
|---|---|
| no_thinking (theoretical floor) | **$10.19** |
| thinking_low (800/row) | **$23.37** |
| thinking_upper HIGH (2500/row) | **$43.13** |

Prior hub HIGH-upper was $16.96 for 1079 rows (~$0.01571/row). This 2745-row HIGH-upper is the same per-row band and is **above** the prior $16 / $20 target. A hub-sized slice (~1079) would stay near ~$17 HIGH; 2745/1079 ≈ 2.54 slices.

## Other catalog (not added to 2745)

Existing celeb-blog grounding (`pipeline/data/celebs/people.jsonl`): 29 profiles missing from `people_enriched`, 11 of those already inside the wave 2745, **18 blog-only** (Kendrick Lamar, LeBron, Messi, SZA, …). Not a wave SEO pack.

## Confirm

No Vertex job submitted. No merge. No deploy.
