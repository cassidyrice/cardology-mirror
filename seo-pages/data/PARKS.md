# US National Park birth cards

Isolated static pages at `/parks` and `/parks/{slug}` (hub + 63 parks = 64 pages). They do not join the Next.js app and must not be deployed from this folder.

## Dates (do not invent)

Primary: Wikipedia, [List of national parks of the United States](https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States), column **Date established as park**.

That column is the day the unit became a National Park — not the first monument, reservation, lakeshore, river, memorial, or authorization date.

Footnotes: NPS [Park Anniversaries](https://www.nps.gov/subjects/npscelebrates/park-anniversaries.htm). That table often lists the earlier first-unit date. Those dates are stored and cited; they are never mapped to a birth card.

Retrieved 2026-09-06. Rebuild JSONL with:

```bash
python3 seo-pages/scripts/write_parks_jsonl.py
```

## Scope

- 63 current National Parks, including American Samoa and the U.S. Virgin Islands. New River Gorge (December 27, 2020) is the newest.
- Birth card = month + day of the Wikipedia National Park date. Year unused.
- Formula: `pipeline/birthcard.py` / `seo-pages/src/birthcard.ts` (D1: Dec 31 → Joker). No park date is December 31.

## Required disclosures

- Shared-date cluster called out by Cass: **December 2, 1980 Alaska ANILCA** — Gates of the Arctic, Glacier Bay, Katmai, Kenai Fjords, Kobuk Valley, Lake Clark, Wrangell–St. Elias. Denali is not in this cluster (February 26, 1917).
- Also sharing a month and day: February 26 (Denali / Acadia / Grand Canyon / Grand Teton); October 31 (American Samoa / Death Valley / Joshua Tree); October 2 (North Cascades / Redwood); November 10 (Badlands / Theodore Roosevelt / Congaree); March 4 (Hot Springs / Kings Canyon); July 1 (Mammoth Cave / Haleakalā).

## First-unit dates flagged, not mapped

Examples: Death Valley and Joshua Tree use October 31, 1994 (not 1933 / 1936 monuments). Haleakalā uses July 1, 1961 (not 1916 Hawaii National Park). Gateway Arch uses February 22, 2018 (not the 1935 memorial). Hot Springs uses March 4, 1921 (not the 1832 reservation). Kings Canyon uses March 4, 1940 (not General Grant, 1890).

## CTA

`/checkout/deep-dive?utm_source=parks&utm_content={slug}`  
Hub uses `utm_content=hub`. Link only — no Stripe, no checkout form, no Vertex.

## Isolation

No imports from `app/`, `components/`, or checkout libraries. Do not run `wrangler pages deploy` from this folder.
