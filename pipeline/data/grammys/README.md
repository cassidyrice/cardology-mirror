# Grammy Album of the Year birth-card dataset

Committed harvest for the isolated `/grammys/aoty` SEO scaffold. One page per
verified primary billed winner or expanded band member. Dates are never
invented.

## Rebuild

```bash
python3 -m pipeline.grammys
```

Winner identity comes from the Wikipedia
[Grammy Award for Album of the Year](https://en.wikipedia.org/wiki/Grammy_Award_for_Album_of_the_Year)
list, which cites Grammy.com / Recording Academy pages. Only the Artist(s)
column is primary billed. Production-team credits and featured-friend
`<small>` lists are ignored. Birth dates must be day-precision on the
Wikipedia person-page infobox **and** Wikidata `P569` (precision 11,
Gregorian preferred), and the two days must match. Wikipedia REST summaries
supply `source_text` only. Birth cards are `pipeline.birthcard` (December 31
= Joker). Year unused. The celebrity `year_before_1900` cut is not applied.

Bands are omitted as entities. Members are expanded only when a public
day-precision DOB exists (Wikidata P527, or the band Wikipedia caption /
current-members list when P527 is empty). Past-member history lists are not
used. Various-artists soundtracks are omitted.

No Vertex batch. Page copy is local/template in `seo-pages/src/grammys/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified person |
| `provenance.json` | Kept/excluded counts, band expand/omit, conflict footnotes |

## Held

Daft Punk members have year-only Wikipedia infobox dates. Saturday Night
Fever (1979) and *O Brother, Where Art Thou?* (2002) are various-artists
soundtracks. Dropped, not guessed.
