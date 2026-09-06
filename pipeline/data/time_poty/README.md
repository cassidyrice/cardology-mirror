# TIME Person of the Year birth-card dataset

Committed harvest for the isolated `/time-person-of-the-year` SEO scaffold.
One page per verified named human. Dates are never invented. TIME vault
is context only and is never fetched as a date source.

## Rebuild

```bash
python3 -m pipeline.time_poty
```

Honoree identity comes from the Wikipedia
[Time Person of the Year](https://en.wikipedia.org/wiki/Time_Person_of_the_Year)
Person(s) of the Year table. Duals and joint years are split per person.
Abstractions, machines, and groups-as-concepts stay out — including
Notes-only cover spotlights that are not “Represented by” named humans.
Apollo 8 Lifetime `Name: YYYY` lines are kept as people.

Birth dates must be day-precision on the Wikipedia person-page infobox
**and** Wikidata `P569` (precision 11, Gregorian preferred), and the two
days must match. Wikipedia REST summaries supply `source_text` only.
Birth cards are `pipeline.birthcard` (December 31 = Joker). Year unused.
The celebrity `year_before_1900` cut is not applied.

Person-scope only. No Vertex batch. Page copy is local/template in
`seo-pages/src/time-poty/`.

## Files

| File | Role |
|---|---|
| `people.jsonl` | One row per verified named human |
| `provenance.json` | Kept/excluded counts, concept years, conflict footnotes |

## Held (2026-09-06 harvest)

Catalog: 82 named humans + 16 concept years. Kept: 74. Dates never invented.

**D3:** Adolf Hitler (Wikidata description contains “dictator”).

**Wikipedia↔Wikidata day conflict:** Ruhollah Khomeini (infobox 1900-05-17 ≠ P569 1902-09-24).

**No day-precision Wikipedia infobox:** Cynthia Cooper (accountant), Harlow Curtice,
Joseph Stalin (contested / year-only public record — not guessed), Nikita Khrushchev,
Yasser Arafat, Yuri Andropov.

**Concept years (no person pages, Notes spotlights not expanded):**
1950 Fighting-Man, 1956 Hungarian freedom fighter, 1960 U.S. Scientists,
1966 Inheritor, 1969 Middle Americans, 1975 American women, 1982 Computer,
1988 Endangered Earth, 2003 American soldier, 2006 You, 2011 Protester,
2014 Ebola fighters, 2017 Silence Breakers, 2018 Guardians,
2022 Spirit of Ukraine (Zelenskyy kept as the person-row), 2025 Architects of AI.

Dropped, not guessed.
