# US presidents birth-card dataset

Committed harvest for the isolated `/presidents` SEO scaffold. 45 people / 47
presidencies (Cleveland 22+24, Trump 45+47). Do not invent extra people or dates.

## Rebuild

```bash
python3 -m pipeline.presidents
```

Primary identifiers come from Wikidata SPARQL (`P39=Q11696`, `P31=Q5`, `P569`)
when `query.wikidata.org` is up. If SPARQL times out, harvest falls back to the
known Q-id / enwiki title lists in `pipeline/presidents/qids.py` and
`wbgetentities`. Birth dates always come from P569 at day precision. Gregorian
calendar claims are preferred over Julian so public New Style month/days match
the Wikipedia home-state list.

Secondary month/day cross-check:
[List of presidents of the United States by home state](https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States_by_home_state).

`source_text` is the Wikipedia REST page summary only. Birth cards are
`pipeline.birthcard` (December 31 = Joker). Year is unused.

No Vertex batch. Page copy is local/template in `seo-pages/src/presidents/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per person |
| `provenance.json` | SPARQL vs fallback, cross-check counts, exclusions |
