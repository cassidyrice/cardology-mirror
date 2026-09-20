# Professional reading builder — verified

Spec: `/Users/main/cardblueprints-ops/plans/professional-reading-builder-2026-09-19.md`.
Implementation is contained in `scripts/professional-reading/`. Nothing was pushed or deployed; checkout, prices, the engine, secrets, and customer data were untouched.

## Final verification

- Independent final review: **passed** with no security concerns or logic errors.
- Focused tool suite: **17 pass, 0 fail, 3026 assertions**.
- Cardology authority suite: **38 pass, 0 fail, 5894 assertions**.
- Project TypeScript and explicit strict tool TypeScript: **pass**.
- Full `bun run test`: **pass**, including local D1 concurrency verification.
- Cass fixture: `1991-02-17` on `2026-09-01`; age 35; Birth Card 8♦; PRC 5♣; Long Range Q♠; annual Environment K♣; annual Displacement 3♠.
- Final Cass PDF: `/Users/main/cardblueprints-ops/outputs/professional-reading-builder-2026-09-19/cass-age-35-final/reading.pdf`.
- Chromium probe: **20 page sections, 4 exact 52-card boards, no external requests, no overflow or footer overlap**.
- PyMuPDF: **20 pages; all nine planetary/result glyphs and the footer appear on every page**.
- Full-resolution visual checks: cover, annual walk, board diagrams, references, and final 60-character-name stress cover are clean.
- Accepted 60-character unbroken name: real PDF generated and Chromium A4 probe passed after compact-cover styling.
- Year-9999 boundary, every PRC including three-card dates, Fixed cards, leap days, projections, exact repeats, annual badge seats, private paths, symlink aliases, and no-clobber behavior have regression coverage.

## Boundaries

This is a private deterministic preparation tool for Cass's $199 concierge reading. It does not call a model, publish a product, send a report, or replace Cass's personal review. Client outputs are rejected inside the Git worktree except the ignored `private-sample/` subtree; external private output paths are allowed.

## Changes

- render.ts: Environment only on the annual board; Displacement only on spread 0. Both remain on the deduplicated board when annual index is 0.
- builder.test.ts: explicit assertions for every board, anchor and annual badge, including exact seats and ages 0 and 90.
- private-output.ts, cli.ts, cli.test.ts, private-output.test.ts: reject app/, public/, .git/, .next/, .vercel/ and out/ destinations, including resolved symlink aliases and nonexistent descendants. Check before creating output.
- probe.ts, probe.test.ts: require a fresh 0700 evidence directory before browser launch; JSON, PNG and PDF writes use exclusive creation (wx), mode 0600. Existing evidence is never overwritten.
- README.md and this handoff: current safety behavior and verification.

## Witnessed strict RED / GREEN

Each failing test ran before its corresponding production fix. Excerpts below preserve the actual assertion output and summary counts; timing and stack traces omitted.

1. `bun test scripts/professional-reading/builder.test.ts -t 'annual badges'`

RED, exit 1:
```text
error: expect(received).toEqual(expected)

- []
+ [
+   "K♣",
+ ]

 0 pass
 7 filtered out
 1 fail
 1 expect() calls
```

GREEN, exit 0:
```text
 1 pass
 7 filtered out
 0 fail
 36 expect() calls
```

2. `bun test scripts/professional-reading/cli.test.ts -t 'rejects resolved'`

RED, exit 1:
```text
error: expect(received).toContain(expected)

Expected to contain: "Private output destination is forbidden"
Received: "EEXIST: file already exists, mkdir '/Users/main/cardology-elroy-qa/app/page.tsx'\n"

 0 pass
 2 filtered out
 1 fail
 2 expect() calls
```

The test used existing files so the unfixed command failed without creating files in forbidden roots.

GREEN, exit 0:
```text
 1 pass
 2 filtered out
 0 fail
 6 expect() calls
```

3. `bun test scripts/professional-reading/probe.test.ts`

RED, exit 1:
```text
error: expect(received).toContain(expected)

Expected to contain: "EEXIST"
```
Instead, the probe tried launching Chromium and received `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.6347: Permission denied (1100)`. The sentinel evidence remained unchanged.

```text
 0 pass
 1 fail
 3 expect() calls
```

GREEN, exit 0:
```text
 1 pass
 0 fail
 3 expect() calls
```

## Post-fix verification actually run

