# NASA astronaut birth-card dataset

Committed harvest for the isolated `/astronauts` SEO scaffold. One page per
person on NASA’s public flown / selected corps list who has a **day-precision**
date of birth on a NASA astronaut biography **and** a matching Wikidata
`P569` claim at precision 11.

Year-only NASA dates, Wikidata year-only / missing day precision,
NASA↔Wikidata day conflicts, minors, and D3 description keywords are
dropped. Dates are never invented.

The celebrity `year_before_1900` cut is **not** applied.

## Rebuild

```bash
python3 -m pipeline.astronauts
python3 -m pytest pipeline/tests/test_astronauts.py
```

Primary catalog: [NASA Astronaut Fact Book](https://www.nasa.gov/reference/astronaut-fact-book/)
list of U.S. astronauts, plus Group 24 from the
[astronaut candidates](https://www.nasa.gov/humans-in-space/astronauts/astronaut-candidates/)
page when missing from the table. Dates: NASA biography pages (HTML, then
linked PDF bios). Verify: Wikidata `wbgetentities` `P569` (REST, no SPARQL).
`source_text` is the Wikipedia REST page summary only. Birth cards are
`pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/astronauts/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts and reasons |
