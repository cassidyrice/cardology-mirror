# Celebrity birth-card SEO scaffold (WP4)

Isolated static templates for future Card Blueprints celebrity pages. This folder does **not** join the Next.js app, does **not** touch checkout/Stripe, and must **not** be deployed in this work package.

The main site is Next.js on Cloudflare Pages (`cardology-mirror`). Closest stack in-repo is Bun + TypeScript, so this scaffold is a zero-dependency Bun static build that can later ingest WP3 `people_enriched.jsonl`.

## Build

From the repo root:

```bash
bun run build:seo-pages
```

Or:

```bash
cd seo-pages
bun run build
```

Output: `seo-pages/dist/` (gitignored). Fixture input: `seo-pages/fixtures/people.example.jsonl` (3 EXAMPLE people, no real bios). The same build also emits `/states` + 50 state pages from `data/states.jsonl` (CRS dates, not fixtures).

Tests (build + slot/JSON-LD assertions):

```bash
bun run test:seo-pages
```

Later, point the builder at enriched rows:

```bash
bun seo-pages/src/build.ts   # default fixtures
# or import { buildSeoPages } from "./seo-pages/src/build.ts"
# buildSeoPages({ peoplePath: "/path/to/people_enriched.jsonl" })
```

WP3 rows must keep the JSONL shape in `src/types.ts` (`EnrichedPerson`). Set `example: false` only after load.ts is relaxed to accept production rows.

## URL scheme (flat)

| Page | Path |
| --- | --- |
| Person | `/birth-card/{slug}` |
| Card hub | `/card/{rank}-of-{suit}` |
| Joker hub | `/card/joker` |
| Birthday | `/birthday/{month}-{day}` (no zero-pad: `december-31`) |
| Daily | `/today` (stub only) |
| States hub | `/states` |
| State | `/states/{slug}` (50 states; no DC/territories) |

Person slugs are reserved away from `joker`, `{rank}-of-{suit}`, and `{month}-{day}` so they cannot collide with existing card or date pages.

Fixture builds also emit preview-only indexes at `/`, `/birth-card`, `/card`, and `/birthday` so crumbs resolve locally. Those directory URLs are **not** Pages-owned; production `/birth-card` stays on Next.js.

## Cass locks

- **D1:** Every Joker-related page (`/birth-card/{joker-person}`, `/card/joker`, `/birthday/december-31`) renders a `data-cass-lock="D1"` December 31 / Joker lineage note slot. Copy is an EXAMPLE placeholder.
- **D2:** Cloudflare Pages path-split ownership is in `path-ownership.json` and the table below.

## Pages path ownership (D2)

This isolated project is destined to own **only** these prefixes on `cardblueprints.com`, behind a Worker (or equivalent) path split. Do not attach this `dist/` to the live `cardology-mirror` project.

**This site will own**

- `/birth-card/{person-slug}` — celebrity person pages
- `/card/{rank}-of-{suit}` and `/card/joker` — new card hubs
- `/birthday/{month}-{day}` — new birthday hubs
- `/sitemap-celeb.xml`, `/sitemap-people.xml`, `/sitemap-cards.xml`, `/sitemap-birthdays.xml`
- `/states` and `/states/{slug}` — US admission/ratification coordinates (parallel track; see [`data/STATES.md`](./data/STATES.md))
- `/sitemap-states.xml`

**Do not cut over without a router**

- `/today` — production is the Next.js daily app (`app/today/page.tsx`). The stub here is for template completeness only.
- `/robots.txt` — production robots stay on the Next.js app (`app/robots.ts`). This folder’s `robots.txt` is preview-only; when going live, add `sitemap-celeb.xml` to the existing robots sitemap list instead of replacing the file.
- `/birth-card/{rank}-of-{suit}` and `/birth-card/joker` — live card-meaning pages in Next.js. A Worker must distinguish person slugs from card slugs (and `joker`) until those hubs move to `/card/`.

**Never own (payment / app)**

- `/checkout`, `/checkout/*`, `/api/checkout/*`
- `/create-checkout` (does not exist; live session create is `POST /checkout/{offer}/session`)
- `/api/*`, `/products/*`

**Stay on the existing origin**

