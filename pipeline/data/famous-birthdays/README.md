# Birth-card Famous people grounding

Authority upgrade for the existing Famous people block on
`/birth-card/{rank}-of-{suit}` (52 cards) and `/birth-card/joker`.

Not a new path. Not an isolated SEO scaffold. Do not deploy from this
folder.

## Rule

Keep a listed notable only when:

- the editorial birthday is a real `YYYY-MM-DD`
- Wikidata `P569` is day-precision (11, Gregorian preferred)
- the two days match
- that day maps to the page card (`pipeline.birthcard`, Dec 31 = Joker)
- the person is 18+
- Wikidata / known-for text is not a D3 keyword (serial killer / murderer / terrorist / dictator)

Year-only dates, conflicts, missing QIDs, card mismatches, minors, and D3
rows are dropped. Dates are never invented. The celebrity
`year_before_1900` cut is **not** applied — historical figures stay if
the day is public and matching.

## Rebuild

```bash
python3 -m pipeline.famous_birthdays
python3 -m pytest pipeline/tests/test_famous_birthdays.py
```

Writes [`../../../lib/famous-birthdays.json`](../../../lib/famous-birthdays.json)
and [`provenance.json`](provenance.json). Pages stay on the Next.js
birth-card routes. No Stripe. No path-split.
