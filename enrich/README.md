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
| `5794641920097517568` (remaining 18) | SUCCEEDED | **18** this run / **1058** total | **0** |
| `1673848261053513728` (hub 1079) | SUCCEEDED | **1075** this run / **2133** total | **4** |

Celebrity remainder is complete (1058/1058); `retry.jsonl` stays empty.
Hub people packs (presidents / governors / SCOTUS / Nobel / signers) accepted
**1075 / 1079**. Dropped 4 Nobel `card_in_life` shorts (117–119 words):
Yoichiro Nambu, Heinrich Wieland, Frederick Soddy, Gerhard Domagk.
Zero containment rejects. Do not resubmit unless asked.

```bash
python3 -m enrich.parse_results \
  --people enrich/artifacts/hub_people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/hub_people.jsonl \
  --retry enrich/artifacts/hub_retry.jsonl
```

See `enrich/RETRY_PLAN.md`. Celebrity + hub jobs are closed. Wave slice 1
is a separate submit — do not merge results or start slice 2 unless asked.

## Wave slice 1 (this job)

First hub-sized slice of wave people missing from `people_enriched.jsonl`.
Largest holes first (Rock Hall, summer olympics, NFL HoF, …) until **1079**
unique QIDs with usable `source_text`. Same #70 / hub contract.

```bash
python3 -m enrich.make_wave_slice
python3 -m enrich.estimate \
  --input enrich/artifacts/vertex_wave_slice1_batch.jsonl \
  --out enrich/artifacts/wave_slice1_estimate.json
# submit only when HIGH-upper ≤ $20
python3 -m enrich.submit_batch --input enrich/artifacts/vertex_wave_slice1_batch.jsonl
```

Submitted job `5428091131676065792` (`cardology-wp3-enrich-20260906T225419Z`).
Brief poll: `JOB_STATE_RUNNING`. Do not submit the remaining ~1666 this job.
Ask before slice 2. Do not merge results.

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
