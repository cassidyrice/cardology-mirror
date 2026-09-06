# Celebrity birth-card dataset pipeline

Static/SEO only. Rebuilds `people.jsonl` from public Wikimedia APIs or from the
verified seed drop in `pipeline/data/seed/`. Does not touch checkout, Stripe,
webhooks, `generate_reading`, or any payment path.

## Birth-card rule (D1)

```
solar_value = 55 − (2 × month + day)
if solar_value ≤ 0: Joker   # Dec 31 only
deck: 1=A♥ … 13=K♥, 14=A♣ … 26=K♣, 27=A♦ … 39=K♦, 40=A♠ … 52=K♠
```

Lineage note: `lib/engine-core/engine.js` wraps solar 0 to 52 so spreads stay
52-wide (Dec 31 → K♠). This pipeline follows the public SEO rule and emits
**Joker**, never K♠, for December 31.

Feb 29 is computed directly (9♣), not remapped to Feb 28.

## Setup

```bash
python3 -m pip install -r pipeline/requirements.txt
python3 -m pytest pipeline/tests
```

Wikimedia requires a descriptive User-Agent. Override if needed:

```bash
export PIPELINE_USER_AGENT='CardBlueprintsBirthCardPipeline/0.1 (https://cardblueprints.com; you@example.com)'
```

## 8-month rebuild (pageviews → wikidata → build)

D4: run this path against the existing ~1,161-row seed first. Scale to ~24
months / ~4k rows later by passing `--months 24`.

```bash
# 1. Monthly top/en.wikipedia pageviews, junk-filtered and deduped
python3 -m pipeline.pageviews --months 8 \
  --cache-dir pipeline/data/cache/pageviews \
  --out pipeline/data/cache/pageviews.jsonl

# 2. wbgetentities in batches of 50 (REST only — no query.wikidata.org SPARQL)
python3 -m pipeline.wikidata \
  --titles pipeline/data/cache/pageviews.jsonl \
  --cache pipeline/data/cache/wikidata \
  --out pipeline/data/cache/wikidata_people.jsonl

# 3. enwiki REST summaries → source_text
python3 -m pipeline.wikipedia_summary \
  --from-cache pipeline/data/cache/wikidata \
  --cache-dir pipeline/data/cache/summaries \
  --out pipeline/data/cache/summaries.jsonl

# 4. Assemble people.jsonl + exclusion report
python3 -m pipeline.build_dataset \
  --pageviews pipeline/data/cache/pageviews.jsonl \
  --wikidata-cache pipeline/data/cache/wikidata \
  --summaries pipeline/data/cache/summaries.jsonl \
  --out pipeline/data/people.jsonl \
  --exclusion-report pipeline/data/exclusions.json
```

Or one shot after step caches exist / to fetch them:

```bash
python3 -m pipeline.build_dataset --fetch --months 8 \
  --out pipeline/data/people.jsonl
```

## US presidents (isolated `/presidents`)

