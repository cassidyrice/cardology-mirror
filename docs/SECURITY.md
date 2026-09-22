# Site protection — Card Blueprints / cardology-mirror

Operational security checklist for the production site on Cloudflare Pages.

## Already in code

| Control | Where |
|---|---|
| HTTPS + Cloudflare edge | Cloudflare zone |
| Security headers (HSTS, frame deny, nosniff, referrer, permissions) | `middleware.ts` + `public/_headers` + `lib/security-headers.ts` |
| www → apex | `middleware.ts` |
| Stripe webhook signature verify | `app/api/checkout/webhook/route.ts` |
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

## Later (not yet)

- Strict Content-Security-Policy (must allow Stripe.js + needed inline)  
- Global rate limit via Durable Object / KV (stronger than isolate memory)  
- One-time magic-link tokens if not already enforced server-side

## Checkout session fields fulfilment depends on

Hosted Checkout is created in `app/checkout/[offer]/session/route.ts`. Checkout Studio does not list the fields below. They stay because delivery reads them. `docs/SITE-RECORD.md` is not in this repository, so this is the home for that warning (retired from `STRIPE_INTEGRATION_TODO.md`, 2026-09-22).

- `metadata`, and the copy on `payment_intent_data.metadata` (payment) or `subscription_data.metadata` (subscription), carry the SKU, birthday, and question. The webhook and past-buyer SKU lookup read that metadata. Stripping it breaks delivery.
- `branding_settings` and `customer_creation` (`"always"` on the payment branch) stay as written.
- Leave `custom_text` off the session. Managed Payments rejects it (live error 2026-09-02).
- Leave `ui_mode` out of the route file. The SDK default is hosted Checkout on checkout.stripe.com, and `scripts/calculator-deep-dive.test.ts` asserts the file never contains `ui_mode`.
- `allow_promotion_codes` is `false` on both branches (resolved 2026-09-22, CAR-7). No public promo code exists; the field sends buyers hunting for one.
- The One Question Reading line item uses `deepDivePriceId()` (`lib/deep-dive.ts`), which reads the Pages secret `STRIPE_PRICE_BLUEPRINT_BREAKDOWN`. The public price is $13.
