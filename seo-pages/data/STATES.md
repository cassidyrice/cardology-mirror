# US states admission birth cards

Isolated static pages at `/states` and `/states/{slug}`. They do not join the Next.js app and must not be deployed from this folder.

## Dates (do not invent)

Primary: CRS report **R47747** Table 1, “Chronological List of State Admissions.”

- HTML: https://www.congress.gov/crs-product/R47747
- PDF used for this drop: https://www.congress.gov/crs_external_products/R/PDF/R47747/R47747.16.pdf

CRS Table 1 note: admission date for the 13 original states is the date each ratified the U.S. Constitution. For later states, the date is when admission became effective.

Secondary: Wikipedia, [List of U.S. states by date of admission to the Union](https://en.wikipedia.org/wiki/List_of_U.S._states_by_date_of_admission_to_the_Union). All 50 dates match Table 1.

Optional Wikidata P571 check (REST `wbgetentities`, no SPARQL): every state QID used in `states.jsonl` has a day-precision P571 equal to the CRS date.

- New Jersey (`Q1408`) also lists `1776-07-04`.
- New Mexico (`Q1522`) also lists `1850-09-09` and month-precision `1598-07`.
- Extra P571 values are recorded and unused.

Vermont’s QID is `Q16551` (enwiki sitelink). Do not use `Q1395`.

## Scope

- 50 states. District of Columbia and territories are excluded.
- Birth card = month + day of the Table 1 date. Year unused.
- Formula: `pipeline/birthcard.py` / `seo-pages/src/birthcard.ts` (D1: Dec 31 → Joker). No state date is December 31.

## Required disclosures

- Original 13 use Constitution ratification dates.
- Shared month-and-day coordinates called out by Cass: Kentucky / Tennessee (June 1); Oregon / Arizona (February 14).
- Also sharing a month and day on Table 1: North Dakota / South Dakota (November 2, 1889); Rhode Island / Wisconsin (May 29); Ohio / Nebraska (March 1).

## Disputed date flagged

**Ohio.** Wikipedia notes Congress did not set a formal statehood date until 1953 (Pub. L. 83–204), which designated March 1, 1803. CRS Table 1 uses March 1, 1803. This dataset maps that CRS date and flags the dispute on the hub and Ohio page.

## CTA

`/checkout/deep-dive?utm_source=states&utm_content={slug}`  
Hub uses `utm_content=hub`. Link only — no Stripe, no checkout form, no Vertex.

## Rebuild JSONL

```bash
python3 seo-pages/scripts/write_states_jsonl.py
```