- Next.js: marketing pages, calculators, `/birth-card` index + 52 card pages + `/birth-card/joker`, `/today`, `/sitemap.xml`, `/robots.txt`
- `cardology-unlock` Worker: `/born-on/*`, `/compatibility/*`, `/sitemap-cardology.xml`, `/sitemap-compatibility.xml`

Machine-readable copy: [`path-ownership.json`](./path-ownership.json). Wrangler stub: [`wrangler.toml`](./wrangler.toml) (`cardblueprints-celeb-seo`). Do not run `wrangler pages deploy` from this folder.

## CTA

Person pages link to the existing checkout:

`/checkout/deep-dive?utm_source=celeb&utm_content={slug}`

State pages use the same checkout path with `utm_source=states&utm_content={slug}`. Holiday pages use `utm_source=holidays&utm_content={slug}`. Governor pages use `utm_source=governors&utm_content={slug}`. Senator pages use `utm_source=senators&utm_content={slug}`. Link only — no checkout form.

(`/checkout/personal-card-blueprint` is retired and 301s to the Deep Dive product page.)

A disabled `POST /create-checkout` form is a stub only. It is not wired and must not be implemented in this folder.

## Sources

Every person page has a source line slot: Wikidata CC0 + Wikipedia CC BY-SA 4.0. Fixture QIDs/titles are empty.

State pages attribute CRS R47747 Table 1 (primary) and the Wikipedia admission list (secondary). Dates are not invented. See [`data/STATES.md`](./data/STATES.md).

## What WP3 fills later

- Real `people_enriched.jsonl` (drop `example: true` after the loader allowlist is updated)
- Real hooks, card-meaning weave, evidence, FAQs
- Same-card / same-day link graphs (templates already pad to 6 same-card slots)
- OG assets at `/og/birth-card/{slug}.png`
- Engine-resolved card for each birthday (fixtures are labeled EXAMPLE mappings)

## Isolation

No imports from `app/`, `components/`, or checkout libraries. No FastAPI in this repo; payment lives on Next.js Stripe routes and was not modified.

## NFL franchise birth cards (parallel scaffold)

Isolated second build. Does **not** join the Next.js app, does **not** touch checkout/Stripe, and must **not** be deployed.

```bash
bun run build:franchise-pages
bun run test:franchise-pages
```

Output: `seo-pages/dist-franchise/` (gitignored). Dataset: `pipeline/data/franchises.jsonl` (32 current clubs). Rebuild the JSONL with `python3 -m pipeline.build_franchises`.

| Page | Path |
| --- | --- |
| Hub | `/franchise` |
| Team | `/franchise/{slug}` |

Team slugs are current names (`dallas-cowboys`, `washington-commanders`). They live under `/franchise/` so they cannot collide with person `/birth-card/{slug}` or live `/birth-card/{rank}-of-{suit}`.

Dates are the Pro Football Hall of Fame **Franchise Date** (grant through relocations/renames). Not first kickoff. Not 1919 Packers lore. Wikipedia’s NFL teams table is a year cross-check only.

CTA: `/checkout/deep-dive?utm_source=nfl&utm_content={slug}` ($9 Birth Card Deep Dive). Cards are coordinates, not fortune-telling.

Path lock: [`franchise-path-ownership.json`](./franchise-path-ownership.json).

## US presidents (isolated `/presidents`)

Separate static build. Does **not** take celebrity `/birth-card/{slug}` or live
card-meaning routes.

```bash
bun run build:seo-presidents   # → seo-pages/dist-presidents
bun run test:seo-presidents
```

- Hub: `/presidents`
- Person: `/presidents/{slug}`
- CTA: `/checkout/deep-dive?utm_source=presidents&utm_content={slug}`
- Data: `pipeline/data/presidents/people.jsonl` (Wikidata CC0 + Wikipedia summaries)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.

## US federal holidays (isolated `/holidays`)

Separate static build. Fixed dates from 5 U.S.C. § 6103(a) only. Does **not**
take celebrity `/birth-card/{slug}` or live card-meaning routes.

```bash
bun run build:seo-holidays   # → seo-pages/dist-holidays
bun run test:seo-holidays
python3 -m pipeline.holidays # rewrite seo-pages/data/holidays.jsonl
```

