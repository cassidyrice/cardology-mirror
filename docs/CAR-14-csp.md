# CAR-14 — Content-Security-Policy, from Report-Only to enforcing

The live header stays `Content-Security-Policy-Report-Only`. Do not rename it in a collector change.

`docs/SITE-RECORD.md` §3 records the unlock Worker webhook decision. The CSP audit claim was checked against `lib/security-headers.ts`, `public/_headers`, and live response headers on cardblueprints.com.

## Step 1 collector (CAR-19)

Both policies now end with `report-uri /api/csp-report`. No other directive changed. The header was not renamed.

`report-to` is not set. In Chrome 148, adding `report-to` (with `Reporting-Endpoints` or the legacy `Report-To` header, relative or absolute) stopped `report-uri` from firing, and no Reporting API POST arrived within several seconds of the violation or after the page closed. `report-uri` alone delivers immediately. Do not add `report-to` until a probe shows Chrome actually POSTing it. Do not point the policy at the Cloudflare `Report-To: cf-nel` group.

`POST /api/csp-report` accepts `application/csp-report` (and `application/json` for older WebKit) and `application/reports+json`, so a later `report-to` sender still has a receiver. It drops the query string and any userinfo. The stored line is directive, blocked host, document path, disposition (`report` or `enforce`), and source (`report-uri` or `report-to`). Script samples and the original policy are not stored.

Workers log:

```
[csp-report] directive=script-src-elem blockedHost=js.stripe.com documentPath=/checkout/deep-dive disposition=report source=report-uri
```

Read a deployment:

```
npx wrangler pages deployment tail --project-name cardology-mirror
```

The same fields go to Analytics Engine dataset `cardblueprints_csp` (wrangler binding `CSP_REPORTS`) when the binding is present. That dataset is separate from `cardblueprints_funnel`, so a violation does not show up as a funnel event. The plan allowed the existing funnel dataset or Workers logs. Workers logs are the always-on copy. The dedicated dataset is the queryable copy, so funnel SQL keeps its column meanings.

```
CF_ACCOUNT_ID=xxx CF_ANALYTICS_TOKEN=yyy ./scripts/csp-report-query.sh
```

Columns: `index1` / `blob1` directive, `blob2` blocked host, `blob3` document path, `blob4` disposition, `blob5` source.

How a blocker looks: `blockedHost=js.stripe.com` or `hooks.stripe.com` on `/checkout/deep-dive` is Stripe. `challenges.cloudflare.com` is Turnstile. `www.youtube.com` on a card or `/videos` page is the embed. `blockedHost=inline` on a card page is an inline script (JSON-LD is a data block and should not appear; if it does, the directive is `script-src-elem`). Static pages still lack `*.posthog.com` and `worker-src`; those gaps are step 2, not this change.

Controlled check, without a deploy: `bun scripts/csp-report-browser.ts`. It serves `/probe` with the real Report-Only header from `lib/security-headers.ts`, loads `https://csp-probe.invalid/blocked.js`, and requires a stored line with `blockedHost=csp-probe.invalid` and `documentPath=/probe`. Verified 2026-09-22 in Chrome 148. The browser POSTed `application/csp-report` and the endpoint stored:

```
[csp-report] directive=script-src-elem blockedHost=csp-probe.invalid documentPath=/probe disposition=report source=report-uri
```

The log line and the dataset binding start on the next production deploy. This change does not deploy and does not flip the header to enforcing.

## Finding

### Reports went nowhere (audit, before CAR-19)

On 2026-09-22 the policy had no `report-uri` and no `report-to`. Checked in both sources and on live responses.

Browsers logged a Report-Only violation in the console of whoever had devtools open. They sent it nowhere. Report-only mode was collecting nothing.

The live `Report-To` header is Cloudflare Network Error Logging (`group` `cf-nel`, endpoint `a.nel.cloudflare.com`). `NEL` on that response has `success_fraction` 0. That group is not referenced by the CSP. It does not receive CSP violations. Do not point the policy at it.

### Two policies are live

`middleware.ts` calls `applySecurityHeaders` from `lib/security-headers.ts`. `next.config.mjs` intentionally sets no `headers()`, because the compiled middleware route wipes config headers. Static HTML is a Pages asset, and `public/_headers` supplies its CSP.

Curled 2026-09-22:

| URL | Who sets the CSP | PostHog in `script-src` / `connect-src` | `worker-src` |
|---|---|---|---|
| `/birth-card-calculator` | `public/_headers` (also `cache-control: public, max-age=0, s-maxage=86400`) | no | absent |
| `/card-of-the-day`, `/checkout/deep-dive`, `/products/one-question-reading`, `/api/checkout/webhook` | `lib/security-headers.ts` | `https://*.posthog.com` | `'self' blob: data:` |

Both copies are Report-Only, and both include `'unsafe-inline'` and `'unsafe-eval'`. They are not the same policy. A later edit has to land in both files or static pages and checkout will enforce different rules.

