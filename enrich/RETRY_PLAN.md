# Vertex enrich retry (836) — SUBMITTED

BOSS APPROVE landed. #70 merged at `5c2ec113958061b14bf3f69a69598fb84fb047d6`.
The 836-row tightened batch is live. Do **not** submit a second copy.

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

## Submitted (2026-09-06)

| Field | Value |
|---|---|
| **Job id** | `projects/796629394796/locations/global/batchPredictionJobs/403973903623389184` |
| **Numeric id** | `403973903623389184` |
| **Display name** | `cardology-wp3-enrich-20260906T175440Z` |
| **State after 90s poll** | `JOB_STATE_QUEUED` |
| **Model** | `gemini-3.1-pro-preview` |
| **Location** | `global` (injected regional location 404s this model) |
| **Rows** | **836 / 836** |
| **Contract** | near-verbatim `evidence.fact`, meta ≤145, `temperature=0.0`, `thinkingLevel=LOW` |
| **#70 merge SHA** | `5c2ec113958061b14bf3f69a69598fb84fb047d6` |

See `enrich/artifacts/retry_submit_status.json`. First job (`2948789168064430080`)
took ~42 minutes PENDING→SUCCEEDED; do not block on this one.

### Poll later

`enrich.submit_batch` still lives on #66 (unmerged). From a checkout that has it:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/tmp/sa.json
export VERTEX_LOCATION=global
python3 -m enrich.submit_batch --poll \
  projects/796629394796/locations/global/batchPredictionJobs/403973903623389184
```

When `JOB_STATE_SUCCEEDED`:

1. Download predictions from the job output prefix to `enrich/out/predictions.jsonl`
2. Parse with **near-verbatim** containment (not fuzzy 0.85)
3. Append accepted rows to `pipeline/data/people_enriched.jsonl`. Do not
   overwrite the 222 from #67.

## Out of scope

- No deploy, checkout, Stripe, webhook, or `generate_reading` edits
- No D1 Joker remapping
- #62 / #66 left unmerged
- Results not downloaded — job still queued after the short poll
