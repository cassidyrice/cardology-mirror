# Wave Vertex enrich — slice 2 of remaining missing

Boss-approved after #102 merge. **1079 / 1666** remaining wave people
still missing from `people_enriched` (3210 after slice 1). Same #70 /
hub contract. This-job band ≤ ~$20. TPU empties from slice 1 stay dropped.

| Field | Value |
|---|---|
| `people_enriched` after #102 | **3210** — skipped, zero overlap |
| Eligible remaining (TPU drops held) | **1666** |
| This slice | **1079** unique QIDs |
| Held for later slices | 587 |
| Slice-1 TPU empties (not resubmitted) | Herb Reed `Q3133396`, Marie-José Pérec `Q228808` |
| Dropped no `source_text` | 0 |
| HIGH-upper | **$16.96** |
| LOW | **$9.19** |
| no_thinking floor | **$4.01** |
| Go/no-go | **GO** (`within_target: true`) |

Largest-hole order after #102: NFL HoF, Tonys, astronauts, Kennedy Center,
remaining summer olympics, …. Taken this job:

| Pack | Taken |
|---|---:|
| NFL HoF | 307 |
| Tonys | 245 |
| astronauts | 220 |
| Kennedy Center Honors | 168 |
| remaining summer olympics | 139 |
| **Union** | **1079** |

## Submitted

| Field | Value |
|---|---|
| **Job id** | `projects/796629394796/locations/global/batchPredictionJobs/4697945042088624128` |
| **Numeric id** | `4697945042088624128` |
| **Display name** | `cardology-wp3-enrich-20260906T232142Z` |
| **State after ~90s poll** | `JOB_STATE_QUEUED` (PENDING → QUEUED) |
| **Model** | `gemini-3.1-pro-preview` |
| **Location** | `global` |
| **Rows** | **1079 / 1079** |

## Results (do not merge)

| Field | Value |
|---|---|
| **State** | `JOB_STATE_SUCCEEDED` |
| Vertex successfulCount | **1079** |
| Vertex failedCount | **0** |
| Accepted (near-verbatim) | **1075** |
| Rejected | **4** — LL Cool J `Q52440`, J. Mike Lounge `Q501697`, Joe Montana `Q348011`, Tímea Nagy `Q18778` |
| Containment rejects | **0** |
| `people_enriched` after | **4285** (3210 kept + 1075) |
| Usage (1079 rows) | prompt 780193 / candidates 637953 / thoughts 1176092 |
| Spend if thoughts billed as output | **$11.66** (inside #103 HIGH upper $16.96 / ≤~$20 band) |

```bash
python3 -m enrich.parse_results \
  --people enrich/artifacts/wave_slice2_people.jsonl \
  --predictions enrich/out/predictions.jsonl \
  --append \
  --retry-scope enrich/artifacts/wave_slice2_people.jsonl \
  --retry enrich/artifacts/wave_slice2_retry.jsonl
```

Ask before slice 3. Do not merge results, deploy, resubmit, or invent bios.
