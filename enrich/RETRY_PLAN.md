# Vertex enrich retry (836) — submitted and parsed

Retry job `403973903623389184` **SUCCEEDED** (818/836). Remainder job
`5794641920097517568` **SUCCEEDED** (18/18). Hub people job
`1673848261053513728` **SUCCEEDED** (1075/1079 accepted). Do not submit
another job unless asked. Results live in `people_enriched.jsonl`
(**2133** = 1058 celebrity + 1075 hub). Celebrity `retry.jsonl` is empty.
Hub drops are in `enrich/artifacts/hub_retry.jsonl` (4).

## Root cause

Job `2948789168064430080` returned 1058/1058 predictions. The ≥0.85 fuzzy
containment gate accepted 222 and rejected **836**. Failure mix:

| Kind | Rows | Notes |
|---|---|---|
| containment only | 814 | 1422 evidence facts below 0.85 |
| containment + meta >155 | 18 | meta 156–160 chars |
| meta only | 4 | 22 meta overruns total |

The model **paraphrased** Wikipedia `source_text` instead of copying a span:

- Pronoun rewrite: `Gilgeous-Alexander led the Thunder…` → `He led the Thunder…`
- Merged sentences: two clauses joined with “functioning as both…”
- Soften / drop words: `for her role in On My Block (2018)` → `She had a role in…`
- Invented glue: `before transitioning to his current promotion`

Median fail score was 0.72. 554/1422 facts sat in 0.75–0.85 — close paraphrases,
not missing source. All 836 retry qids still have `source_text` in `people.jsonl`.

Accepted rows in #67 also mostly paraphrased (188/666 facts are normalized
substrings). This retry **tightens** the gate; it does not loosen 0.85.

## What this PR changes

1. **Prompt** — `evidence.fact` must be a near-verbatim contiguous substring.
   No paraphrase, no sentence merge, no He/She rewrite of a named subject.
2. **Meta** — target ≤145 chars (hard ceiling still 155).
3. **Decode** — `temperature` 0.2 → **0.0**; `thinkingLevel=LOW` (model default
   is HIGH; thinking cannot be turned off on gemini-3.1-pro-preview).
4. **Parse helper** — `enrich/containment.py` requires normalized substring
   (case/whitespace/punctuation only). `python3 -m enrich.parse_results --append`
   keeps the 222 from #67.
5. **Batch** — 836 requests from `people.jsonl ∩` the original retry qids.

## Rebuild (no spend)

```bash
python3 -m enrich.make_retry_batch
python3 -m enrich.estimate \
  --input enrich/artifacts/vertex_retry_batch.jsonl \
  --out enrich/artifacts/cost_estimate.json
```

## Cost (same model, Flex/Batch rates)

See `enrich/artifacts/cost_estimate.json`. Same $1 / $6 per million as the
1058-row job (`~$3.73` / `~$16.43` for 1058).

| Band | 836 retry |
|---|---|
| Output JSON only (theoretical) | **$3.11** |
| thinkingLevel=LOW (this JSONL) | **~$7.12** |
| HIGH upper (2500 thought tokens/row) | **$13.14** |

HIGH upper is **inside the ~$16 target**. Thinking cannot be disabled on
`gemini-3.1-pro-preview`; this JSONL sets `thinkingLevel=LOW`.

## After SUCCEEDED (remainder + hub results)

1. Remainder: downloaded 18 lines; appended all 18; celebrity total **1058**.
2. Hub job `1673848261053513728`: downloaded 1079 lines (gitignored).
3. Parsed with **near-verbatim** containment (same #70 contract).
4. Appended **1075** accepted hub rows. Did not overwrite the 1058.
   Total **2133**. Dropped 4 `card_in_life` shorts → `hub_retry.jsonl`.
5. Celebrity `retry.jsonl` stays empty. Do not resubmit unless asked.

## Out of scope

- No further Vertex submit
- No deploy, checkout, Stripe, webhook, or `generate_reading` edits
- No D1 Joker remapping
- #80 submit-only draft is superseded by this results PR; do not merge
  without asking