`/born-on` and `/compatibility` are the other Worker. This finding does not cover them.

### `'unsafe-eval'` is a dev requirement, shipped in production

Next.js documents this on the App Router CSP guide: in development, `'unsafe-eval'` is required because React uses `eval` to reconstruct server-side error stacks. It is not required in production. Neither React nor Next.js use `eval` in production by default.

cardblueprints.com sends the production header. `next dev` never does. The production directive is unconditional in both copies anyway.

This site does not load a GTM container. After consent, `components/analytics/GoogleAnalyticsBoundary.tsx` loads `gtag/js` from `www.googletagmanager.com` and an inline bootstrap (`id="ga4-bootstrap"`). `posthog-js` is bundled (`import posthog from "posthog-js"` in `PostHogBoundary`), with session recording and surveys disabled. Whether those libraries call `eval` in practice is a report-stream question, not a reason to keep the keyword inside the flip.

### A nonce is not practical here

Next.js applies a nonce during rendering, by reading the CSP on the request. Static pages are generated at build time, when no request exists, so no nonce is injected. Using nonces means dynamic rendering on every page, and the HTML must not sit in a shared cache (`Cache-Control: no-store`).

This stack does the opposite. `@cloudflare/next-on-pages` (1.13.16) prerenders pages into static assets. `public/_headers` caches those SEO responses for a day (`s-maxage=86400`). Live proof is `/birth-card-calculator`: cached, and carrying the static `_headers` policy rather than a per-request header. A middleware nonce cannot rewrite that HTML. Forcing `connection()` or `force-dynamic` sitewide to make a nonce stick would drop that cache.

JSON-LD does not need one. `script-src` applies to scripts the browser will execute. `type="application/ld+json"` is a data block (layout, `SeoShell` breadcrumbs, card pages). A nonce on those tags is not what removes `'unsafe-inline'`.

The inline scripts that do require `'unsafe-inline'` or a nonce are Next's own bootstrap and the consent-gated GA4 snippet. `style-src 'unsafe-inline'` is also load-bearing: `app/playing-card-spreads/page.tsx` injects a `<style>` tag. Experimental SRI hashes external files at build time and does not cover those inline blocks.

Do not plan a nonce on this stack.

### What enforcing would actually buy

With `'unsafe-inline'` left in place, an enforcing policy still applies `default-src`, `object-src 'none'`, `base-uri`, `frame-ancestors`, `form-action` (Stripe and Buttondown), and the script host list. It does not stop an injected inline script. That is the gain, and the limit.

Two gaps are already visible in code, on the policy a flip would lock in:

- `components/seo/VideoEmbed.tsx` sets the iframe to `https://www.youtube.com/embed/…` after click. `frame-src` allows Cloudflare Turnstile and Stripe only. Thumbnails (`i.ytimg.com`, `img.youtube.com`) are already allowed.
- PostHog runs from the root layout, host `https://us.i.posthog.com`. The static `_headers` policy does not allow `*.posthog.com`. The worker policy does. Consent-on analytics on a cached SEO page would be blocked by a flip of `_headers` as it stands.

Hosted Checkout posts to `checkout.stripe.com`, which `form-action` already allows. `script-src` does not list `js.stripe.com`; `frame-src` does. Confirm Stripe with the report stream before a flip. Breaking CSP breaks checkout.

## Staged plan

Each step is its own change. Step 4 is the only step that renames the header, and that commit contains the rename alone.

1. **Collect reports, still Report-Only.** Done in CAR-19. Same-origin `POST /api/csp-report` accepts `application/csp-report` and `application/reports+json`, drops query strings, and stores a short redacted line (directive, blocked host, document path) in Workers logs and dataset `cardblueprints_csp`. Both Report-Only policies include `report-uri /api/csp-report`. `report-to` is intentionally absent: in Chrome 148 it suppressed `report-uri` and did not deliver a report. No other directive changed. The header was not renamed.

2. **Read the stream, then patch the allowlist, still Report-Only.** Cover `/birth-card-calculator`, a birth-card page after pressing play on a video, `/videos`, `/products/one-question-reading`, `/checkout/deep-dive` through hosted Checkout and back, and one page with analytics consent granted. Expect the YouTube frame and the static-page PostHog gaps above. Bring `lib/security-headers.ts` and `public/_headers` onto one directive list in that change. Leave the header name as Report-Only.

3. **Drop `'unsafe-eval'` from both Report-Only policies, in its own change.** Production Next.js does not need it. If the new reports show an `eval` violation from gtag or PostHog, restore the keyword in its own follow-up and name the source. Do not do this in the flip.

4. **Flip. This step is only the rename.** In one commit, in both files, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy`. No directive edits, no endpoint edits, no `'unsafe-eval'` edit, no nonce. Do it only after step 2 is quiet on checkout, the calculator, a card page, a video play, and consent-on analytics, and after step 3 has already settled. After deploy, walk one real checkout before calling it done. Rollback is the Pages deployment rollback.

Nonce work is not a step in this sequence.
