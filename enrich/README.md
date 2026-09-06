# WP3 enrich scaffold (Vertex / Gemini batch)

Prep-only. This folder writes a **Vertex-ready JSONL** from
`pipeline/data/people.jsonl` + `pipeline/data/card_meanings.json`. It does
**not** submit a batch job, call Gemini, or spend money.

Human / Vertex step (later, off this PR):

1. Build `people.jsonl` from the seed drop (`python3 -m pipeline.build_dataset --from-seed`).
2. Run `python3 -m enrich.make_batch` to emit `enrich/out/vertex_batch.jsonl`.
3. Upload that file to a Vertex Gemini batch job yourself.
4. Download predictions into `enrich/out/predictions.jsonl` (gitignored).
5. Join predictions onto people rows to produce `people_enriched.jsonl` for
   `seo-pages/` (WP4). The join script is not in this scaffold.

## Prompt contract (locked)

Each request asks the model to use **only** facts inside `<source_text>`.
Card-meaning copy is supplied separately as interpretive context and must not
be treated as biography.

Return JSON:

```
{
  "hook": str (≤ 40 words),
  "evidence": [3 × {"fact": str, "trait": str}],
  "card_in_life": str (120–180 words, name-specific, no generic filler),
  "faq": [3 × {"q": str, "a": str}],
  "meta_description": str (≤ 155 chars)
}
```

## Local dry-run (fixtures, no spend)

```bash
python3 -m enrich.make_batch \
  --people pipeline/data/fixtures/people.jsonl \
  --meanings pipeline/data/card_meanings.json \
  --out /tmp/vertex_batch.jsonl
```

Default `--people` is `pipeline/data/people.jsonl` (gitignored). If that file
is missing, pass the fixture path as above. Do not invent celebrity bios to
fill it.

## What is not here

- No `gcloud`, Vertex SDK, or API key usage
- No batch submit / poll / download
- No checkout, Stripe, webhook, or `generate_reading` changes