45 people / 47 presidencies. SPARQL first (`P39=Q11696`), then known Q-ids +
`wbgetentities` if `query.wikidata.org` times out. Wikipedia home-state list
cross-checks month/day. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.presidents
```

Output: [`data/presidents/people.jsonl`](data/presidents/people.jsonl). Pages:
`bun run build:seo-presidents`. Do not deploy.

## US federal holidays (isolated `/holidays`)

Five fixed § 6103(a) dates only (January 1, June 19, July 4, November 11,
December 25). Floating holidays and weekend observed shifts are omitted.
Birth cards use this module's D1 rule. Year unused.

```bash
python3 -m pipeline.holidays
python3 -m pytest pipeline/tests/test_holidays.py
```

Writes [`../seo-pages/data/holidays.jsonl`](../seo-pages/data/holidays.jsonl).
Pages: `bun run build:seo-holidays`. Do not deploy.

## Declaration signers (isolated `/signers`)

44 verified people (56 NARA signers minus 9 year-only minus 3 contested holds).
Catalog first (`pipeline/signers/catalog.py`): NARA Signers Factsheet, Wikipedia
infobox, Bioguide. New Style preferred. Wikidata `P569` precision=11 is QA only
and never invents a day.

```bash
python3 -m pipeline.signers
```

Output: [`data/signers/people.jsonl`](data/signers/people.jsonl). Pages:
`bun run build:seo-signers`. Do not deploy.

## Nobel laureates (isolated `/nobel`)

People with a day-precision Nobel API v2.1 birth date **and** a matching
Wikidata `P569` (precision 11). Organizations, year-only dates
(`YYYY-00-00`), Nobel↔Wikidata conflicts, minors, and D3 description
keywords are dropped. Dates are never invented. The celebrity
`year_before_1900` cut is **not** applied (Curie 1867, Einstein 1879).

```bash
python3 -m pipeline.nobel
python3 -m pytest pipeline/tests/test_nobel.py
```

Output: [`data/nobel/people.jsonl`](data/nobel/people.jsonl). Pages:
`bun run build:seo-nobel`. Do not deploy.

## Current SCOTUS justices (isolated `/scotus`)

Nine sitting justices. SCOTUS.gov Current Members biographies at day
precision, verified against Wikidata `P569` (precision 11). Retired
justices, year-only dates, SCOTUS.gov↔Wikidata conflicts, minors, and
D3 description keywords are dropped. Dates are never invented.

```bash
python3 -m pipeline.scotus
python3 -m pytest pipeline/tests/test_scotus.py
```

Output: [`data/scotus/people.jsonl`](data/scotus/people.jsonl). Pages:
`bun run build:seo-scotus`. Do not deploy.

## Current US Cabinet (isolated `/cabinet`)

Sitting Vice President + 15 executive-department heads. White House
cabinet page is the sitting roster. Wikipedia infobox birth-date
templates are the public day. Wikidata `P569` precision 11 must match.
Year-only dates and Wikipedia↔Wikidata conflicts are dropped.
Cabinet-level officials outside the 15 departments are omitted. Birth
cards use this module's D1 rule.

```bash
python3 -m pipeline.cabinet
python3 -m pytest pipeline/tests/test_cabinet.py
```

Output: [`data/cabinet/people.jsonl`](data/cabinet/people.jsonl). Pages:
`bun run build:seo-cabinet`. Do not deploy.

## Current US governors (isolated `/governors`)

Sitting governors of the 50 states. Wikipedia current-governors list is
the sitting source and the public day. Wikidata `P569` precision 11 must
match. Year-only dates and list↔Wikidata conflicts are dropped. DC and
territories are omitted. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.governors
python3 -m pytest pipeline/tests/test_governors.py
```

Output: [`data/governors/people.jsonl`](data/governors/people.jsonl). Pages:
`bun run build:seo-governors`. Do not deploy.

## Current US senators (isolated `/senators`)

