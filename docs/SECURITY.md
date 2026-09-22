# Site protection — Card Blueprints / cardology-mirror

Operational security checklist for the production site on Cloudflare Pages.

## Already in code

| Control | Where |
|---|---|
| HTTPS + Cloudflare edge | Cloudflare zone |
| Security headers (HSTS, frame deny, nosniff, referrer, permissions) | `middleware.ts` + `public/_headers` + `lib/security-headers.ts` |
| CSP report-only collector | `POST /api/csp-report` — still `Content-Security-Policy-Report-Only`, not enforcing |
| www → apex | `middleware.ts` |
| Stripe webhook signature verify | `app/api/checkout/webhook/route.ts` — the only registered endpoint. `cardology-unlock` `POST /webhook/stripe` stays unregistered; see `docs/SITE-RECORD.md` §3 |
| Checkout origin check | `app/checkout/[offer]/session/route.ts` |
| Soft rate limit on gate + checkout session | `lib/rate-limit.ts` |
| HMAC access tokens | `lib/gate.ts` |
| Production deploy locked to `main` | `scripts/deploy-production.sh` via `package.json` → `pages:deploy` |
| Preview deploys | `package.json` → `pages:deploy:preview` |
| Truth / claim build gate | `bun run test` |

## Deploy safely

```bash
# Production (cardblueprints.com) — only from the canonical tree; forces --branch main
bun run pages:deploy

# Preview only (branch alias, does NOT update production)
bun run pages:build && bun run pages:deploy:preview
```

Never run plain `wrangler pages deploy` from a feature branch if you mean production — without `--branch main` Cloudflare treats the git branch as a **preview**. Production goes through `scripts/deploy-production.sh`, which already passes `--branch main`.

## Cloudflare dashboard (do once)

1. **SSL/TLS** → Full (strict), Always Use HTTPS on  
2. **Security → WAF** → managed rules on  
3. **Security → Bots** → Bot Fight Mode **off** and JS Detections **off** (2026-08-17). Zone-wide `/cdn-cgi/challenge-platform/scripts/jsd/main.js` was the main-thread TBT hit. Replacement: custom WAF managed challenge on `/checkout*` and `/api/session*` when `cf.threat_score gt 14`. Do not re-enable BFM on Free — it re-locks JSD on every HTML page.  
4. **Security → WAF → Rate limiting rules** (recommended hard limits):
   - `/api/*` — 60 requests / minute / IP  
   - `/api/gate` — 10 requests / 10 minutes / IP  
   - `/checkout/*/session` — 20 requests / 10 minutes / IP  
5. **2FA** on Cloudflare, GitHub, Stripe accounts  
6. **GitHub** → protect `main` (no force-push; PR preferred)

## Secrets (Cloudflare Pages → Settings → Environment variables)

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs  
- `GATE_SECRET` (or `CARDOLOGY_GATE_SECRET`)  
- Email / notification keys  

Never commit `.env` files.

## Rollback

Cloudflare Pages → project `cardology-mirror` → Deployments → **Rollback** to last good production ID.

## CSP reports

The header stays `Content-Security-Policy-Report-Only`. Both copies (`lib/security-headers.ts` for middleware and dynamic routes, `public/_headers` for static pages) send `report-uri /api/csp-report`. `report-to` is not set: Chrome 148 then stops sending `report-uri` and did not deliver a Reporting API report in a same-origin probe. The endpoint is not Cloudflare's `Report-To: cf-nel` group. The receiver still accepts `application/reports+json` if a browser sends that shape.

`POST /api/csp-report` accepts `application/csp-report`, `application/json`, and `application/reports+json`. It stores directive, blocked host, and document path. The query string is dropped, so a checkout question does not land in the log. A Stripe, Turnstile, or YouTube block shows up as the blocked host (`js.stripe.com`, `challenges.cloudflare.com`, `www.youtube.com`) on the document path (`/checkout/deep-dive`, `/birth-card-calculator`). An inline or JSON-LD surprise shows up as `blockedHost=inline`.

Workers log line:

```
[csp-report] directive=script-src-elem blockedHost=js.stripe.com documentPath=/checkout/deep-dive disposition=report source=report-uri
```

Read a deployment with `npx wrangler pages deployment tail --project-name cardology-mirror` and look for `[csp-report]`. The same fields are written to Analytics Engine dataset `cardblueprints_csp` (binding `CSP_REPORTS` in `wrangler.toml`) when that binding is on the deployment. Query it with `./scripts/csp-report-query.sh`. It is not the funnel dataset.

The binding starts collecting on the next production deploy. This repo change does not deploy, and it does not rename the header to `Content-Security-Policy`.

## Later (not yet)

- Enforcing Content-Security-Policy. Reports now have a destination; the rename is still its own later change. Finding and the staged plan: `docs/CAR-14-csp.md`.
- Global rate limit via Durable Object / KV (stronger than isolate memory)  
- One-time magic-link tokens if not already enforced server-side

## Checkout session fields fulfilment depends on

Hosted Checkout is created in `app/checkout/[offer]/session/route.ts`. Checkout Studio does not list the fields below. They stay because delivery reads them. This section remains the home for that warning (retired from `STRIPE_INTEGRATION_TODO.md`, 2026-09-22). The unlock Worker webhook decision is in `docs/SITE-RECORD.md` §3. CAR-13 §1.1 palette tracking stays in `docs/CAR-13-palette-migration.md`: the 18 remaps are done, and rules 19–23 stay as paper-shell chrome (D4).

- `metadata`, and the copy on `payment_intent_data.metadata` (payment) or `subscription_data.metadata` (subscription), carry the SKU, birthday, and question. The webhook and past-buyer SKU lookup read that metadata. Stripping it breaks delivery.
- `branding_settings` and `customer_creation` (`"always"` on the payment branch) stay as written.
- Leave `custom_text` off the session. Managed Payments rejects it (live error 2026-09-02).
- Leave `ui_mode` out of the route file. The SDK default is hosted Checkout on checkout.stripe.com, and `scripts/calculator-deep-dive.test.ts` asserts the file never contains `ui_mode`.
- `allow_promotion_codes` is `false` on both branches (resolved 2026-09-22, CAR-7). No public promo code exists; the field sends buyers hunting for one.
- The One Question Reading line item uses `deepDivePriceId()` (`lib/deep-dive.ts`), which reads the Pages secret `STRIPE_PRICE_BLUEPRINT_BREAKDOWN`. The public price is $13.
