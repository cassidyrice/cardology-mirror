# Deploy source of truth — cardblueprints.com

**Last verified: 2026-09-02** (deployed `main` @ `6cdebf7` — Ignore .DS_Store so Finder metadata cannot block a deploy; previous record `cccff2a`)

This file exists because for several weeks the answer to "which branch is live?"
was only obtainable by probing production. Read the WARNING before trusting any
dashboard.

---

## What deploys production

| | |
|---|---|
| Site | https://cardblueprints.com |
| Cloudflare Pages project | `cardology-mirror` |
| **Canonical worktree** | `~/cardology-elroy-qa` |
| **Branch** | `main` |
| **Deployed commit** | `6cdebf7cd3b72c7776e0f1180adff93b313da57c` |
| **Worker** | `cardology-unlock` |
| **Worker version** | `b9f8a4b3-b5b9-4426-9996-1850d67d8ac0` |
| **Worker rollback** | `3661c1c1-c8f3-4bbd-a31c-6908c8af5998` |
| Deploy mode | **direct upload** (not git-connected) |

`~/cardology-elroy-qa` is a *worktree* of `~/cardology-mirror`, not a separate
clone — they share one `.git` and one ref store. `~/cardology-mirror` itself is
scratch: it sits on a stale `wip/` branch with a dirty tree. Never deploy from it.

## The exact deploy command

```sh
cd ~/cardology-elroy-qa
bun run pages:deploy          # → scripts/deploy-production.sh
```

`scripts/deploy-production.sh` enforces: canonical directory, branch allowlist
(`main` / `master` / `release/*` / `hotfix/*`), clean tree, then builds and runs
`wrangler pages deploy .vercel/output/static --project-name cardology-mirror`,
followed by live smoke checks.

Every other worktree has `pages:deploy` replaced by
`scripts/block-production-deploy.sh`, which hard-fails.

---

## ⚠️ WARNING: the Cloudflare dashboard lies about the branch

`scripts/deploy-production.sh` passes a hardcoded `--branch main` on every
deploy (see the `DEPLOY_ARGS` array). Because this is a **direct-upload**
project, that flag is just a label — it is *not* the branch that was built.

**Every production deployment is labeled "main" in the Cloudflare dashboard
regardless of which branch actually shipped.** Through 2026-08-28 production
served `hotfix/deep-dive-cta` while the console said "main"; that branch was
merged to `main` (PR #54) and `main` deployed the same day.

Do not use the dashboard to answer "what is live?". Use the verification below.

---

## How to verify what is actually live

The method: **pick an artifact that exists only in the deployed commit, and
assert it against the live URL.** Two independent artifacts are used, so a
single CDN quirk cannot produce a false pass.

Run the script:

```sh
bash scripts/verify-deploy-source.sh      # exit 0 = production matches the record
```

### Probe 1 — a file that first shipped in a known commit

`public/.well-known/apple-developer-merchantid-domain-association` was added in
`0b60efb` (now on `main`). Any build older than that 404s here — so this probe
catches a rollback or a deploy from a stale branch, not `main` vs a hotfix.

```sh
curl -s -o /dev/null -w "%{http_code}\n" \
  https://cardblueprints.com/.well-known/apple-developer-merchantid-domain-association
# expect: 200
```

Stronger form — compare bytes, not just status:

```sh
curl -s https://cardblueprints.com/.well-known/apple-developer-merchantid-domain-association | shasum -a 256
# expect: 2de7b483319c713bf649352f7f158f1fedbda92f546bebfe576ae0a2d2c526c6
```

That digest is byte-identical to the git blob, which is proof of what the
edge is serving rather than an inference. If the file ever changes, update
`EXPECTED_WELLKNOWN_SHA256` in the script.

### Probe 3 — a file that first shipped in the recorded commit

`public/og/what-is-cardology.png` was added in `ba899e1` (the SEO polish
deploy). Any build older than that 404s here, which pins the deployed commit
far more tightly than probes 1–2 (those only prove ≥ `0b60efb`).

```sh
curl -s https://cardblueprints.com/og/what-is-cardology.png | shasum -a 256
# expect: 3e61589fa956276477af28f202a4b03f7da735b6453be256454573ce666f437d
```

When a future deploy ships a new visitor-facing artifact, rotate this probe to
it (`OG_PATH` / `EXPECTED_OG_SHA256` in the script) — that is what makes the
`DEPLOY_COMMIT` pin an assertion rather than a bookkeeping entry.

### Probe 2 — a response header that changed in a known commit

`public/_headers` was changed in `2837ba5`. Before and after differ:

| Build | `Permissions-Policy` payment directive |
|---|---|
| `2837ba5` and later (incl. `main` today) | `payment=(self "https://js.stripe.com")` |
| anything older | `payment=()` — wallets broken |

```sh
curl -sI https://cardblueprints.com/birth-card-calculator | grep -i permissions-policy
# expect: permissions-policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")
```

If this returns `payment=()`, a pre-`2837ba5` build is live and Apple Pay /
Google Pay are broken in checkout.

---

## When you deploy something new

`scripts/verify-deploy-source.sh` pins the deployed commit and its expected
artifact digest. After an intentional deploy it will fail until you update the
record — that failure is the point. Update, in this file and in the script:

- `DEPLOY_COMMIT` / the **Deployed commit** row above
- `WORKER_VERSION` / `WORKER_ROLLBACK` / the **Worker version** and **Worker rollback** rows
- `EXPECTED_WELLKNOWN_SHA256`, if that file changed
- the **Last verified** date

`bash scripts/record-deploy.sh` writes the Pages commit and the live Worker
version (`npx wrangler deployments list --name cardology-unlock`). Rollback is
the previous distinct version id: `npx wrangler rollback <id> --name cardology-unlock`.
`scripts/verify-deploy-source.sh` exits 0 only if **both** the Pages commit
probes and the live Worker version match the record.

If you change which branch is canonical, update the **Branch** row and the
`DEPLOY_BRANCH` constant too.