Sitting senators of the 50 states (100 seats). congress-legislators
(Bioguide / congress.gov compiled) is the sitting source. Wikipedia
current-senators list and Wikidata `P569` precision 11 must match that
day. Year-only dates and Bioguide↔Wikipedia↔Wikidata conflicts are
dropped. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.senators
python3 -m pytest pipeline/tests/test_senators.py
```

Output: [`data/senators/people.jsonl`](data/senators/people.jsonl). Pages:
`bun run build:seo-senators`. Do not deploy.

## Winter Olympic medalists (isolated `/olympics/winter`)

Athletes on Wikipedia’s list of multiple Winter Olympic medalists
(primary table: **at least eight** medals). Wikipedia infobox birth-date
templates are the public day. Wikidata `P569` precision 11 must match.
Year-only dates, Wikipedia↔Wikidata conflicts, minors, and D3 keywords
are dropped. The one-event table on the same page is omitted. Birth
cards use this module's D1 rule.

```bash
python3 -m pipeline.olympics.winter
python3 -m pytest pipeline/tests/test_winter_olympics.py
```

Output: [`data/olympics/winter/people.jsonl`](data/olympics/winter/people.jsonl).
Pages: `bun run build:seo-olympics-winter`. Do not deploy.

## Summer Olympians (isolated `/olympics/summer`)

People with **two or more Summer Olympic gold medals** on Wikidata
(`P1344` + `P166` Olympic gold, event `P361+` a Summer Games) **and** a
matching Wikipedia infobox day / Wikidata `P569` (precision 11).
Winter-only careers, year-only dates, Wikipedia↔Wikidata conflicts,
minors, and D3 description keywords are dropped. Dates are never
invented. The celebrity `year_before_1900` cut is **not** applied.

```bash
python3 -m pipeline.olympics
python3 -m pytest pipeline/tests/test_olympics.py
```

Output: [`data/olympics/people.jsonl`](data/olympics/people.jsonl). Pages:
`bun run build:seo-olympics`. Do not deploy.

## Tony Award leading acting (isolated `/tonys`)

Leading Actor / Leading Actress winners in a play or musical. Wikipedia
category lists are the winner catalog (Tony Awards record). Wikidata `P569`
precision 11 is required. Wikipedia person-page birth templates are a
conflict check when they include a day. Year-only dates, Wikipedia↔Wikidata
conflicts, minors, and D3 description keywords are dropped. Dates are never
invented. Featured acting categories are out of scope.

```bash
python3 -m pipeline.tonys
python3 -m pytest pipeline/tests/test_tonys.py
```

Output: [`data/tonys/people.jsonl`](data/tonys/people.jsonl). Pages:
`bun run build:seo-tonys`. Do not deploy.

## Academy Award winners (isolated `/oscars`)

Unique Best Actor and Best Actress winners. Wikipedia winner tables are
the identity source (they cite Oscars.org ceremony pages). Wikipedia
person-page infobox birth-date templates are the public day. Wikidata
`P569` precision 11 must match. Year-only dates and Wikipedia↔Wikidata
conflicts are dropped. Supporting acting categories are omitted. Dates
are never invented. The celebrity `year_before_1900` cut is **not**
applied. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.oscars
python3 -m pytest pipeline/tests/test_oscars.py
```

Output: [`data/oscars/people.jsonl`](data/oscars/people.jsonl). Pages:
`bun run build:seo-oscars`. Do not deploy.

## Primetime Emmy Lead Actor / Actress (isolated `/emmys`)

Primetime Emmy Lead Actor and Lead Actress winners from the drama and
comedy Wikipedia lineage lists. Wikipedia person-article infobox/lead
day-precision dates must match Wikidata `P569` (precision 11). Year-only
dates, Wikipedia↔Wikidata conflicts, minors, and D3 keywords are dropped.
Dates are never invented. Supporting, Limited-as-own-category, Guest,
Daytime, and International lists are out of scope.

```bash
python3 -m pipeline.emmys
python3 -m pytest pipeline/tests/test_emmys.py
```

Output: [`data/emmys/people.jsonl`](data/emmys/people.jsonl). Pages:
`bun run build:seo-emmys`. Do not deploy.

## Grammy Album of the Year (isolated `/grammys/aoty`)

Primary billed Album of the Year winners. Wikipedia winner tables are
the identity source (they cite Grammy.com / Recording Academy pages).
Wikipedia person-page infobox birth-date templates are the public day.
Wikidata `P569` precision 11 must match. Year-only dates and
Wikipedia↔Wikidata conflicts are dropped. Bands are expanded only when
a member has a public day-precision DOB; otherwise the band is omitted.
Various-artists soundtracks are omitted. Dates are never invented. The
celebrity `year_before_1900` cut is **not** applied. Birth cards use
this module's D1 rule.

```bash
python3 -m pipeline.grammys
python3 -m pytest pipeline/tests/test_grammys.py
```

Output: [`data/grammys/people.jsonl`](data/grammys/people.jsonl). Pages:
`bun run build:seo-grammys`. Do not deploy.

## NASA astronauts (isolated `/astronauts`)

