# Born-on notable-people grounding

Authority upgrade for the live Worker `/born-on/{month-day}` pages. This is
**not** a new niche and **not** a `/birthday` or `/notables` path.

People come from the verified celebrity `pipeline/data/people.jsonl` catalog
(Wikidata `P569` day precision already applied). Dates are never invented.
Year-only rows, conflicts, minors, and D3 description keywords stay dropped.

## Rebuild

```bash
python3 -m pipeline.born_on
python3 -m pytest pipeline/tests/test_born_on.py
```

Birth cards are `pipeline.birthcard` (December 31 = Joker). Year unused.
Wikipedia REST summaries are `source_text` only — never a date source.

No Vertex batch. Page copy is local/template in `seo-pages/src/born-on/`.
Do not deploy. Path-split is not activated.

## Files

| File | Role |
|---|---|
| `people.jsonl` | Kept notables with day-precision public DOBs |
| `days.jsonl` | All 366 calendar days (empty days included) |
| `provenance.json` | Kept/excluded counts and empty-day list |

## Pages

- Hub: `/born-on`
- Day: `/born-on/{month}-{day}` (`january-15`, `february-29`, `december-31`)
- CTA: `/checkout/deep-dive?utm_source=born-on&utm_content={slug}`
