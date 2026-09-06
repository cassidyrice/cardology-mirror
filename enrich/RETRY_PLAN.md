# Vertex enrich — remaining 18

`people_enriched.jsonl` has **1040** accepted qids. Do not re-run those.
This pass is the **18** leftover rows from #73 (`retry.jsonl`).

## Why 18

| Kind | Rows | Action |
|---|---|---|
| Vertex TPU `CANCELLED` empty prediction | 16 | Retry same contract (transient) |
| hook 41 words (max 40) — Cynthia Erivo | 1 | Real prompt buffer: hook ≤38 (hard 40) |
| `card_in_life` 119 words (need 120–180) — Jesse Plemons | 1 | Real prompt buffer: 125–175 (hard 120–180) |

Same #70 contract otherwise: near-verbatim `evidence.fact`, meta ≤145,
`temperature=0.0`, `thinkingLevel=LOW`. Validator hard limits unchanged.

## Rebuild

```bash
python3 -m enrich.make_retry_batch
python3 -m enrich.estimate \
  --input enrich/artifacts/vertex_retry_batch.jsonl \
  --out enrich/artifacts/cost_estimate.json
```

## Cost (same model, Flex/Batch rates — #70 method)

See `enrich/artifacts/cost_estimate.json` (18 requests).

| Band | 18 remainder |
|---|---|
| Output JSON only (theoretical) | **$0.07** |
| thinkingLevel=LOW (this JSONL) | **~$0.15** |
| HIGH upper (2500 thought tokens/row) | **$0.28** |

HIGH upper is **inside the ~$16 target**.

Hub people packs (presidents / governors / SCOTUS / Nobel / signers) have
Wikipedia `source_text` but each README says no Vertex / local templates.
Combined HIGH upper is **$17.02** (`hub_pack_estimate.json`) — over the
band, held for APPROVE. Date-only hubs (holidays / parks / MLB / NFL /
states) are not Vertex people enrich.

## After SUCCEEDED

1. Download `enrich/out/predictions.jsonl`.
2. Parse with near-verbatim containment.
3. Append accepted rows to `pipeline/data/people_enriched.jsonl`.
   Do not overwrite the 1040 already accepted.

## Out of scope

- No deploy, checkout, Stripe, webhook, or `generate_reading` edits
- No D1 Joker remapping
- Hub people packs not submitted (over $16 HIGH upper + pack No-Vertex policy)
