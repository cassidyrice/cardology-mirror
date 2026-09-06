# US House leadership + standing chair birth-card dataset

Committed harvest for the isolated `/house-chairs` SEO scaffold. Sitting
**house.gov/leadership** officers plus the **20 standing committee chairs**.
Select committees, campaign committees (NRCC / DCCC), and officers not on
the house.gov leadership roster are out of scope. Dates are never invented.

## Rebuild

```bash
python3 -m pipeline.house_chairs
```

Sitting identity comes from
[house.gov/leadership](https://www.house.gov/leadership) and
[unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators)
committee-membership-current.json (standing chairs only). Birth dates are
each person's Wikipedia infobox `{{birth date and age}}` day, the
congress-legislators / Bioguide compiled birthday, and Wikidata `P569` at
precision 11. All three must match. Wikipedia REST summaries supply
`source_text` only. Birth cards are `pipeline.birthcard` (December 31 =
Joker). Year unused.

house.gov does **not** publish dates of birth. It confirms who sits in
elected leadership. Year-only dates and Wikipedia↔Bioguide↔Wikidata day
conflicts are dropped, not guessed.

No Vertex batch. Page copy is local/template in `seo-pages/src/house-chairs/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified officer |
| `provenance.json` | Kept/excluded counts and conflict footnotes |

## Scope

Catalog is 30 unique people (10 leadership + 20 standing chairs). The
committed harvest may be smaller when a day conflicts. Intelligence,
CCP, and January 6 select committees are omitted. Campaign-committee
chairs are omitted.
