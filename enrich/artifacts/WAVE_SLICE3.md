# Wave Vertex enrich — slice 3 remainder

Boss-approved after #104 (`deb4f66fcca69b70efe4ec34d43feddf57892907`).
**587 / 587** remaining wave people still missing from `people_enriched`
(4285 after slice 2). Same #70 / hub contract. This-job band ≤ ~$20.
Prior DROP empties/thin stay dropped.

| Field | Value |
|---|---|
| `people_enriched` after #104 | **4285** — skipped, zero overlap |
| Eligible remaining (prior DROPs held) | **587** |
| This slice | **587** unique QIDs (all remaining) |
| Held for later slices | 0 |
| Slice-1 TPU empties (not resubmitted) | Herb Reed `Q3133396`, Marie-José Pérec `Q228808` |
| Slice-2 thin/bad (not resubmitted) | LL Cool J `Q52440`, J. Mike Lounge `Q501697`, Joe Montana `Q348011`, Tímea Nagy `Q18778` |
| Dropped no `source_text` | 0 |
| HIGH-upper | **$9.22** |
| LOW | **$5.00** |
| no_thinking floor | **$2.18** |
| Go/no-go | **GO** (`within_target: true`) |

Largest-hole order after #104. Taken this job:

| Pack | Taken |
|---|---:|
| Emmys | 121 |
| Oscars | 93 |
| Senators | 94 |
| Pulitzer fiction | 83 |
| Grammys AOTY | 45 |
| remaining summer olympics | 42 |
| Time POTY | 40 |
| Winter olympics | 30 |
| House chairs | 29 |
| Cabinet | 10 |
| **Union** | **587** |

## Submitted

| Field | Value |
|---|---|
| **Job id** | `projects/796629394796/locations/global/batchPredictionJobs/8359512276629192704` |
| **Numeric id** | `8359512276629192704` |
| **Display name** | `cardology-wp3-enrich-20260907T021429Z` |
| **State after ~90s poll** | `JOB_STATE_QUEUED` (PENDING → QUEUED) |
| **Model** | `gemini-3.1-pro-preview` |
| **Location** | `global` |
| **Rows** | **587 / 587** |

## Results (do not merge)

| Field | Value |
|---|---|
| **State** | `JOB_STATE_SUCCEEDED` |
| Vertex successfulCount | **587** |
| Vertex failedCount | **0** |
| Accepted (near-verbatim) | **585** |
| Rejected | **2** — Jean Marsh `Q271448`, Éric Srecki `Q367686` |
| Containment rejects | **0** |
| `people_enriched` after | **4870** (4285 kept + 585) |
| Usage (587 rows) | prompt 425244 / candidates 351890 / thoughts 654811 |
| Spend if thoughts billed as output | **$6.47** (inside #105 HIGH upper $9.22 / ≤~$20 band) |

```bash
python3 -m enrich.parse_results \
  --people enrich/artifacts/wave_slice3_people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/wave_slice3_people.jsonl \
  --retry enrich/artifacts/wave_slice3_retry.jsonl
```

Ask before any more Vertex. Do not merge results, deploy, resubmit, or invent bios.
Prod HOLD.
