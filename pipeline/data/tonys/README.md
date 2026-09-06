# Tony Award leading-acting birth-card dataset

Committed harvest for the isolated `/tonys` SEO scaffold. One page per person
who won **Best Actor / Best Actress in a Play or Musical** (the four Leading
performance categories) and has a **day-precision** Wikidata `P569` claim.

Wikipedia person-page birth templates are a conflict check when they include a
day. Year-only Wikipedia dates, Wikidata precision &lt; 11, Wikipedia↔Wikidata
day conflicts, minors, and D3 description keywords are dropped. Dates are
never invented.

## Scope

In: Tony Award for Best Actor in a Play, Best Actress in a Play, Best Actor
in a Musical, Best Actress in a Musical (official names: Best Performance by
a Leading …). Play and musical. 1947 through the latest ceremony published on
the Wikipedia lists (2026 as of harvest).

Out: Featured Actor / Featured Actress (play and musical), direction, design,
and special Tonys. 1985 leading musical acting categories were not awarded.
There was no separate 2021 ceremony (74th listed as 2020).

This pack does **not** apply the celebrity `year_before_1900` cut.

## Rebuild

```bash
python3 -m pipeline.tonys
python3 -m pytest pipeline/tests/test_tonys.py
```

Primary catalog: Wikipedia Tony Award leading-acting category lists (winner
rows highlighted `#B0C4DE`), recording the Tony Awards
([tonyawards.com](https://www.tonyawards.com/)).
Verify: Wikidata `wbgetentities` `P569` (REST, no SPARQL), plus Wikipedia
person-page infobox templates when they publish a day. `source_text` is the
Wikipedia REST page summary only. Birth cards are `pipeline.birthcard`
(December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/tonys/`.
Do not deploy. Do not touch checkout/Stripe.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per kept person |
| `provenance.json` | Kept/excluded counts, reasons, and scope |
