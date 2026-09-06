# Primetime Emmy Lead Actor / Actress birth-card dataset

Committed harvest for the isolated `/emmys` SEO scaffold. One page per person
who won a **Primetime Emmy Lead Actor or Lead Actress** award on the drama or
comedy Wikipedia lineage lists **and** has a day-precision Wikipedia
infobox/lead birth date that matches Wikidata `P569` (precision 11).

## Scope

**In**

- Outstanding Lead Actor in a Drama Series
- Outstanding Lead Actress in a Drama Series
- Outstanding Lead Actor in a Comedy Series
- Outstanding Lead Actress in a Comedy Series

Pre-1966 Primetime acting categories were not genre-specific. Those wins
appear on both drama and comedy lineage pages and are kept once as
`pre_genre_split`. Wikipedia marks some historical Lead-category wins as
miniseries/TV film (`#`) or guest (`§`); those stay in the win record with a
note because they won Lead Actor/Actress that year.

**Out**

- Supporting Actor / Actress
- Limited or Anthology Series or Movie as its own category
- Guest Actor / Actress as its own category
- Daytime Emmys
- International Emmys
- News / Sports / Creative Arts

Year-only Wikipedia dates, Wikidata year-only / missing day precision,
Wikipedia↔Wikidata day conflicts, minors, and D3 description keywords are
dropped. Dates are never invented. The celebrity `year_before_1900` cut is
**not** applied.

## Rebuild

```bash
python3 -m pipeline.emmys
python3 -m pytest pipeline/tests/test_emmys.py
```

Primary catalog: Wikipedia Primetime Emmy Lead Actor/Actress drama + comedy
lists, compiling [Television Academy / emmys.com](https://www.emmys.com/)
results. Date verify: Wikipedia person infobox/lead templates + Wikidata
`wbgetentities` `P569` (REST, no SPARQL). `source_text` is the Wikipedia REST
page summary only. Birth cards are `pipeline.birthcard` (December 31 = Joker).
Year unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/emmys/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts and reasons |
