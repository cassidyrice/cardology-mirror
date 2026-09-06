# Current SCOTUS justices birth-card dataset

Committed harvest for the isolated `/scotus` SEO scaffold. One page per
**sitting** justice who has a **day-precision** public date of birth on
[SCOTUS.gov Current Members](https://www.supremecourt.gov/about/biographies.aspx)
**and** a matching Wikidata `P569` claim at precision 11.

Retired justices, year-only dates, Wikidata year-only / missing day
precision, SCOTUS.gov↔Wikidata day conflicts, minors, and D3 description
keywords are dropped. Dates are never invented.

This pack does **not** apply the celebrity `year_before_1900` cut.

## Rebuild

```bash
python3 -m pipeline.scotus
python3 -m pytest pipeline/tests/test_scotus.py
```

Primary catalog: SCOTUS.gov biographies (`Current Members` only).
Verify: Wikidata `wbgetentities` `P569` (REST, no SPARQL). `source_text` is the
Wikipedia REST page summary only. Birth cards are `pipeline.birthcard`
(December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/scotus/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept sitting justice |
| `provenance.json` | Kept/excluded counts and reasons |
