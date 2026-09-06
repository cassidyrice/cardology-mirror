# Summer Olympic multi-gold birth-card dataset

Committed harvest for the isolated `/olympics/summer` SEO scaffold. One page
per person who has **at least two Summer Olympic gold medals** on Wikidata
(`P1344` event + `P166` Olympic gold, event `P361+` a Summer Games) **and** a
matching day-precision Wikipedia infobox date and Wikidata `P569` (precision 11).

Winter-only careers, Youth Games, year-only Wikipedia infoboxes, Wikidata
year-only / missing day precision, Wikipedia↔Wikidata day conflicts, minors,
and D3 description keywords are dropped. Dates are never invented.

This pack does **not** apply the celebrity `year_before_1900` cut — early
modern Olympians stay in scope when the day is public.

The queue note of ~501 pages was an estimate. Kept count is whatever survives
the public-date rules. No rows are invented to hit a target.

## Rebuild

```bash
python3 -m pipeline.olympics
python3 -m pytest pipeline/tests/test_olympics.py
```

Primary catalog: Wikidata SPARQL (2+ Summer golds), falling back to Wikipedia
[List of multiple Olympic gold medalists](https://en.wikipedia.org/wiki/List_of_multiple_Olympic_gold_medalists)
and
[List of multiple Olympic gold medalists at the Summer Olympics](https://en.wikipedia.org/wiki/List_of_multiple_Olympic_gold_medalists_at_the_Summer_Olympics).
Verify: Wikipedia infobox `{{birth date}}` / `{{birth date and age}}` must
equal Wikidata `P569`. `source_text` is the Wikipedia REST page summary only.
Birth cards are `pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/olympics/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts and reasons |