- Hub: `/holidays`
- Holiday: `/holidays/{slug}`
- Pages: hub + New Year’s Day, Juneteenth, Independence Day, Veterans Day, Christmas Day
- Dropped: floating Monday/Thursday holidays; Inauguration Day (§ 6103(c)); weekend observed shifts
- CTA: `/checkout/deep-dive?utm_source=holidays&utm_content={slug}`
- Data: `seo-pages/data/holidays.jsonl` (Cornell LII statute dates; OPM calendars only)
- Formula: `pipeline.birthcard` (December 31 = Joker). Year unused.

Dates: [`data/HOLIDAYS.md`](./data/HOLIDAYS.md). Path lock: [`holiday-path-ownership.json`](./holiday-path-ownership.json).

## US National Parks (isolated `/parks`)

Separate static build. Does **not** join the Next.js app, does **not** touch checkout/Stripe, and must **not** be deployed.

```bash
bun run build:seo-parks   # → seo-pages/dist-parks
bun run test:seo-parks
```

| Page | Path |
| --- | --- |
| Hub | `/parks` |
| Park | `/parks/{slug}` |

Primary date is Wikipedia’s **Date established as park** (National Park designation, not first monument). NPS Park Anniversaries is a footnote source for earlier first-unit dates. See [`data/PARKS.md`](./data/PARKS.md).

CTA: `/checkout/deep-dive?utm_source=parks&utm_content={slug}`. Cards are coordinates, not fortune-telling.

Path lock: [`parks-path-ownership.json`](./parks-path-ownership.json).

## Declaration signers (isolated `/signers`)

Separate static build. Verified-day subset only. Does **not** take celebrity
`/birth-card/{slug}`, live card-meaning routes, or `/presidents`.

```bash
bun run build:seo-signers   # → seo-pages/dist-signers
bun run test:seo-signers
```

- Hub: `/signers`
- Person: `/signers/{slug}`
- CTA: `/checkout/deep-dive?utm_source=signers&utm_content={slug}`
- Data: `pipeline/data/signers/people.jsonl` (NARA + Wikipedia + Bioguide; Wikidata precision=11 is QA only)
- Held: Hancock (OS/NS), Harrison V, Hewes. Nine NARA year-only rows have no page.
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.

Path lock: [`signers-path-ownership.json`](./signers-path-ownership.json).

## Nobel laureates (isolated `/nobel`)

Separate static build. Day-precision Nobel Prize API v2.1 dates verified
against Wikidata `P569`. Does **not** take celebrity `/birth-card/{slug}`
or live card-meaning routes. Does **not** join the Next.js app, does
**not** touch checkout/Stripe, and must **not** be deployed.

```bash
bun run build:seo-nobel   # → seo-pages/dist-nobel
bun run test:seo-nobel
python3 -m pipeline.nobel # rewrite pipeline/data/nobel/people.jsonl
```

- Hub: `/nobel`
- Person: `/nobel/{slug}`
- CTA: `/checkout/deep-dive?utm_source=nobel&utm_content={slug}`
- Data: `pipeline/data/nobel/people.jsonl` (Nobel API + Wikidata CC0 + Wikipedia summaries)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.
- Dropped: organizations, year-only Nobel dates, Wikidata precision &lt; 11, Nobel↔Wikidata conflicts, minors, D3 keywords

Path lock: [`nobel-path-ownership.json`](./nobel-path-ownership.json).

## Current SCOTUS justices (isolated `/scotus`)

Separate static build. Day-precision SCOTUS.gov Current Members dates
verified against Wikidata `P569`. Does **not** take celebrity
`/birth-card/{slug}` or live card-meaning routes. Does **not** join the
Next.js app, does **not** touch checkout/Stripe, and must **not** be
deployed.

```bash
bun run build:seo-scotus   # → seo-pages/dist-scotus
bun run test:seo-scotus
python3 -m pipeline.scotus # rewrite pipeline/data/scotus/people.jsonl
```

- Hub: `/scotus`
- Person: `/scotus/{slug}`
- CTA: `/checkout/deep-dive?utm_source=scotus&utm_content={slug}`
- Data: `pipeline/data/scotus/people.jsonl` (SCOTUS.gov + Wikidata CC0 + Wikipedia summaries)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.
- Dropped: retired justices, year-only dates, Wikidata precision &lt; 11, SCOTUS.gov↔Wikidata conflicts, minors, D3 keywords

