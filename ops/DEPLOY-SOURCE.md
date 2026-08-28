# Deploy source of truth — cardblueprints.com

**Last verified: 2026-08-28**

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
| **Branch** | `hotfix/deep-dive-cta` |
| **Deployed commit** | `0b60efbebe85ad7f25fb9ed38a7f994f35f95b2b` |
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
regardless of which branch actually shipped.** Production has been serving
`hotfix/deep-dive-cta` while the console said "main".

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

### Probe 1 — a file that exists only in the deployed commit

`public/.well-known/apple-developer-merchantid-domain-association` was added in
`0b60efb` and is **absent from `main`**. If `main` were live, this 404s.

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

That digest is byte-identical to the blob in `0b60efb`, which is proof of the
serving commit rather than an inference.

### Probe 2 — a response header that differs between branches

`public/_headers` was changed in `2837ba5` (HEAD−1). The two branches differ:

| Branch | `Permissions-Policy` payment directive |
|---|---|
| deployed (`hotfix/deep-dive-cta`) | `payment=(self "https://js.stripe.com")` |
| `main` | `payment=()` — wallets broken |

```sh
curl -sI https://cardblueprints.com/birth-card-calculator | grep -i permissions-policy
# expect: permissions-policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")
```

If this returns `payment=()`, something deployed `main` and Apple Pay / Google
Pay are broken in checkout.

---

## When you deploy something new

`scripts/verify-deploy-source.sh` pins the deployed commit and its expected
artifact digest. After an intentional deploy it will fail until you update the
record — that failure is the point. Update, in this file and in the script:

- `DEPLOY_COMMIT` / the **Deployed commit** row above
- `EXPECTED_WELLKNOWN_SHA256`, if that file changed
- the **Last verified** date

If you change which branch is canonical, update the **Branch** row and the
`DEPLOY_BRANCH` constant too.
