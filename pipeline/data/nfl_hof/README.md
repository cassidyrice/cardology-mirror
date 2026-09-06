# NFL Hall of Fame birth-card dataset

Committed harvest for the isolated `/nfl-hof` SEO scaffold. One page per
Pro Football Hall of Fame inductee who has a Wikidata **P6930** ID and a
**day-precision** Wikidata `P569` claim at precision 11.

Year-only Wikidata dates, Wikipedia or ProFootballHOF.com days that
conflict with P569, minors, D3 description keywords, missing Wikipedia
summaries, and thin extracts are dropped. Dates are never invented.

The celebrity `year_before_1900` cut is **not** applied.

## Rebuild

```bash
python3 -m pipeline.nfl_hof
python3 -m pytest pipeline/tests/test_nfl_hof.py
```

Primary catalog: Wikidata `P6930` (SPARQL, with CirrusSearch / Wikipedia
category fallback). Dates: Wikidata `wbgetentities` `P569`. Verify:
ProFootballHOF.com bios and Wikipedia infobox/lead days when they publish
a day. `source_text` is the Wikipedia REST page summary only. Birth cards
are `pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/nfl-hof/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts and reasons |
