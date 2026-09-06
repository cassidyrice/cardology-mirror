# Current US senators birth-card dataset

Committed harvest for the isolated `/senators` SEO scaffold. Sitting
senators of the 50 states only (100 seats). Dates are never invented.

## Rebuild

```bash
python3 -m pipeline.senators
```

Sitting identity comes from
[unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators)
(Bioguide / congress.gov compiled current-member file), cross-checked
against
[List of current United States senators](https://en.wikipedia.org/wiki/List_of_current_United_States_senators).
Birth dates must be day-precision on the Wikipedia list **and** Bioguide
**and** Wikidata `P569` (precision 11, Gregorian preferred), and the three
days must match. Wikipedia REST summaries supply `source_text` only.
Birth cards are `pipeline.birthcard` (December 31 = Joker). Year unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/senators/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified sitting senator |
| `provenance.json` | Kept/excluded counts and conflict footnotes |

## Held

Katie Boyd Britt (Alabama) is sitting but held: Wikipedia list and
Bioguide record 1982-02-02; Wikidata P569 records 1982-02-03. Dropped,
not guessed.
