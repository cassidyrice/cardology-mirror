# Site protection — Card Blueprints / cardology-mirror

Operational security checklist for the production site on Cloudflare Pages.

## Already in code

| Control | Where |
|---|---|
| HTTPS + Cloudflare edge | Cloudflare zone |
| Security headers (HSTS, frame deny, nosniff, referrer, permissions) | `middleware.ts` + `public/_headers` |
| www → apex | `middleware.ts` |
| Stripe webhook signature verify | `app/api/checkout/webhook/route.ts` |
| Checkout origin check | `app/checkout/[offer]/session/route.ts` |
| Soft rate limit on gate + checkout session | `lib/rate-limit.ts` |
| HMAC access tokens | `lib/gate.ts` |
| Production deploy locked to `main` | `package.json` → `pages:deploy` |
| Preview deploys | `package.json` → `pages:deploy:preview` |
| Truth / claim build gate | `bun run test` |

## Deploy safely

```bash
# Production (cardblueprints.com)
bun run pages:build && bun run pages:deploy

# Preview only (branch alias, does NOT update production)
bun run pages:build && bun run pages:deploy:preview
```

Never run plain `wrangler pages deploy` from a feature branch if you mean production — without `--branch main` Cloudflare treats the git branch as a **preview**.

## Cloudflare dashboard (do once)

1. **SSL/TLS** → Full (strict), Always Use HTTPS on  
2. **Security → WAF** → managed rules on  
3. **Security → Bots** → Bot Fight Mode on (watch calculator false positives)  
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