NASA Fact Book list of U.S. astronauts (flown / selected corps) plus
Group 24 candidates. NASA biography pages are the public day. Wikidata
`P569` precision 11 must match. Year-only dates and NASA↔Wikidata
conflicts are dropped. Dates are never invented. Birth cards use this
module's D1 rule. The celebrity `year_before_1900` cut is not applied.

```bash
python3 -m pipeline.astronauts
python3 -m pytest pipeline/tests/test_astronauts.py
```

Output: [`data/astronauts/people.jsonl`](data/astronauts/people.jsonl). Pages:
`bun run build:seo-astronauts`. Do not deploy.

## NFL Hall of Fame inductees (isolated `/nfl-hof`)

People with a Wikidata **P6930** Pro Football Hall of Fame ID **and** a
day-precision Wikidata `P569` (precision 11). ProFootballHOF.com bios and
Wikipedia infobox days are a conflict check when they publish a day.
Year-only dates, Wikipedia/HOF↔Wikidata day conflicts, minors, and D3
description keywords are dropped. Dates are never invented. The celebrity
`year_before_1900` cut is **not** applied.

```bash
python3 -m pipeline.nfl_hof
python3 -m pytest pipeline/tests/test_nfl_hof.py
```

Output: [`data/nfl_hof/people.jsonl`](data/nfl_hof/people.jsonl). Pages:
`bun run build:seo-nfl-hof`. Do not deploy.

## Rock & Roll Hall of Fame inductees (isolated `/rock-hall`)

Wikipedia Performers list (citing RockHall.com) plus listed inducted
band members. Wikipedia infobox day + Wikidata `P569` precision 11 must
match. Year-only dates, conflicts, minors, and D3 keywords are dropped.
Dates are never invented. Birth cards use this module's D1 rule. The
celebrity `year_before_1900` cut is not applied. Groups without listed
members are not expanded.

```bash
python3 -m pipeline.rock_hall
python3 -m pytest pipeline/tests/test_rock_hall.py
```

Output: [`data/rock_hall/people.jsonl`](data/rock_hall/people.jsonl). Pages:
`bun run build:seo-rock-hall`. Do not deploy.

## Pulitzer Prize for Fiction (isolated `/pulitzer/fiction`)

Person-scope Fiction winners and joint recipients. Wikipedia winner
tables are the identity source (they cite Pulitzer.org year pages).
Wikipedia person-page infobox birth-date templates (plus `birth date
text` / bare month-day fields) are the public day. Wikidata `P569`
precision 11 must match. Year-only dates, Wikipedia↔Wikidata conflicts,
institutions, minors, and D3 keywords are dropped. Dates are never
invented. The celebrity `year_before_1900` cut is **not** applied.
Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.pulitzer_fiction
python3 -m pytest pipeline/tests/test_pulitzer_fiction.py
```

Output: [`data/pulitzer_fiction/people.jsonl`](data/pulitzer_fiction/people.jsonl).
Pages: `bun run build:seo-pulitzer-fiction`. Do not deploy.

## US House leadership + standing chairs (isolated `/house-chairs`)

house.gov/leadership plus the 20 standing committee chairs. Wikipedia
infobox birth-date templates are the public day. congress-legislators /
Bioguide compiled birthdays and Wikidata `P569` precision 11 must match.
Year-only dates, Wikipedia↔Bioguide↔Wikidata conflicts, minors, and D3
keywords are dropped. Select and campaign committees are out of scope.
Dates are never invented. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.house_chairs
python3 -m pytest pipeline/tests/test_house_chairs.py
```

Output: [`data/house_chairs/people.jsonl`](data/house_chairs/people.jsonl).
Pages: `bun run build:seo-house-chairs`. Do not deploy.

## Kennedy Center Honors (isolated `/kennedy-center-honors`)

