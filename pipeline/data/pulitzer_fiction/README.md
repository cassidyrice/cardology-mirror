# Pulitzer Prize for Fiction birth-card dataset

Committed harvest for the isolated `/pulitzer/fiction` SEO scaffold. One page
per verified person-scope winner or joint recipient. Dates are never invented.

## Rebuild

```bash
python3 -m pipeline.pulitzer_fiction
```

Winner identity comes from the Wikipedia
[Pulitzer Prize for Fiction](https://en.wikipedia.org/wiki/Pulitzer_Prize_for_Fiction)
list, which cites Pulitzer.org year pages. Yellow winner rows only. Finalists
and “Not awarded” years are omitted. Co-winners (2023) are kept as separate
people. Birth dates must be day-precision on the Wikipedia person-page infobox
**and** Wikidata `P569` (precision 11, Gregorian preferred), and the two days
must match. Wikipedia REST summaries supply `source_text` only. Birth cards
are `pipeline.birthcard` (December 31 = Joker). Year unused. The celebrity
`year_before_1900` cut is not applied.

Pulitzer.org live HTML is fetched when Cloudflare allows it. A published
day that conflicts with Wikipedia/Wikidata is dropped. Challenge/403 pages
are recorded as unavailable — dates are not invented from them.

Person-scope only. Institutions are omitted. No Vertex batch. Page copy is
local/template in `seo-pages/src/pulitzer-fiction/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified person |
| `provenance.json` | Kept/excluded counts, not-awarded years, conflict footnotes |

## Held

Hernan Diaz (2023 joint recipient), Anthony Doerr, and Paul Harding have
year-only Wikipedia infobox dates. Andrew Sean Greer’s Wikipedia day
conflicts with Wikidata P569. Peter Taylor and Robert Lewis Taylor have
no infobox day. Dropped, not guessed.
