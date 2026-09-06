# Current US Cabinet birth-card dataset

Committed harvest for the isolated `/cabinet` SEO scaffold. Sitting
**Vice President + 15 executive-department heads** only (no Cabinet-level
EPA / OMB / DNI / CIA / USTR / SBA / Chief of Staff). Dates are never
invented.

## Rebuild

```bash
python3 -m pipeline.cabinet
```

Sitting identity comes from the
[White House cabinet page](https://www.whitehouse.gov/administration/the-cabinet/)
and Wikipedia’s
[Cabinet of the United States](https://en.wikipedia.org/wiki/Cabinet_of_the_United_States)
(VP + 15 secretaries). Birth dates are each officer’s Wikipedia infobox
`{{birth date and age}}` day and must match Wikidata `P569` at precision 11
(Gregorian preferred). Wikipedia REST summaries supply `source_text` only.
Birth cards are `pipeline.birthcard` (December 31 = Joker). Year unused.

White House bios do **not** publish dates of birth. They confirm who is
sitting. Year-only infoboxes and Wikipedia↔Wikidata day conflicts are
dropped, not guessed.

No Vertex batch. Page copy is local/template in `seo-pages/src/cabinet/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified sitting officer |
| `provenance.json` | Kept/excluded counts and conflict footnotes |

## Scope

Catalog is 16 offices. Acting department heads who appear on the White
House cabinet page are in scope and labeled acting. Cabinet-rank officials
outside the 15 departments are out of scope.
