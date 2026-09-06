# Card Blueprints (`cardology-mirror`)

Public site for [cardblueprints.com](https://cardblueprints.com) — Cardology tools, content, and products (Personal Card Blueprint, The Analog Algorithm ebook). Owner: Cass Rice (`cassidyrice`).

## Stack

- Next.js 15 / React 19 / TypeScript
- Bun
- Cloudflare Pages (`@cloudflare/next-on-pages` + Wrangler)

## Local development

```bash
bun install
bun run dev   # http://localhost:3577
```

```bash
bun run test  # public-truth validation gate
```

## Celebrity SEO scaffold (isolated)

Day-0 templates for future `/birth-card/{person}`, `/card/*`, and `/birthday/*` pages live in [`seo-pages/`](./seo-pages/). They do not join this Next.js app and must not be deployed yet.

```bash
bun run build:seo-pages   # → seo-pages/dist (celeb fixtures + /states)
bun run test:seo-pages
```

Path ownership and the Cloudflare Pages split note: [`seo-pages/README.md`](./seo-pages/README.md).
US states admission coordinates (hub + 50 pages, CRS dates): [`seo-pages/data/STATES.md`](./seo-pages/data/STATES.md).

US presidents birth-card pages are a second isolated build (`/presidents/{slug}`):

```bash
bun run build:seo-presidents   # → seo-pages/dist-presidents
bun run test:seo-presidents
python3 -m pipeline.presidents # refresh Wikidata + Wikipedia JSONL
```

US federal holiday birth-card pages (fixed § 6103(a) dates only, `/holidays/{slug}`):

```bash
bun run build:seo-holidays   # → seo-pages/dist-holidays
bun run test:seo-holidays
python3 -m pipeline.holidays # refresh JSONL from the statute lock
```

US National Park birth-card pages are a third isolated build (`/parks/{slug}`):

```bash
bun run build:seo-parks   # → seo-pages/dist-parks
bun run test:seo-parks
python3 seo-pages/scripts/write_parks_jsonl.py
```

Declaration signers birth-card pages are a fourth isolated build (`/signers/{slug}`), verified subset only:

```bash
bun run build:seo-signers   # → seo-pages/dist-signers
bun run test:seo-signers
python3 -m pipeline.signers # refresh NARA/Wikipedia JSONL (Wikidata QA only)
```

Current SCOTUS justices birth-card pages (`/scotus/{slug}`), sitting justices only:

```bash
bun run build:seo-scotus   # → seo-pages/dist-scotus
bun run test:seo-scotus
python3 -m pipeline.scotus # SCOTUS.gov + Wikidata P569 verify
```

MLB first-game birth-card pages (`/mlb/{slug}`).
Dates are franchise first MLB games, not player DOBs:

```bash
bun run build:seo-mlb   # → seo-pages/dist-mlb
bun run test:seo-mlb
python3 -m pipeline.build_mlb
```

Current US governors birth-card pages are an isolated build (`/governors/{slug}`),
50 states only:

```bash
bun run build:seo-governors   # → seo-pages/dist-governors
bun run test:seo-governors
python3 -m pipeline.governors
```

Current US Cabinet birth-card pages are an isolated build (`/cabinet/{slug}`),
VP + 15 secretaries only:

```bash
bun run build:seo-cabinet   # → seo-pages/dist-cabinet
bun run test:seo-cabinet
python3 -m pipeline.cabinet
```

Current US senators birth-card pages are an isolated build (`/senators/{slug}`),
100 seats, day-precision only:

```bash
bun run build:seo-senators   # → seo-pages/dist-senators
bun run test:seo-senators
python3 -m pipeline.senators
```

Academy Award Best Actor / Best Actress birth-card pages are an isolated
build (`/oscars/{slug}`), unique winners, day-precision only:

```bash
bun run build:seo-oscars   # → seo-pages/dist-oscars
bun run test:seo-oscars
python3 -m pipeline.oscars
```

Do not deploy these scaffolds from this work.

WP3 enrich prep (card-meaning harvest + Vertex batch stub, no spend):
[`pipeline/data/card_meanings.json`](./pipeline/data/card_meanings.json) and
[`enrich/`](./enrich/).

## Deploy

Pushing to GitHub does **not** deploy. Production is only from the canonical tree `~/cardology-elroy-qa`:

```bash
cd ~/cardology-elroy-qa
bun run pages:deploy
```

Full policy, guards, and recovery: [DEPLOY.md](./DEPLOY.md).

## Security

Operational checklist (headers, rate limits, secrets, rollback): [docs/SECURITY.md](./docs/SECURITY.md). PR checks: `.github/workflows/pr-ci.yml`.
