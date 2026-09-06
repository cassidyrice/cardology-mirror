# Vertex enrich retry (836) — submitted and parsed

Retry job `403973903623389184` **SUCCEEDED** (818/836). Remainder job
`5794641920097517568` **SUCCEEDED** (18/18). Do not submit another job
unless asked. Results live in `people_enriched.jsonl` (**1058/1058**);
`retry.jsonl` is empty.

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

## After SUCCEEDED (remainder results)

1. Downloaded `enrich/out/predictions.jsonl` (18 lines, gitignored).
2. Parsed with **near-verbatim** containment (not fuzzy 0.85).
3. Appended 18 accepted rows to `pipeline/data/people_enriched.jsonl`.
   Did not overwrite the 1040 from #67/#73. Total **1058**.
4. `retry.jsonl` is empty. Do not resubmit.

## Out of scope

- No further Vertex submit
- No deploy, checkout, Stripe, webhook, or `generate_reading` edits
- No D1 Joker remapping
- #79 submit PR left unmerged; this results PR stays draft
