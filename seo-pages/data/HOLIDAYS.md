# US federal holiday birth cards (fixed dates only)

Isolated static pages at `/holidays` and `/holidays/{slug}`. They do not join
the Next.js app and must not be deployed from this folder.

## Dates (do not invent)

Primary: **5 U.S.C. § 6103(a)** as published by Cornell LII.

- https://www.law.cornell.edu/uscode/text/5/6103

Only holidays that name a calendar month and day are mapped:

| Holiday | Date | Birth card |
| --- | --- | --- |
| New Year’s Day | January 1 | King of Spades |
| Juneteenth National Independence Day | June 19 | Jack of Clubs |
| Independence Day | July 4 | Jack of Diamonds |
| Veterans Day | November 11 | 9 of Clubs |
| Christmas Day | December 25 | 6 of Hearts |

Cards are recomputed with `pipeline/birthcard.py` / `seo-pages/src/birthcard.ts`
(D1: December 31 → Joker). Year is unused. None of these five dates is
December 31.

## Dropped (not mapped)

Floating § 6103(a) holidays — no fixed month and day:

- Birthday of Martin Luther King, Jr., the third Monday in January
- Washington’s Birthday, the third Monday in February
- Memorial Day, the last Monday in May
- Labor Day, the first Monday in September
- Columbus Day, the second Monday in October
- Thanksgiving Day, the fourth Thursday in November

Also excluded:

- Inauguration Day — § 6103(c) only (January 20 of each fourth year after 1965,
  and only for listed DC-area duty posts)
- Weekend observed / in-lieu days under § 6103(b) and Executive Order 11582

## OPM (calendars only)

[OPM Federal Holidays](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/)
publishes year calendars that shift some fixed holidays onto Friday or Monday
when they fall on Saturday or Sunday (for example, Independence Day observed
Friday, July 3, 2026). Those observed dates are **not** used. This set maps
the statutory calendar day.

## CTA

`/checkout/deep-dive?utm_source=holidays&utm_content={slug}`  
Hub uses `utm_content=hub`. Link only — no Stripe, no checkout form, no Vertex.

## Rebuild JSONL

```bash
python3 -m pipeline.holidays
```
