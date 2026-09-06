# Wave Vertex enrich — slice 1 of ~2.54

Boss-approved first hub-sized slice. **1079 / 2745** missing wave people.
Same #70 / hub contract. This-job band ≤ ~$20.

| Field | Value |
|---|---|
| Missing wave people | 2745 (matches PR #100 inventory) |
| This slice | **1079** unique QIDs |
| Already in `people_enriched` | 2133 — skipped, zero overlap |
| Held for later slices | 1666 |
| Taken packs | Rock Hall **721** + summer olympics **358** |
| Dropped no `source_text` | 0 |
| HIGH-upper | **$16.95** |
| LOW | **$9.18** |
| no_thinking floor | **$4.00** |
| Go/no-go | **GO** (`within_target: true`) |

Largest-hole order used: Rock Hall, summer olympics, NFL HoF, Tonys, Kennedy Center, astronauts, …. Slice fills Rock Hall then part of summer olympics and stops at 1079. NFL HoF / Tonys / KC / astronauts and the rest wait for slice 2+.

## Submitted

| Field | Value |
|---|---|
| **Job id** | `projects/796629394796/locations/global/batchPredictionJobs/5428091131676065792` |
| **Numeric id** | `5428091131676065792` |
| **Display name** | `cardology-wp3-enrich-20260906T225419Z` |
| **State after ~90s poll** | `JOB_STATE_RUNNING` (PENDING → QUEUED → RUNNING) |
| **Model** | `gemini-3.1-pro-preview` |
| **Location** | `global` |
| **Rows** | **1079 / 1079** |

## Results (do not merge)

| Field | Value |
|---|---|
| **State** | `JOB_STATE_SUCCEEDED` |
| Vertex successfulCount | **1077** |
| Vertex failedCount | **2** (TPU `CANCELLED` empty predictions) |
| Accepted (near-verbatim) | **1077** |
| Rejected | **2** — Herb Reed `Q3133396`, Marie-José Pérec `Q228808` |
| Containment rejects | **0** |
| `people_enriched` after | **3210** (2133 kept + 1077) |
| Usage (1077 rows) | prompt 770637 / candidates 639777 / thoughts 1167490 |
| Spend if thoughts billed as output | **$11.61** (inside #101 HIGH upper $16.95 / ≤~$20 band) |

```bash
python3 -m enrich.parse_results \
  --people enrich/artifacts/wave_slice1_people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/wave_slice1_people.jsonl \
  --retry enrich/artifacts/wave_slice1_retry.jsonl
```

Ask before slice 2. Do not merge results, deploy, resubmit, or invent bios.
