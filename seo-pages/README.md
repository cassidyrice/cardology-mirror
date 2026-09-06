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

Output: `seo-pages/dist/` (gitignored). Fixture input: `seo-pages/fixtures/people.example.jsonl` (3 EXAMPLE people, no real bios).

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

(`/checkout/personal-card-blueprint` is retired and 301s to the Deep Dive product page.)

A disabled `POST /create-checkout` form is a stub only. It is not wired and must not be implemented in this folder.

## Sources

Every person page has a source line slot: Wikidata CC0 + Wikipedia CC BY-SA 4.0. Fixture QIDs/titles are empty.

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
