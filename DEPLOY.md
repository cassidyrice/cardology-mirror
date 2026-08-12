# Production deploy policy (cardblueprints.com)

## Canonical source

| Item | Value |
| --- | --- |
| Site | https://cardblueprints.com |
| Pages project | `cardology-mirror` |
| **Only deploy from** | `~/cardology-elroy-qa` |
| Command | `bun run pages:deploy` |

Pushing to GitHub does **not** deploy. Production is always:

```bash
cd ~/cardology-elroy-qa
bun run pages:deploy   # build + guarded wrangler deploy + smoke
```

## Blocked trees

These trees hard-fail `pages:deploy` so they cannot overwrite production:

- `~/cardology-mirror`
- `~/cardology-blog-cron`

Use them for local work or content generation only.

## What the guard enforces

`scripts/deploy-production.sh`:

1. Must run from directory named `cardology-elroy-qa`
2. Git branch must be `main`, `master`, `release/*`, or `hotfix/*`
3. Working tree must be **clean** (no uncommitted changes)
4. Runs `bun run build` + `bun run pages:build`
5. Refuses artifacts that still contain Turnstile client assets
6. Deploys with explicit `--commit-hash` (no silent dirty deploys by default)
7. Smokes live Elroy API (no Turnstile), homepage title, sitemap products, HSTS

## Escape hatches (emergency only)

```bash
ALLOW_DIRTY=1 bun run pages:deploy   # dirty tree (still marked dirty in CF)
ALLOW_BRANCH=1 bun run pages:deploy  # non-allowlisted branch
SKIP_BUILD=1 bun run pages:deploy    # reuse .vercel/output/static
SKIP_SMOKE=1 bun run pages:deploy    # skip live checks
```

Prefer fixing the tree over using escape hatches.

## Daily blog

`ship:daily-blog` should run from **cardology-elroy-qa** only. After it commits the post, `pages:deploy` uses the guarded script.

If cron still points at `cardology-blog-cron` or `cardology-mirror`, production deploy will fail by design — update the cron cwd to `cardology-elroy-qa`.

## After a bad overwrite

```bash
cd ~/cardology-elroy-qa
git status   # clean, correct branch
bun run pages:deploy
# confirm Elroy: POST /api/elroy/micro-reading → 200 without turnstileToken
```

## Elroy email (Resend)

Elroy always shows the reading in chat. Email is best-effort (`emailSent` true/false).

| Symptom | Cause | Fix |
| --- | --- | --- |
| `emailSent: false`, `emailErrorHint` contains "only send testing emails to your own" | **No verified domain** in Resend | Verify `cardblueprints.com` (or `cardologypro.com`) at [resend.com/domains](https://resend.com/domains), then set `INTAKE_FROM_EMAIL` to `Card Blueprints <hello@that-domain>` and redeploy |
| `emailSent: false`, `not_configured` | Missing `RESEND_API_KEY` or `INTAKE_FROM_EMAIL` Pages secrets | `wrangler pages secret put …` then redeploy |
| `emailSent: true` only for your Gmail, not visitors | Still on `onboarding@resend.dev` test sender | Same as domain verify above |

Current temporary from (until domain is verified):

```bash
printf '%s' 'Card Blueprints <onboarding@resend.dev>' | \
  npx wrangler pages secret put INTAKE_FROM_EMAIL --project-name cardology-mirror
# then: cd ~/cardology-elroy-qa && bun run pages:deploy
```

That test sender **only** delivers to the Resend account owner email.