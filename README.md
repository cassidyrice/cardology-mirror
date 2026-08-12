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

## Deploy

Pushing to GitHub does **not** deploy. Production is only from the canonical tree `~/cardology-elroy-qa`:

```bash
cd ~/cardology-elroy-qa
bun run pages:deploy
```

Full policy, guards, and recovery: [DEPLOY.md](./DEPLOY.md).

## Security

Operational checklist (headers, rate limits, secrets, rollback): [docs/SECURITY.md](./docs/SECURITY.md). PR checks: `.github/workflows/pr-ci.yml`.