Person-scope Kennedy Center Honors recipients from the Wikipedia roster
(which cites Kennedy Center honors pages). Groups and collectives expand
only listed members. Wikipedia infobox day + Wikidata `P569` precision 11
must match. Institutions, rescinded awards, year-only dates, conflicts,
minors, and D3 keywords are dropped. Dates are never invented. Birth
cards use this module's D1 rule. The celebrity `year_before_1900` cut is
not applied. Kennedy Center artist bios are checked when Wikipedia cites
them.

```bash
python3 -m pipeline.kennedy_center_honors
python3 -m pytest pipeline/tests/test_kennedy_center_honors.py
```

Output: [`data/kennedy_center_honors/people.jsonl`](data/kennedy_center_honors/people.jsonl).
Pages: `bun run build:seo-kennedy-center-honors`. Do not deploy.

## TIME Person of the Year (isolated `/time-person-of-the-year`)

Named humans only from the Wikipedia Person(s) of the Year table. Duals
and joint years are split per person. Abstractions, machines, and
groups-as-concepts stay out, including Notes-only cover spotlights.
Wikipedia person-page infobox birth-date templates (plus `birth date
text` / bare month-day fields) are the public day. Wikidata `P569`
precision 11 must match. Year-only dates, Wikipedia↔Wikidata conflicts,
minors, and D3 keywords are dropped. Dates are never invented. TIME.com
/ vault is context only and is never fetched as a date source. The
celebrity `year_before_1900` cut is **not** applied. Birth cards use
this module's D1 rule.

```bash
python3 -m pipeline.time_poty
python3 -m pytest pipeline/tests/test_time_poty.py
```

Output: [`data/time_poty/people.jsonl`](data/time_poty/people.jsonl).
Pages: `bun run build:seo-time-poty`. Do not deploy.

## Birth-card Famous people grounding (existing `/birth-card` pages)

Verifies the editorial Famous people list on the 52 card-meaning pages
plus `/birth-card/joker`. Wikidata `P569` day-precision must match the
listed birthday. Year-only dates, conflicts, minors, and D3 keywords are
dropped. Dates are never invented. The celebrity `year_before_1900` cut
is **not** applied. This is not a new path and not an isolated scaffold.

```bash
python3 -m pipeline.famous_birthdays
python3 -m pytest pipeline/tests/test_famous_birthdays.py
```

Writes [`../lib/famous-birthdays.json`](../lib/famous-birthdays.json) and
[`data/famous-birthdays/provenance.json`](data/famous-birthdays/provenance.json).
Do not deploy.

## Existing celebrity blog profiles (citations only)

Ground public DOBs on the live `/blog/{name}-birth-card-profile` pages
already on cardology-mirror (~57). Wikidata `P569` day precision must
match the page's claimed public day. Wikipedia REST summaries are
`source_text`. Evidence must be a near-verbatim span of that summary.
Conflicts, year-only dates, minors, and D3 keywords are dropped or
flagged. Dates are never invented. No new `/birth-card/{person-slug}`
path-split.

```bash
python3 -m pipeline.celebs
python3 -m pipeline.celebs --apply
python3 -m pytest pipeline/tests/test_celeb_blog_citations.py
```

Output: [`data/celebs/people.jsonl`](data/celebs/people.jsonl). Do not
deploy. Do not touch Stripe.

## Born-on notables (grounding of live `/born-on`)

Authority upgrade for existing `/born-on/{month}-{day}` pages. Not a new
niche. Groups the verified celebrity `people.jsonl` catalog (Wikidata
`P569` day precision) onto all 366 calendar days. Year-only dates,
conflicts, minors, and D3 keywords stay dropped. Empty days keep a page
and do not invent notables. Birth cards use this module's D1 rule.

```bash
python3 -m pipeline.born_on
python3 -m pytest pipeline/tests/test_born_on.py
```

Output: [`data/born-on/people.jsonl`](data/born-on/people.jsonl) and
[`data/born-on/days.jsonl`](data/born-on/days.jsonl). Pages:
`bun run build:seo-born-on`. Do not deploy. Path-split is not activated.

## Harvested card meanings (WP3)

