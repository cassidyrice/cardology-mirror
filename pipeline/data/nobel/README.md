# Nobel laureate birth-card dataset

Committed harvest for the isolated `/nobel` SEO scaffold. One page per person
who has a **day-precision** public date of birth in Nobel Prize API v2.1 **and**
a matching Wikidata `P569` claim at precision 11.

Organizations, year-only Nobel dates (`YYYY-00-00`), Wikidata year-only /
missing day precision, Nobel↔Wikidata day conflicts, minors, and D3
description keywords are dropped. Dates are never invented.

This pack does **not** apply the celebrity `year_before_1900` cut — Curie
(1867) and Einstein (1879) are in scope.

## Rebuild

```bash
python3 -m pipeline.nobel
python3 -m pytest pipeline/tests/test_nobel.py
```

Primary catalog: [Nobel Prize API v2.1 laureates](https://api.nobelprize.org/2.1/laureates).
Verify: Wikidata `wbgetentities` `P569` (REST, no SPARQL). `source_text` is the
Wikipedia REST page summary only. Birth cards are `pipeline.birthcard`
(December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/nobel/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts and reasons |
