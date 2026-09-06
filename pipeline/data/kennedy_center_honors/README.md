# Kennedy Center Honors birth-card dataset

Committed harvest for the isolated `/kennedy-center-honors` SEO scaffold.
One page per verified person-scope recipient or listed group/collective
member. Dates are never invented.

## Rebuild

```bash
python3 -m pipeline.kennedy_center_honors
```

Honoree identity comes from the Wikipedia
[Kennedy Center Honors](https://en.wikipedia.org/wiki/Kennedy_Center_Honors)
roster, which cites Kennedy Center honors pages. Groups and collectives
expand only Wikipedia-listed members. Institutions without listed people
(Apollo Theater) and rescinded awards (Bill Cosby) are omitted. Birth
dates must be day-precision on the Wikipedia person-page infobox **and**
Wikidata `P569` (precision 11, Gregorian preferred), and the two days
must match. Wikipedia REST summaries supply `source_text` only. Birth
cards are `pipeline.birthcard` (December 31 = Joker). Year unused. The
celebrity `year_before_1900` cut is not applied.

Kennedy Center artist-bio HTML is fetched when Wikipedia cites a
`kennedy-center.org/artists/` URL. A published day that conflicts with
Wikipedia/Wikidata is dropped. Missing, 404, and challenge pages are
recorded as unavailable — dates are not invented from them.

Person-scope only. No Vertex batch. Page copy is local/template in
`seo-pages/src/kennedy-center-honors/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified person |
| `provenance.json` | Kept/excluded counts, group expand-or-drop reports |

## Held

Dropped, not guessed:

- Institution: Apollo Theater (2024)
- Rescinded: Bill Cosby (1998)
- Wikipedia↔Wikidata day conflict: Marian Anderson, Thomas Kail
- No Wikipedia infobox day: Arthur Rubinstein, Georg Solti, Morton Gould,
  Nathan Milstein, William Schuman

Hamilton still expands the listed creators who have a public day
(Lin-Manuel Miranda, Alex Lacamoire, Andy Blankenbuehler). Thomas Kail
is omitted from that group because the Wikipedia infobox day conflicts
with Wikidata P569.
