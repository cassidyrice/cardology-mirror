# WP3 enrich (Vertex / Gemini batch)

Builds a Vertex-ready JSONL from `pipeline/data/people.jsonl` +
`pipeline/data/card_meanings.json`, submits a Gemini batch job **only when
real GCP credentials are present**, then joins predictions into
`people_enriched.jsonl`.

This folder does **not** invent celebrity bios. Evidence facts that are not
contained in `<source_text>` (fuzzy ≥ 0.85) are rejected onto a retry list.

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

## Commands

```bash
# 1. Vertex-ready JSONL (no spend)
python3 -m enrich.make_batch \
  --people pipeline/data/people.jsonl \
  --meanings pipeline/data/card_meanings.json \
  --out enrich/artifacts/vertex_batch.jsonl

python3 -m enrich.estimate \
  --input enrich/artifacts/vertex_batch.jsonl \
  --out enrich/artifacts/cost_estimate.json

# 2. Submit (refuses to invent credentials)
python3 -m enrich.submit_batch --input enrich/artifacts/vertex_batch.jsonl

# 3. Poll (Vertex SLA: most jobs finish ≤24h after they start running)
python3 -m enrich.submit_batch --poll

# 4. Join + containment gate
# Download predictions to enrich/out/predictions.jsonl first.
python3 -m enrich.parse_results \
  --people pipeline/data/people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --out pipeline/data/people_enriched.jsonl \
  --retry enrich/artifacts/retry.jsonl \
  --report enrich/artifacts/exclusion_report.json
```

Local dry-run against fixtures (no spend):

```bash
python3 -m enrich.make_batch \
  --people pipeline/data/fixtures/people.jsonl \
  --meanings pipeline/data/card_meanings.json \
  --out /tmp/vertex_batch.jsonl
```

## Model

Prefer **Gemini 3.1 Pro** Flex/Batch: `gemini-3.1-pro-preview`
(`publishers/google/models/gemini-3.1-pro-preview`). The repo has no older
documented default; override with `VERTEX_MODEL` only if that ID is unavailable
on the project.

Official Flex/Batch rates (≤200K tokens/request): **$1.00 / 1M input**,
**$6.00 / 1M output**. See `enrich/artifacts/cost_estimate.json`.

## Auth (required for submit)

Submit reads only what is already in the environment. It will not invent a
project, bucket, or key.

| Need | Env / file |
|---|---|
| GCP project | `VERTEX_PROJECT` or `GOOGLE_CLOUD_PROJECT` |
| GCS bucket | `VERTEX_GCS_BUCKET` |
| SA JSON **or** ADC | `GOOGLE_APPLICATION_CREDENTIALS` or `~/.config/gcloud/application_default_credentials.json` |
| Location | `VERTEX_LOCATION` (default `global`) |
| Model | `VERTEX_MODEL` (default `gemini-3.1-pro-preview`) |

Service account roles: `roles/aiplatform.user` plus object admin on the bucket.
Optional packages for token minting: `pip install -r enrich/requirements-vertex.txt`.

If any of those are missing, `python3 -m enrich.submit_batch` exits 2, writes
`enrich/artifacts/submit_status.json` with `"submitted": false`, and prints
exactly what Cass must connect.

## Artifacts

| Path | Tracked? |
|---|---|
| `enrich/artifacts/vertex_batch.jsonl` | yes — request file |
| `enrich/artifacts/cost_estimate.json` | yes |
| `enrich/artifacts/submit_status.json` | yes — job id / auth blocker |
| `enrich/artifacts/exclusion_report.json` | yes after parse |
| `enrich/artifacts/retry.jsonl` | yes after parse |
| `enrich/out/predictions.jsonl` | gitignored Vertex download |
| `pipeline/data/people_enriched.jsonl` | gitignored join output |

## What this does not do

- No deploy
- No checkout, Stripe, webhook, or `generate_reading` changes
- No invented bios outside `source_text`
- No remapping of D1 December 31 Joker
