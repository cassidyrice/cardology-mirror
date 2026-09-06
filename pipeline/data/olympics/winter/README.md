# Winter Olympic medalist birth-card dataset

Committed harvest for the isolated `/olympics/winter` SEO scaffold. One page
per athlete on Wikipedia’s
[List of multiple Winter Olympic medalists](https://en.wikipedia.org/wiki/List_of_multiple_Winter_Olympic_medalists)
**primary table** (at least eight Winter Olympic medals) who also has a
**day-precision** Wikipedia infobox birth date **and** a matching Wikidata
`P569` claim at precision 11.

Year-only infobox dates, Wikidata year-only / missing day precision,
Wikipedia↔Wikidata day conflicts, minors, and D3 description keywords are
dropped. Dates are never invented. Wikipedia redirects (for example
Apolo Anton Ohno → Apolo Ohno) are followed. The celebrity
`year_before_1900` cut is **not** applied.

The secondary “most medals in one individual event” table on the same
Wikipedia page is **not** the catalog.

## Rebuild

```bash
python3 -m pipeline.olympics.winter
python3 -m pytest pipeline/tests/test_winter_olympics.py
```

Primary catalog: Wikipedia list (CC BY-SA 4.0). Verify: Wikipedia infobox
birth-date templates + Wikidata `wbgetentities` `P569` (REST, no SPARQL).
`source_text` is the Wikipedia REST page summary only. Birth cards are
`pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/olympics/winter/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept athlete |
| `provenance.json` | Kept/excluded counts and reasons |