- `bun test scripts/professional-reading`: exit 0.
```text
 13 pass
 0 fail
 2993 expect() calls
Ran 13 tests across 4 files. [1145.00ms]
```
- `bun run test:cardology`: exit 0.
```text
 38 pass
 0 fail
 5894 expect() calls
Ran 38 tests across 3 files. [34.00ms]
```
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 0, no output.
- `./node_modules/.bin/tsc --noEmit --strict --target ES2023 --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop --skipLibCheck --types node scripts/professional-reading/builder.ts scripts/professional-reading/render.ts scripts/professional-reading/cli.ts scripts/professional-reading/probe.ts`: exit 0, no output. The imported private-output.ts is included.

## Remaining limits

Post-fix Chromium/PDF/visual verification was not completed: Chromium cannot launch in this sandbox. The focused PDF test exercised the honest HTML-only fallback. Regenerate Cass into a fresh private output directory and rerun the probe in the parent session before treating the revised PDF as visually verified. Existing parent evidence was not overwritten.

Full `bun run test` was not rerun during this bounded fix; its successful local D1 result above is the supplied parent pre-fix result. No engine, checkout, price, secret, external-system or queue edits. No staging, commit, push or deployment.


## Second-fix changes and witnessed RED/GREEN

Changed files: builder.ts, builder.test.ts, private-output.ts, private-output.test.ts, README.md, HANDOFF.md. All are under scripts/professional-reading/. No renderer/CSS change was necessary: the existing unbroken-name wrapping remains; validation now caps names at the reviewed 60-character boundary.

- Date formatting retains the full ISO date component, including +010000-02-16. Active period uses UTC timestamps. Four-digit input validation through 9999 is unchanged.
- Client names accept 60 characters and reject 61.
- Private destinations reject the whole worktree except private-sample and its descendants, on both lexical and canonical paths. Tests cover root, scripts, docs, lib, prefix lookalikes, missing descendants, outside paths, and symlink aliases. Existing forbidden-root tests remain.

Each RED ran before its corresponding implementation. Exact assertion/summary excerpts follow (returned report dump, stack traces and timings omitted).

`bun test scripts/professional-reading/builder.test.ts -t 'year 9999'`

RED exit 1:
```text
error: expect(received).toBe(expected)

Expected: "+010000-02-16"
Received: "+010000-02"

 0 pass
 8 filtered out
 1 fail
 1 expect() calls
```
GREEN exit 0:
```text
 1 pass
 8 filtered out
 0 fail
 15 expect() calls
```

`bun test scripts/professional-reading/builder.test.ts -t 'client name'`

RED exit 1:
```text
error: expect(received).toThrow(expected)

Expected substring: "Client name must be 1 to 60 characters"

Received function did not throw
```
```text
 0 pass
 9 filtered out
 1 fail
 3 expect() calls
```
GREEN exit 0:
```text
 1 pass
 9 filtered out
 0 fail
 3 expect() calls
```

`bun test scripts/professional-reading/private-output.test.ts -t 'worktree destinations'`

RED exit 1:
```text
Expected promise that rejects
Received promise that resolved: Promise { <resolved> }

 0 pass
 1 filtered out
 1 fail
 1 expect() calls
```
GREEN exit 0:
```text
 1 pass
 1 filtered out
 0 fail
 11 expect() calls
```

Second-fix regression commands:

- `bun test scripts/professional-reading`: exit 0.
```text
 16 pass
 0 fail
 3022 expect() calls
Ran 16 tests across 4 files. [1191.00ms]
```
- `bun run test:cardology`: exit 0, 38 pass, 0 fail, 5894 expect() calls.
- Explicit strict TypeScript command documented above: exit 0, no output.
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 0, no output.
- `bun run test`: did not pass. It reached the local D1 integration after the mocked fulfillment checks passed, then reported `error: Failed to start server. Is port 0 in use?` and stalled. Interrupted with Ctrl-C; final output: `error: script "test:fulfillment" exited with code 130` and `error: script "test" exited with code 130`. The earlier parent full-suite success is historical, not a second-fix pass.
- A direct in-memory Chromium A4 cover probe using 60 unbroken W characters could not launch: `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.8725: Permission denied (1100)`. The focused CLI PDF test therefore exercised the HTML-only fallback.

No staging, commit, push, deploy, engine/checkout/price/secret/external-system edits, or queue edits. The user's narrower directory-only scope overrides the standing external queue-edit instruction. Parent evidence was read only and not overwritten.

## 2026-09-20 · Blueprint Report: $297 report + consultation, $129 report only

