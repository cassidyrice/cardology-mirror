# Declaration signers birth-card dataset

Committed harvest for the isolated `/signers` SEO scaffold. Verified subset
only: 44 people with a known calendar day. Nine NARA year-only rows and three
contested days are catalogued, not published.

## Rebuild

```bash
python3 -m pipeline.signers
```

Primary dates come from the [NARA Signers Factsheet](https://www.archives.gov/founding-docs/signers-factsheet).
Wikipedia infoboxes and Bioguide corroborate. New Style is preferred when Old
Style is marked. Wikidata `P569` is fetched only as a precision=11 QA check —
it is never used to invent a day.

`source_text` is the Wikipedia REST page summary only. Birth cards are
`pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/signers/`.

## Held / excluded

| Status | People | Why |
|---|---|---|
| Year-only | Gwinnett, Hart, Morton, Smith, Stone, Taylor, Thornton, Walton, Wythe | NARA has only a circa year. Day unknown. |
| Contested | Hancock (OS/NS), Harrison V, Hewes | Named holds. No page. |

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified signer |
| `provenance.json` | Held list, year-only list, Wikidata QA counts |
