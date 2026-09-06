# Academy Award Best Actor / Best Actress birth-card dataset

Committed harvest for the isolated `/oscars` SEO scaffold. Unique Best
Actor and Best Actress winners only. Dates are never invented.

## Rebuild

```bash
python3 -m pipeline.oscars
```

Winner identity comes from the Wikipedia
[Best Actor](https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actor)
and
[Best Actress](https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actress)
lists, which cite Oscars.org ceremony pages. Birth dates must be
day-precision on the Wikipedia person-page infobox **and** Wikidata
`P569` (precision 11, Gregorian preferred), and the two days must match.
Wikipedia REST summaries supply `source_text` only. Birth cards are
`pipeline.birthcard` (December 31 = Joker). Year unused. The celebrity
`year_before_1900` cut is not applied.

Supporting acting categories, year-only infobox dates, Wikipedia↔Wikidata
conflicts, minors, and D3 description keywords are dropped.

No Vertex batch. Page copy is local/template in `seo-pages/src/oscars/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified unique winner |
| `provenance.json` | Kept/excluded counts and conflict footnotes |

## Held

Joan Crawford is listed but held: no day-precision Wikipedia infobox
birth date. Norma Shearer is listed but held: Wikipedia infobox
1902-08-11 conflicts with Wikidata P569 1902-08-10. Dropped, not guessed.
