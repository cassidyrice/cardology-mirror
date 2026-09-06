# Celebrity blog profile citations

Grounding pack for **existing** `/blog/{name}-birth-card-profile` pages on
cardology-mirror. This is not a new URL prefix and does **not** activate a
path-split onto `/birth-card/{person-slug}`.

Public dates of birth are cited from Wikidata `P569` (CC0, day precision,
Gregorian preferred) and the matching English Wikipedia article. `source_text`
is the Wikipedia REST summary only. Evidence facts must be a near-verbatim
span of that summary. Dates are never invented. Minors and D3 keywords are
dropped. Wikipedia↔Wikidata day conflicts — including multiple P569 days —
are flagged and not cited.

```bash
python3 -m pipeline.celebs
python3 -m pipeline.celebs --apply
python3 -m pytest pipeline/tests/test_celeb_blog_citations.py
```

CTA links on the blog posts stay as published (link-only). No Stripe. No
deploy.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified profile |
| `provenance.json` | Kept/excluded counts and conflict flags |
