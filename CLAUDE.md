# cardblueprints.com — agent rules (Claude Code reads CLAUDE.md; Codex/Cursor/Grok/Hermes read AGENTS.md, same file)

Read `DEVELOPMENT-LEDGER.md` first (what is live, open PRs, approvals) and `DEPLOY.md` (how deploys work). Cross-agent log: `~/ledger/LEDGER.md` (read the last 24h before starting; append one line when done).

## Non-negotiables
- **Every push to `main` deploys to production** (code or docs) via `.github/workflows/deploy.yml` → `bun run pages:deploy`. Work on a branch, open a PR, and merge only after Cass says "deploy" / "ship" / "y". Never push straight to `main`. Local manual deploys are retired (`~/cardology-elroy-qa` was lost in the factory reset); this checkout is `~/Documents/ChatGPT/Card Blueprints/cardology-mirror`.
- **What is live:** `curl -s https://cardblueprints.com/version.txt` prints the live commit. The Cloudflare dashboard labels everything "main"; `ops/DEPLOY-SOURCE.md` is an old record that CI does not update.
- **One product for sale: the $39 Chemistry Check**, sold on Stan Store (`lib/readings-nav.ts`, `CHEMISTRY_CHECK_URL`); every paid CTA points there or at `/#chemistry-check`. Nothing is sold through Stripe on this site any more (`PUBLIC_PRODUCTS` is empty, `/checkout/[offer]` is gone). No email capture: no newsletter, free course, or Elroy chat. Retired 2026-10-18 and 301'd to `/#readings`: the $13 One Question Reading, Your Year Ahead ($19), the Blueprint Report ($129/$297), the Card Blueprint App ($69), the Timing Map and Family Snapshot. Do not resurrect any of them; `scripts/retired-offers.test.ts` fails if they reappear on a public page. Fulfillment for past buyers stays intact (webhook, `/checkout/success`, `/my-purchases`, `/blueprint?token=…`, downloads). Stripe account **Card Blueprint** (`acct_1U1a1dChx1yAVyrs`) only for past orders; never the Cassidy Rice / 52xseven account.
- **Never `ALLOW_DIRTY=1`.** Commit first.
- Secrets live in `.env.local` and Cloudflare project secrets. Never print them, never commit them. **Never edit the Pages project's environment variables in the Cloudflare dashboard** (2026-09-04: one dashboard save blanked every secret value and took checkout down). Add or change a secret only with `npx wrangler pages secret put NAME --project-name cardology-mirror`, one at a time, then redeploy.

## Before you say "done"
1. `bun run test` passes.
2. If you touched a page: `bun run test:seo:browser` or the Playwright probe in `.claude/commands/polish.md`.
3. If you touched checkout: `/checkout-check`.
4. Commit with a message that says what changed for the visitor.

## Working style (Cass)
- Reply as short as possible. Outcome first, one action at a time, end with a `(y/n)` question. No headers, no long lists.
- "commit it" / "deploy" / "y" = do it now.
- Don't ask what to do next; propose the single next action.

## Map
- Calculator + Chemistry Check CTA: `components/seo/BirthCardCalculator.tsx`, `components/seo/StanReadingCta.tsx`; homepage offer `components/offers/ManualReadingOffers.tsx`
- Past-buyer fulfillment: webhook `app/api/checkout/webhook/route.ts`, success page `app/checkout/success/page.tsx`; product records `lib/products.ts`, `lib/deep-dive.ts`
- Funnel events: `lib/analytics.ts` → Cloudflare Analytics Engine dataset `cardblueprints_funnel` (`scripts/growth-report.sh`)
- Card copy source of truth: `lib/card-bible.json` (53 merged records: the 52 birth cards plus the Joker; rebuilt by `bun scripts/build-card-bible.ts`, authored lines in `scripts/card-bible-voice.json`, pinned by `scripts/card-bible.test.ts`), accessor `lib/card-bible.ts`; shadow layer `lib/shadow-deck.json` + `components/seo/ShadowLayer.tsx` (rollout list `SHADOW_LAYER_CARDS`)
- SEO pages: `app/**/page.tsx`, shell `components/seo/SeoShell.tsx`; OG images `scripts/generate_page_og_images.py`
- Worker for /born-on and /compatibility: sibling repo `~/Documents/ChatGPT/Card Blueprints/cardology-unlock` (not this repo; `npm test`, `npm run ship`)
- Bonus Deep Dive PDFs: R2 `cardblueprints-ebooks/deep-dive/`, uploader `scripts/upload-deep-dive-card-pdfs.sh`

## Several agents at once (shared terminal)
- **Check `~/ledger/LEDGER.md` before you edit** so you don't duplicate another agent's work. One agent in this checkout at a time; one agent in the Worker bundle at a time. The repo and the Worker are separate files, so one of each can run in parallel.
- **Only Claude (Fable or Opus) merges to `main`** (merging deploys). Codex and Antigravity commit on a branch and stop at "ready to ship". Grok 4.6 (research CLI) never writes to the repo, the Worker, git, Stripe or Cloudflare.
- **Cursor CLI and Grok Build work in their own worktree, never in this tree:** `git worktree add ~/cardology-wt-<agent> -b agent/<agent>-<task> main`. They commit on that branch, never push, never deploy, never touch Stripe, and stop at "ready to merge". Claude merges the PR into `main`, which deploys.
- **Never commit another agent's files.** `git add` your own paths, never `-a`. If the tree has changes you did not make, leave them and say so.
- **Do the task as written;** a deviation goes in your report, not into the code silently.
- **Report shape, every time:** files changed, commands run, verification output, what you did not do. Then stop.

## Slash commands (in `.claude/commands/`)
`/resume` `/whats-live` `/ship` `/growth` `/checkout-check` `/polish <path>`
