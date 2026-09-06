# Vertex enrich retry (836) — STOP for BOSS APPROVE

Do **not** submit this batch. Wait for BOSS APPROVE.

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
4. **Parse helper** — `enrich/containment.py` now requires normalized substring
   (case/whitespace/punctuation only). Wire this when parsing the retry output
   (`parse_results` still lives on #66).
5. **Batch** — 836 requests from `people.jsonl ∩ retry.jsonl` qids. Regenerable.

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

## After BOSS APPROVE (not this PR)

1. Upload `enrich/artifacts/vertex_retry_batch.jsonl` with the #66 submit path
   (`VERTEX_LOCATION=global`, `gemini-3.1-pro-preview`).
2. Poll, download `enrich/out/predictions.jsonl`.
3. Parse with **near-verbatim** containment (not fuzzy 0.85).
4. Append accepted rows to `pipeline/data/people_enriched.jsonl`. Do not
   overwrite the 222 from #67.

## Out of scope

- No Vertex submit / poll / download
- No deploy, checkout, Stripe, webhook, or `generate_reading` edits
- No D1 Joker remapping
- #62 / #66 left unmerged