`pipeline/data/card_meanings.json` is the 52-card + Joker harvest from the
live `/birth-card/{rank}-of-{suit}` and `/birth-card/joker` source copy.
Regenerate with `python3 -m pipeline.harvest_card_meanings` after meaning
pages change. The Vertex batch stub (`enrich/make_batch.py`) reads this
file and does **not** submit a job.

## Seed drop (~1,161 rows)

Verified `celebrity_birth_cards.csv` and `wikidata_people_raw.psv` live
in `pipeline/data/seed/` (see [`data/seed/README.md`](data/seed/README.md)).
`--from-seed` accepts CSV columns `name,birth_date,birth_card,enwiki_views_8mo,slug`.
Pass `--summaries` (enwiki REST extracts) so `source_text` is the Wikipedia
summary rather than the short Wikidata description:

```bash
# 5-column name|year|month|day|views PSV: resolve Q-ids + enwiki summaries (no Vertex)
python3 -m pipeline.build_dataset --from-seed --fetch \
  --out pipeline/data/people.jsonl \
  --exclusion-report pipeline/data/exclusions.json
```

`--fetch` uses Wikidata `wbgetentities` (REST, no SPARQL) and the enwiki
REST summary API. Cached under `pipeline/data/cache/`. Birth cards are
still recomputed with `birthcard.py` (Dec 31 = Joker).

Birth cards are recomputed with `birthcard.py` (Dec 31 = Joker). Images are
kept only when the Commons license is CC0, CC-BY, or CC-BY-SA.

## Exclusions

| Reason | Rule |
|---|---|
| `description_keyword` | Wikipedia short description contains serial killer / murderer / terrorist / dictator (D3) |
| `minor` | born after today − 18 years |
| `precision` | Wikidata P569 precision &lt; 11 |
| `year_before_1900` | birth year &lt; 1900 |
| `blocklist` | Q-id / slug / name in [`blocklist.txt`](blocklist.txt) |
| `missing_qid` / `missing_birth` / `missing_source` | unusable row |

Counts land in `pipeline/data/exclusions.json` under `by_reason`.

## Schema

`schema/person.schema.json` validates each JSONL row:

`qid`, `name`, `slug`, `birth_date`, `card`, `views`, `occupations`,
`spouse_qids`, `image` (URL or null), `source_text`, `source_url`.

Tiny synthetic fixtures (not celebrity bios) live in `data/fixtures/` and are
what CI validates.

## NFL franchise grant dates

Committed dataset for the isolated `/franchise` SEO scaffold:

```bash
python3 -m pipeline.build_franchises
python3 -m pytest pipeline/tests/test_franchises.py
```

Writes `pipeline/data/franchises.jsonl` and `pipeline/data/hof_franchise_histories.json`.
Primary dates are the Hall of Fame Franchise Date column (grant through
relocations/renames). Birth cards come from `birthcard.py` only. Wikipedia
years are a cross-check, never a date source. No Vertex spend.

## US National Parks

Committed date table for the isolated `/parks` SEO scaffold lives in
`seo-pages/data/parks.jsonl`. Rebuild with
`python3 seo-pages/scripts/write_parks_jsonl.py`. Primary dates are
Wikipedia “Date established as park.” Birth cards come from `birthcard.py`
only. NPS Park Anniversaries footnotes are not mapped. No Vertex spend.

```bash
python3 -m pytest pipeline/tests/test_parks_established.py
bun run build:seo-parks
```

## MLB first-game dates

Committed dataset for the isolated `/mlb` SEO scaffold:

```bash
python3 -m pipeline.build_mlb
python3 -m pytest pipeline/tests/test_mlb.py
```

Writes `pipeline/data/mlb.jsonl` and `pipeline/data/mlb_first_games.json`.
Primary dates are Baseball-Reference franchise first MLB games (first
regular-season box of the BBRef “From” year). Birth cards come from
`birthcard.py` only. Retrosheet game logs corroborate the day. Wikipedia
years are a cross-check, never a date source. Not player DOBs. No Vertex spend.

```bash
bun run build:seo-mlb
```
