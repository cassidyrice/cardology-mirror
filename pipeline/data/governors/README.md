# Current US governors birth-card dataset

Committed harvest for the isolated `/governors` SEO scaffold. Sitting
governors of the 50 states only (no DC or territories). Dates are never
invented.

## Rebuild

```bash
python3 -m pipeline.governors
```

Sitting identity comes from
[List of current United States governors](https://en.wikipedia.org/wiki/List_of_current_United_States_governors).
Birth dates are the list's `{{birth date and age}}` day and must match
Wikidata `P569` at precision 11 (Gregorian preferred). Wikipedia REST
summaries supply `source_text` only. Birth cards are `pipeline.birthcard`
(December 31 = Joker). Year unused.

Wikidata `P6` (head of government) is **not** the sitting source. It can
lag inaugurations. Catalog Q-ids are identifiers only.

No Vertex batch. Page copy is local/template in `seo-pages/src/governors/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified sitting governor |
| `provenance.json` | Kept/excluded counts and conflict footnotes |

## Held

Kelly Armstrong (North Dakota) is sitting but held: the Wikipedia list
says 1976-10-06; the article infobox and Wikidata P569 say 1976-10-08.
Dropped, not guessed.
