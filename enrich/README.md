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
| `5428091131676065792` (wave slice 1) | SUCCEEDED | **1077** this run / **3210** total | **2** |
| `4697945042088624128` (wave slice 2) | SUCCEEDED | **1075** this run / **4285** total | **4** |
| `8359512276629192704` (wave slice 3 remainder) | SUCCEEDED | **585** this run / **4870** total | **2** |

Celebrity remainder is complete (1058/1058); `retry.jsonl` stays empty.
Hub people packs accepted **1075 / 1079**. Wave slice 1 (Rock Hall 721 +
summer olympics 358) accepted **1077 / 1079**. Dropped 2 TPU `CANCELLED`
empty predictions: Herb Reed, Marie-José Pérec. Zero containment rejects.
Slice 2 (NFL HoF 307 + Tonys 245 + astronauts 220 + Kennedy Center
168 + remaining summer olympics 139) accepted **1075 / 1079**. Dropped 4
word-count / JSON rejects: LL Cool J, J. Mike Lounge, Joe Montana,
Tímea Nagy. Slice 3 remainder (Emmys 121 + Oscars 93 + Senators 94 +
Pulitzer fiction 83 + Grammys AOTY 45 + remaining summer olympics 42 +
Time POTY 40 + Winter olympics 30 + House chairs 29 + Cabinet 10)
accepted **585 / 587**. Dropped 2 word-count rejects: Jean Marsh,
Éric Srecki. Zero containment rejects. Wave remainder is complete.
Prior DROPs stay dropped. Ask before any more Vertex.

```bash
python3 -m enrich.parse_results \
  --people enrich/artifacts/wave_slice3_people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/wave_slice3_people.jsonl \
  --retry enrich/artifacts/wave_slice3_retry.jsonl
```

See `enrich/RETRY_PLAN.md` and `enrich/artifacts/WAVE_SLICE3.md`.
Ask before any more Vertex. Do not merge results without asking.

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