Path lock: [`scotus-path-ownership.json`](./scotus-path-ownership.json).

## MLB first-game cards (isolated `/mlb`)

Separate static build. Franchise first MLB games from Baseball-Reference
(Retrosheet game-log corroboration). Does **not** join the Next.js app, does
**not** touch checkout/Stripe, and must **not** be deployed. Not player DOBs.

```bash
bun run build:seo-mlb   # → seo-pages/dist-mlb
bun run test:seo-mlb
python3 -m pipeline.build_mlb
```

| Page | Path |
| --- | --- |
| Hub | `/mlb` |
| Club | `/mlb/{slug}` |

Dates are the first regular-season box of the franchise’s BBRef **From** year.
Not player birthdays. Not current-city first pitch. Not 1871 Braves NA lore.

CTA: `/checkout/deep-dive?utm_source=mlb&utm_content={slug}`. Cards are
coordinates, not fortune-telling.

Path lock: [`mlb-path-ownership.json`](./mlb-path-ownership.json).
Dates: [`data/MLB.md`](./data/MLB.md).

## Current US Cabinet (isolated `/cabinet`)

Separate static build. Sitting Vice President + 15 executive-department
heads. Does **not** take celebrity `/birth-card/{slug}` or live
card-meaning routes. Does **not** join the Next.js app, does **not**
touch checkout/Stripe, and must **not** be deployed.

```bash
bun run build:seo-cabinet   # → seo-pages/dist-cabinet
bun run test:seo-cabinet
python3 -m pipeline.cabinet # rewrite pipeline/data/cabinet/people.jsonl
```

- Hub: `/cabinet`
- Person: `/cabinet/{slug}`
- CTA: `/checkout/deep-dive?utm_source=cabinet&utm_content={slug}`
- Data: `pipeline/data/cabinet/people.jsonl` (White House roster + Wikipedia infobox + Wikidata P569)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.
- Dropped: Cabinet-level officials outside the 15 departments, year-only infobox dates, Wikipedia↔Wikidata day conflicts, minors, D3 keywords

Path lock: [`cabinet-path-ownership.json`](./cabinet-path-ownership.json).

## Current US governors (isolated `/governors`)

Separate static build. Sitting governors of the 50 states. Does **not**
take celebrity `/birth-card/{slug}` or live card-meaning routes. Does
**not** join the Next.js app, does **not** touch checkout/Stripe, and
must **not** be deployed.

```bash
bun run build:seo-governors   # → seo-pages/dist-governors
bun run test:seo-governors
python3 -m pipeline.governors # rewrite pipeline/data/governors/people.jsonl
```

- Hub: `/governors`
- Person: `/governors/{slug}`
- CTA: `/checkout/deep-dive?utm_source=governors&utm_content={slug}`
- Data: `pipeline/data/governors/people.jsonl` (Wikipedia current-governors list + Wikidata P569 + NGA + Ballotpedia)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.
- Dropped: year-only list dates, Wikipedia↔Wikidata day conflicts, DC/territories, minors, D3 keywords

Path lock: [`governors-path-ownership.json`](./governors-path-ownership.json).

## Current US senators (isolated `/senators`)

Separate static build. Sitting senators of the 50 states (100 seats).
Does **not** take celebrity `/birth-card/{slug}` or live card-meaning
routes. Does **not** join the Next.js app, does **not** touch
checkout/Stripe, and must **not** be deployed. Path-split is documented
only — not activated.

```bash
bun run build:seo-senators   # → seo-pages/dist-senators
bun run test:seo-senators
python3 -m pipeline.senators # rewrite pipeline/data/senators/people.jsonl
```

- Hub: `/senators`
- Person: `/senators/{slug}`
- CTA: `/checkout/deep-dive?utm_source=senators&utm_content={slug}`
- Data: `pipeline/data/senators/people.jsonl` (Bioguide / congress.gov + Wikipedia current-senators list + Wikidata P569)
- Copy: local templates from `source_text` + harvested card meanings. No Vertex.
- Dropped: year-only list/Bioguide dates, Bioguide↔Wikipedia↔Wikidata day conflicts, minors, D3 keywords

Path lock: [`senators-path-ownership.json`](./senators-path-ownership.json).
