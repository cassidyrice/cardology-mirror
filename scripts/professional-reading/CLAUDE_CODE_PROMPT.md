You are working in ~/cardology-elroy-qa, a git worktree of ~/cardblueprints-authority-20260917. This is cardblueprints.com: Next.js on Cloudflare Pages (wrangler.toml name: cardology-mirror), Stripe checkout. Read CLAUDE.md, AGENTS.md and DEPLOY.md before touching anything.

## Set these first
- CONSULT_PRICE = $297  (22-page Blueprint Report + 45-minute live consultation with Cass)
- REPORT_PRICE  = $129  (report only)
- CONSULT_BOOKING_URL = grep the repo for "cal.com" and reuse the existing 45-minute booking link if there is one. The event type MUST NOT have Cal.com payment enabled (the buyer already paid on our Stripe). If the only 45-minute event has Stripe attached, tell Cass to duplicate it as a free "Blueprint consultation (prepaid)" event and stop until he gives you that link.

## Situation
A Cowork session already left UNCOMMITTED, UNEXECUTED changes in this worktree (that shell had no bun). Your first job is to verify them, then finish the offer, then ship. Start with:
  git status --short && git diff --stat
Then read scripts/professional-reading/HANDOFF.md, section "2026-09-20 · Blueprint Report ($129)". It lists every changed file and a checklist. Treat it as the spec for what already exists.

What is there: the 22-page report renderer (scripts/professional-reading/render.ts, restyled to the site's blueprint palette, with two new final pages "Where your card comes from" and "Deal it yourself"); product `blueprint-report` in lib/products.ts; app/report/route.ts serving the rendered report for a signed report token; a redirect branch in app/blueprint/page.tsx; components/checkout/ReportCheckoutButton.tsx; app/products/blueprint-report/page.tsx; and the calculator result + /your-year CTAs swapped to the report.

## The offer (what we are actually selling)
Two tiers on one product page:
1. FEATURED: report + consultation, CONSULT_PRICE. The 22-page report, then a 45-minute live reading with Cass booked on Cal.com after purchase.
2. Report only, REPORT_PRICE.
The headline value is the LAST TWO PAGES of the report: the derivation of the buyer's own card worked for their birthday, and the exact procedure for dealing every board by hand with a real deck (already verified against the engine for all 90 spreads). Lead every line of copy with: the math shown, deal it yourself, then talk it through with Cass. Nothing may claim prediction. Keep the FIXED / PATTERN / YOURS framing the report already uses. Say "no model writes it," never "no AI was involved."

## Do this in order. If a step fails, stop and report. Never skip a failing test.

1. Verify the existing work: `bun test scripts/professional-reading/`. Fix forward. builder.test.ts:142 (board cells) is the assertion most likely touched by the new cardHtml() helper.

2. Fix the token slug. In app/api/checkout/webhook/route.ts the instant-report branch calls mintReportToken(email, product.slug, ...). Change it to product.reportSlug so both report tiers mint the same document slug `blueprint-report`. Confirm personal-card-blueprint's reportSlug equals its slug so legacy tokens are unaffected.

3. Add the consultation tier:
   - lib/products.ts: second `instant_report` entry, slug `blueprint-report-consult`, stripePriceEnv `STRIPE_PRICE_BLUEPRINT_REPORT_CONSULT` (add to the StripePriceEnv union), reportSlug `blueprint-report`, price CONSULT_PRICE, badge "Featured", plus an optional field on InstantReportOffer: `consultation?: { minutes: number; bookingUrl: string }`. Put it FIRST in INSTANT_REPORT_PRODUCTS.
   - lib/analytics.ts: allowlist `blueprint-report-consult` in OFFER_SLUGS.
   - webhook instant-report branch: when product.consultation is set, (a) add the booking link and two lines on how the call works to the buyer email, and (b) send Cass an intake email through the existing sendIntakeEmail with buyer email, birthdate, session id, and "confirm the 45-minute consult." Do not touch the $13 One Question Reading path.
   - components/checkout/ReportCheckoutButton.tsx: add a `slug` prop (default `blueprint-report`) so one button serves both tiers; the review path is /checkout/<slug>.
   - app/products/blueprint-report/page.tsx: two-tier layout, consultation tier first and visually primary, report-only second. Keep the FAQ and JSON-LD; represent both tiers (two Products, or one Product with two Offers, whichever lib/product-schema.ts supports cleanly).
   - Calculator result (components/seo/BirthCardCalculator.tsx) and /your-year (components/seo/YourYearView.tsx): primary button = consultation tier, secondary text link = report only, tertiary text link = the $13 One Question Reading (already there).

4. Sample images of the two pages we are selling. If scripts/professional-reading/cli.ts can produce a PDF locally (cli.test.ts expects one), generate the report for name "Cass", birthdate 1991-02-17, reading date today; rasterize pages 20 and 21 to PNG at 2x; save under public/brand/ as report-page-20.png and report-page-21.png; show them on the product page above the fold with alt text. If the CLI cannot render locally, skip this step and say so.

5. Retire the old $13 instant report `personal-card-blueprint`: keep its object (legacy tokens still open through /blueprint) but exclude it from PUBLIC_PRODUCTS. Make scripts/validate-public-truth.ts and the product-schema tests pass with that change.

6. Stripe: the Card Blueprint account, NOT Cassidy Rice Company (see the comment at the top of lib/deep-dive.ts). If the `stripe` CLI is installed and logged in to that account, create product "Blueprint Report" with a one-time price of REPORT_PRICE and product "Blueprint Report + Consultation" with a one-time price of CONSULT_PRICE. Print both price ids. If the CLI is unavailable, stop and print exact dashboard steps; never guess an id.

7. Cloudflare Pages secrets on project cardology-mirror, preview AND production: STRIPE_PRICE_BLUEPRINT_REPORT and STRIPE_PRICE_BLUEPRINT_REPORT_CONSULT via `wrangler pages secret put`. The session route returns 503 without them; that is intended.

8. `bun run test` (full suite) and the build DEPLOY.md specifies. Fix forward. Known risk: app/report/route.ts is an edge route importing from scripts/professional-reading/, which tsconfig "include" excludes. If the edge bundle rejects it, move builder.ts and render.ts (and their tests) to lib/professional-reading/ and repoint the CLI and the route.

9. Commit on a branch named blueprint-report-launch with a message listing both tiers and prices. Deploy exactly as DEPLOY.md describes and respect the deploy-lock test. Do not invent a deploy path.

10. After deploy, put ONE real payment through the report-only tier on production (Cass will refund it). Confirm: the receipt email has a /blueprint?token= link; it redirects to /report; 22 pages render; pages 21 and 22 are "Where your card comes from" and "Deal it yourself"; Save as PDF gives clean A4. Then one real payment on the consultation tier: confirm the buyer email contains the booking link and Cass received the intake email.

11. Report back with: both price ids, branch and commit, deploy URL, and the result of both test payments. If anything failed, name the step and paste what you saw.

## Rules
- No hardcoded Stripe ids as fallbacks. Env or 503.
- Never put a birthday in a URL. The report token carries it signed.
- No em dashes in any copy you write. Plain words, short sentences.
- Reading date is pinned to the purchase date so the same link always yields the same document. Keep that.
- Cover name comes from the Stripe billing name (fallback "Reader"). If time allows, add an optional "Name on the cover" field to the review page for both report tiers and pass it as session metadata cover_name; app/report/route.ts already reads it.
