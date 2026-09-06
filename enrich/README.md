# WP3 enrich scaffold (Vertex / Gemini batch)

Writes a **Vertex-ready JSONL** from `pipeline/data/people.jsonl` +
`pipeline/data/card_meanings.json`. Submit/poll lives in
`python3 -m enrich.submit_batch` (needs SA JSON + GCS; does not invent
credentials).

1. Build `people.jsonl` from the seed drop (`python3 -m pipeline.build_dataset --from-seed`).
2. Run `python3 -m enrich.make_retry_batch` for remaining qids.
3. Submit with `python3 -m enrich.submit_batch --input enrich/artifacts/vertex_retry_batch.jsonl`.
4. Download predictions into `enrich/out/predictions.jsonl` (gitignored).
5. Join with `python3 -m enrich.parse_results --append --retry-scope`.

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

Prompt buffers (same pattern as meta≤145): hook ≤38 words; card_in_life
125–175 words. Validator hard limits are unchanged.

Decode: `temperature=0.0`, `thinkingLevel=LOW`.

Parse helper: `enrich.containment.fact_is_near_verbatim` — case, whitespace,
and trivial punctuation only. Paraphrase fails.

## Results

| Job | State | Accepted | Rejected |
|---|---|---|---|
| `2948789168064430080` (#67, fuzzy ≥0.85) | SUCCEEDED | 222 | 836 |
| `403973903623389184` (near-verbatim) | SUCCEEDED | **818** this run / **1040** total | **18** |
| `5794641920097517568` (18 remainder) | QUEUED | — | 18 submitted |

Final drop 18: 16 Vertex TPU `CANCELLED` empty predictions (retryable),
1 hook (41 words), 1 `card_in_life` (119 words). This pass resubmitted all 18
with word-count buffers. Date-only hubs and other people packs are not in
this JSONL — see `enrich/artifacts/inventory.json`.

```bash
python3 -m enrich.parse_results \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/retry.jsonl
```

See `enrich/RETRY_PLAN.md`.

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

- No deploy, checkout, Stripe, webhook, or `generate_reading` changes
- No invented bios