Verified 2026-09-20 in Claude Code: `bun test scripts/professional-reading/` 17 pass;
`bun run test` full chain green; `bun test scripts/product-schema.test.ts
scripts/calculator-deep-dive.test.ts` green; `next build` + `next-on-pages` exit 0 with
`/report` bundled as an edge function (no move to lib/ needed). Stripe (Card Blueprint,
live): `price_1UHfDgChx1yAVyrsqF4NHpAZ` ($129), `price_1UHfDhChx1yAVyrsZM6w25gc` ($297).
Pages secrets `STRIPE_PRICE_BLUEPRINT_REPORT` and `STRIPE_PRICE_BLUEPRINT_REPORT_CONSULT`
set on production and preview. Sample PNGs of pages 20 and 21 in `public/brand/`.
Open: `CONSULT_BOOKING_URL` in `lib/blueprint-report.ts` is empty until Cass supplies a
free Cal.com event; the webhook tells the buyer the link follows and flags Cass.

Original Cowork notes follow; the checklist items are now done except the real payments.

**What changed**
- `render.ts`: palette moved to the site's blueprint tokens (paper #eef3f8, ink #123a63,
  bronze #735624, dark #0a3159), Iowan serif + system sans, suit colors via `cardHtml()`
  (#8e321f red / #14110d black, matching `lib/cards.ts`). Two new pages before References:
  "Where your card comes from" (solar value, worked for the buyer) and "Deal it yourself"
  (Cass's hand procedure; verified in Python against `P` for all 90 spreads, cycle closes,
  fixed J♥ 8♣ K♠, pairs 2♥↔A♣ and 9♥↔7♦). 20 pages → 22.
- `builder.test.ts`: the three hex assertions now expect the new tokens.
- `lib/blueprint-report.ts` (new): slug `blueprint-report`, $129, paths, price env.
- `lib/products.ts`: `STRIPE_PRICE_BLUEPRINT_REPORT` in the env union; new `instant_report`
  entry first in `INSTANT_REPORT_PRODUCTS` (so it is public + checkout-able).
- `lib/analytics.ts`: `blueprint-report` allowlisted in `OFFER_SLUGS` (events were dropped otherwise).
- `app/report/route.ts` (new, edge): `GET /report?token=` verifies the report token, pulls cover
  name + purchase date from the Stripe session (fallbacks: "Reader", today), returns
  `renderReport(buildProfessionalReading(...))` as text/html, no-store, noindex.
- `app/blueprint/page.tsx`: tokens with slug `blueprint-report` redirect to `/report?token=`.
- `app/api/checkout/webhook/route.ts`: instant-report email subject uses `product.name`.
- `components/checkout/ReportCheckoutButton.tsx` (new): stores birthdate, tracks
  `offer_cta_clicked`, pushes to `/checkout/blueprint-report` (generic review page).
- `components/seo/BirthCardCalculator.tsx`: result card now leads with the report; the $13
  One Question Reading is a secondary text link.
- `components/seo/YourYearView.tsx`: top CTA is the report; the lower `DeepDiveCta` stays.
- `app/products/blueprint-report/page.tsx` (new): product page with FAQ + Product JSON-LD.

**Checklist before deploy**
1. Stripe (Card Blueprint account): create product "Blueprint Report", one-time price $129.
2. Cloudflare Pages secret `STRIPE_PRICE_BLUEPRINT_REPORT` = that price id (preview + production).
   The session route fails closed (503) without it.
3. `bun test scripts/professional-reading/` — expect `builder.test.ts:142` (board cells) to be
   the one assertion `cardHtml()` could plausibly touch.
4. `bun run test` (full suite) — `validate-public-truth.ts` and the product-schema tests may
   need the new slug/price registered; fix forward, do not skip.
5. `next build` — `app/report/route.ts` imports from `scripts/` (excluded in tsconfig
   `include` but still compiled as an import). If the edge bundle rejects the engine import,
   move builder/render under `lib/professional-reading/` and repoint both imports.
6. One real $129 payment → confirm email arrives with a `/blueprint?token=` link → link
   redirects to `/report` → 22 pages render → `SELECT * FROM reading_orders` is NOT expected
   to have a row (instant reports mint tokens; they do not write that table).
7. Decide `personal-card-blueprint` ($13 instant report): it is still in `PUBLIC_PRODUCTS`.
   Retire or keep; it now sits next to the $129 in every product list.

**Known gaps**
- No PDF attachment; buyers print to PDF from the page (A4 @page rules are in the renderer).
- Cover name comes from Stripe billing name. A "name on the cover" field on the review
  page (metadata `cover_name`, already read by the route) would be better.
- The two derivation pages on the design canvas use Montserrat; the report's CSP has no
  `font-src`, so the rendered document uses the system sans instead.
