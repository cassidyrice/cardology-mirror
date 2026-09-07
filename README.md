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

## Birth-card directories (removed 2026-09-07)

The 23 isolated birth-card directory packs (senators, Nobel laureates, Olympians,
Oscar winners, astronauts, and the rest), their `seo-pages/` generators, the
`cardblueprints-path-split` Worker and their Cloudflare Pages projects were
removed on Cass's order. They are not coming back; do not rebuild them.

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
