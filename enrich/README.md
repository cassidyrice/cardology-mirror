# WP3 enrich scaffold (Vertex / Gemini batch)

Prep-only. This folder writes a **Vertex-ready JSONL** from
`pipeline/data/people.jsonl` + `pipeline/data/card_meanings.json`. It does
**not** submit a batch job, call Gemini, or spend money.

Human / Vertex step (later, off this PR):

1. Build `people.jsonl` from the seed drop (`python3 -m pipeline.build_dataset --from-seed`).
2. Run `python3 -m enrich.make_batch` to emit `enrich/out/vertex_batch.jsonl`.
3. Upload that file to a Vertex Gemini batch job yourself.
4. Download predictions into `enrich/out/predictions.jsonl` (gitignored).
5. Join predictions onto people rows with `python3 -m enrich.parse_results`
   (`--append --retry-scope` keeps already-accepted rows).

## Prompt contract (locked)

Each request asks the model to use **only** facts inside `<source_text>`.
`evidence.fact` must be a **near-verbatim contiguous substring** of
`<source_text>` (copy, do not paraphrase). Card-meaning copy is supplied
separately as interpretive context and must not be treated as biography.

Return JSON:

```
{
  "hook": str (≤ 40 words),
  "evidence": [3 × {"fact": str, "trait": str}],
  "card_in_life": str (120–180 words, name-specific, no generic filler),
  "faq": [3 × {"q": str, "a": str}],
  "meta_description": str (≤ 145 chars; hard ceiling 155)
}
```

Decode: `temperature=0.0`, `thinkingLevel=LOW`.

Parse helper: `enrich.containment.fact_is_near_verbatim` — case, whitespace,
and trivial punctuation only. Paraphrase fails.

## Results (do not resubmit)

| Job | State | Accepted | Rejected |
|---|---|---|---|
| `2948789168064430080` (#67, fuzzy ≥0.85) | SUCCEEDED | 222 | 836 |
| `403973903623389184` (near-verbatim) | SUCCEEDED | **818** this run / **1040** total | **18** |

Remaining 18: 16 Vertex TPU `CANCELLED` empty predictions, 1 hook (41 words),
1 `card_in_life` (119 words). Zero containment rejects on the retry.

```bash
python3 -m enrich.parse_results \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/retry.jsonl
```

See `enrich/RETRY_PLAN.md`. Celebrity remainder 18 was submitted on job
`5794641920097517568` (#79). Do not re-run those 18 or the 1040 already in
`people_enriched.jsonl`.

## Hub people packs (this job)

Presidents / governors / SCOTUS / Nobel / signers with day-precision
`birth_date` + `source_text`. Date-only hubs (holidays / parks / MLB / NFL
franchises / states) are skipped. Cabinet is inventoried but not included
(not in the approved 1079 / ~$17.02 HIGH-upper).

```bash
python3 -m enrich.make_hub_batch
python3 -m enrich.estimate \
  --input enrich/artifacts/vertex_hub_batch.jsonl \
  --target-usd 20 \
  --out enrich/artifacts/hub_pack_estimate.json
```

Same #70 contract: near-verbatim `evidence.fact`, meta ≤145, `temperature=0.0`,
`thinkingLevel=LOW`. Spend band for this job only is ≤~$20.

Submitted job `1673848261053513728` (`cardology-wp3-enrich-20260906T200230Z`)
is `JOB_STATE_QUEUED` after a 90s poll. 1079 rows. HIGH-upper **$16.96**.
Do not re-run. Leave `SUCCEEDED` poll / parse to a follow-up.

```bash
python3 -m enrich.submit_batch --poll \
  projects/796629394796/locations/global/batchPredictionJobs/1673848261053513728
```

## Local dry-run (fixtures, no spend)

```bash
python3 -m enrich.make_batch \
  --people pipeline/data/fixtures/people.jsonl \
  --meanings pipeline/data/card_meanings.json \
  --out /tmp/vertex_batch.jsonl
```

Default `--people` is `pipeline/data/people.jsonl`. If that file
is missing, pass the fixture path as above. Do not invent celebrity bios to
fill it.

## What is not here

- No second Vertex submit
- No checkout, Stripe, webhook, or `generate_reading` changes
