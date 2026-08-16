# Keyword Strategy SEO Integrity Design

**Date:** 2026-08-16

**Status:** Approved in conversation; awaiting review of this written specification

**Project:** Card Blueprints (`cardblueprints.com`)

**Repository:** `cardology-mirror`

## 1. Summary

Implement the remaining high-confidence opportunities from `cardblueprints_com_-_keyword_strategy.xlsx` in the maintainable Next.js application. Current `main` already contains substantial August 16 SEO work, so this pass will strengthen discovery, internal linking, structured data, sitemap accuracy, and mobile conversion without duplicating recent changes or adding content for malformed keyword clusters.

The separate Cloudflare Worker that serves `/born-on/*` and `/compatibility/*` will not be patched or deployed. The Next.js application may link to and contract-test those public routes, but the recovered Worker bundle is not maintainable source code.

## 2. Evidence and input boundary

The workbook contains 1,183 recommendation rows:

- rows 2–528 contain 527 keyword recommendations mapped to 170 valid Card Blueprints URLs;
- rows 529–1184 contain the literal value `5` in both the URL and description columns and mix broad tarot, zodiac, greeting-card, and cardology queries across 74 unassigned clusters.

Only the mapped rows are implementation inputs. The malformed rows may inform future research after manual re-clustering, but they will not create pages, change titles, or broaden product scope in this pass.

Current `main` at design time is commit `4054d55`. It already covers the workbook's primary calculator, compatibility, card-of-the-day, spreads, how-to-read, 52-card astrology, card-meaning, and birthday-library topics. The design therefore targets remaining gaps instead of repeating those optimizations.

## 3. Goals

1. Make sitemap modification dates truthful and testable.
2. Turn calculator results into direct crawlable paths to the corresponding Worker-rendered birthday and compatibility pages.
3. Promote high-confidence Queen of Hearts and Queen of Clubs opportunities from the card-meaning hub.
4. Improve global discovery of the how-to-read guide and compatibility library.
5. Make breadcrumb and page-type structured data consistent across core SEO pages.
6. Prevent the Elroy teaser from covering conversion content on small mobile screens.
7. Add regression coverage for the Next.js-to-Worker route contract without modifying the Worker bundle.
8. Preserve the existing design system, product truth, canonical URLs, and deterministic card calculations.

## 4. Non-goals

This pass will not:

- create pages from the workbook's malformed or unassigned clusters;
- build a tarot calculator or claim that Cardology is tarot;
- rewrite pages whose recent SEO work already satisfies the mapped recommendation;
- change the card calculation, ruling-card calculation, or compatibility interpretation;
- patch, reverse-engineer, or deploy the recovered Cloudflare Worker bundle;
- change Stripe, checkout, fulfillment, analytics payloads, or pricing;
- redesign the site or introduce a new visual system;
- push to GitHub or deploy to Cloudflare without a separate user instruction.

## 5. Architecture and ownership

The Next.js application remains the source of truth for core pages, calculators, shared navigation, structured-data helpers, and the application sitemap. The public Worker remains the source of truth for:

- 366 `/born-on/{month-day}` pages plus the directory;
- 52 compatibility card hubs;
- 1,378 canonical compatibility pair pages;
- the birthday and compatibility sitemaps.

Pure URL helpers will define the boundary between the two systems. Client calculators will render plain, crawlable anchors only after a valid result exists. Tests will exhaustively validate generated slugs and canonical pair ordering locally, then a small opt-in production contract check will confirm representative Worker routes.

## 6. Detailed design

### 6.1 Truthful sitemap metadata

Replace the blanket `CORE_UPDATED = "2026-07-12"` behavior in `app/sitemap.ts` with explicit update metadata:

- maintain a small per-path date map populated from the repository's actual August 15–16 content commits;
- assign `2026-08-15` to the 52 card-meaning pages for their shared all-card content update;
- keep stable dates for unchanged pages rather than setting every route to the implementation date;
- continue excluding Worker-owned `/born-on/*` and `/compatibility/*` URLs from the application sitemap;
- preserve unique URLs and absolute canonical locations;
- omit `changeFrequency` or `priority` values if they cannot be maintained truthfully.

Dates will use valid ISO `YYYY-MM-DD` values and be easy to update alongside future content changes.

### 6.2 Calculator-to-library links

#### Birth-card calculator

After a successful reveal, `BirthCardCalculator` will display a descriptive plain anchor to the exact Worker page:

`/born-on/{lowercase-month-name}-{day}`

The label will identify the date and purpose, for example: `Read the full January 15 birth-card page`.

The link appears only after a valid birthday result. It does not change calculation behavior, analytics payloads, or the existing card-meaning link.

#### Compatibility calculator

Expose a pure canonical pair helper from `lib/compat-pairs.ts`. It will:

- accept two valid card slugs;
- order them by the existing deck order used by the Worker;
- preserve the same-card case;
- return `/compatibility/{first}-and-{second}`.

After a valid two-person result, `CompatibilityCalculator` will add a descriptive plain anchor to that exact pair page. Existing card-meaning and compatibility-guide links remain.

The helper, not component conditionals, owns canonical ordering so every caller uses the same rule.

### 6.3 Card-meaning promotion and global discovery

Update the `Popular card meanings` section in `app/birth-card/page.tsx` to include:

- Queen of Hearts;
- Queen of Clubs.

Expand the current three-item list to five items, retaining Ace of Hearts, Ten of Hearts, and Ten of Diamonds alongside the two Queens.

Add `/how-to-read-playing-cards` to the Learn group in `SiteFooter`.

Add `Compatibility` to the primary desktop and mobile navigation, pointing to `/birth-card-compatibility-calculator`. The label prioritizes the working free tool while its results lead into the 1,431-URL compatibility library.

Navigation changes will reuse the existing component, type, spacing, focus, and mobile-menu patterns. No new header controls are introduced.

### 6.4 Structured-data consistency

Create a small shared structured-data module that builds absolute, validated breadcrumb objects from an ordered list of `{ name, href }` entries.

`SeoShell` will accept breadcrumb data and emit exactly one `BreadcrumbList` graph while continuing to render the visible breadcrumb trail. Pages with hand-authored breadcrumb JSON-LD will migrate to the shared path to prevent duplicates.

Add or complete page-type schema where it accurately describes existing visible content:

- `CollectionPage` with an `ItemList` for the playing-card-spreads hub and its three visible spokes;
- `Article` for the how-to-read-playing-cards guide;
- `Article` for the 52-card astrology explainer.

Schema must use absolute `https://cardblueprints.com` URLs, match visible titles and links, use consecutive one-based positions, and avoid unsupported claims. FAQ markup remains only where the visible FAQ exists.

### 6.5 Mobile Elroy overlap prevention

The Elroy teaser must not obscure primary content or calls to action at a 390 × 844 viewport.

For the homepage, birth-card calculator, compatibility calculator, and Personal Card Blueprint product page:

- suppress the timed teaser on small screens;
- retain the compact launcher when it can respect the safe area without covering a primary control;
- preserve manual access to the Elroy panel;
- preserve the existing 30-day dismissal/completion suppression behavior;
- leave checkout and other previously excluded routes unchanged.

Desktop teaser behavior remains unchanged. The change affects presentation eligibility only; it does not change Elroy's data collection, API, consent, or reading logic.

### 6.6 Worker production contract

The application will not pretend to own Worker implementation details. It will test the public interface it depends on.

Local exhaustive tests will verify:

- all 366 supported calendar dates produce the expected `/born-on/{month-day}` slug;
- every unordered pair of 52 cards produces one of exactly 1,378 canonical pair slugs;
- canonical ordering is stable when calculator inputs are reversed;
- same-card pairs remain valid;
- calculator result markup uses plain anchors for Worker destinations.

An opt-in production contract script will request a bounded representative sample:

- the birthday directory;
- a normal date;
- February 29;
- December 31;
- Queen of Hearts and Queen of Clubs date examples;
- a same-card compatibility pair;
- a reversed-input canonical pair;
- a cross-suit pair;
- both Worker sitemaps.

It will assert HTTP success, self-referencing canonical URLs, one visible H1, indexability, and expected sitemap counts. Network checks will not run implicitly in every unit-test invocation; they require an explicit command or environment flag.

## 7. Data and interaction flow

### Birth-card result

1. Visitor submits a valid birthday.
2. The existing deterministic engine resolves the card and ruling layer.
3. The component derives the calendar slug from the submitted month and day.
4. The result renders the existing card information plus a plain anchor to the matching Worker date page.
5. Invalid, incomplete, or future dates render no Worker link.

### Compatibility result

1. Visitor submits two valid birthdays.
2. The existing engine resolves both cards and the current compatibility output.
3. The canonical helper orders the two card slugs by deck order.
4. The result renders existing links plus a plain anchor to the matching Worker pair page.
5. Invalid or incomplete results render no pair link.

### Breadcrumb data

1. A page passes its ordered visible breadcrumb entries to `SeoShell`.
2. `SeoShell` renders the existing accessible visual breadcrumb.
3. The shared helper converts the same entries to one absolute `BreadcrumbList` graph.
4. Page-type schema remains page-owned and is emitted alongside, not inside, the breadcrumb graph.

## 8. Error handling and edge cases

- Invalid calculator inputs never create guessed links.
- February 29 generates `/born-on/february-29`.
- December 31 generates `/born-on/december-31` even though it is the Joker boundary.
- Compatibility inputs in either order produce the same canonical pair URL.
- Unknown card slugs cause the canonical helper to return no URL or throw a typed programmer error; components must not render a broken anchor.
- Structured-data helpers reject or normalize relative URLs before serialization.
- Breadcrumbs with fewer than two entries may omit JSON-LD while retaining visible navigation.
- Sitemap tests reject invalid dates, duplicate URLs, accidental Worker-route inclusion, or update dates earlier than the content change they represent.
- Production contract failures report the exact URL and failed invariant without attempting remediation or deployment.

## 9. Expected implementation surface

Likely files include:

- `app/sitemap.ts`
- `app/birth-card/page.tsx`
- `app/playing-card-spreads/page.tsx`
- `app/how-to-read-playing-cards/page.tsx`
- `app/52-card-astrology-explained/page.tsx`
- `components/seo/BirthCardCalculator.tsx`
- `components/seo/CompatibilityCalculator.tsx`
- `components/seo/SeoShell.tsx`
- `components/seo/SiteHeader.tsx`
- `components/seo/SiteFooter.tsx`
- the Elroy launcher/eligibility component
- `lib/compat-pairs.ts`
- a shared structured-data helper under `lib/`
- focused tests under `scripts/` or the repository's existing test locations.

Exact filenames may vary if current code already centralizes one of these responsibilities. The implementation will follow existing module boundaries and avoid unrelated refactors.

## 10. Testing strategy

### Automated checks

- Existing test suite remains green.
- Sitemap metadata test covers uniqueness, truthful dates, target routes, and Worker exclusions.
- Date-slug test exhaustively covers 366 supported dates.
- Compatibility-pair test exhaustively covers 1,378 canonical pairs plus reversed inputs.
- Calculator result tests confirm conditional plain anchors and preserve existing results.
- Navigation test covers desktop/mobile Compatibility and footer how-to destinations.
- Structured-data test checks absolute URLs, consecutive positions, page-type fields, and exactly one breadcrumb graph.
- Card-meaning equity test covers Queen of Hearts and Queen of Clubs promotion.
- Elroy eligibility test covers mobile suppression on the four protected routes and unchanged desktop behavior.
- Production contract check runs explicitly against representative Worker URLs.
- `bun test`, `bun run build`, and `bun run pages:build` pass.

### Browser verification

Use the in-app browser first, with Playwright only if the in-app browser is unavailable or unreliable.

Verify:

- calculator result links for a normal date, February 29, and reversed compatibility inputs;
- desktop and mobile navigation;
- the card-meaning promotions and footer link;
- no Elroy teaser overlap at 390 × 844 on the protected routes;
- no duplicate visible breadcrumbs or JSON-LD graphs;
- desktop and mobile layout continuity after navigation changes;
- representative Worker destinations load from the new links.

## 11. Acceptance criteria

The work is complete when:

1. All approved changes are implemented in a fresh checkout of current `main`.
2. No malformed workbook cluster creates or retargets a page.
3. Application sitemap dates reflect actual route updates and contain no Worker-owned URLs.
4. Valid calculator results link to the exact canonical Worker date or pair page.
5. Queen of Hearts and Queen of Clubs are promoted from the card-meaning hub.
6. Compatibility is available in primary navigation and the how-to-read guide is available in the footer.
7. Core SEO pages emit one consistent breadcrumb graph and accurate page-type schema.
8. The Elroy teaser does not cover primary content at the target mobile viewport.
9. Exhaustive local route-contract tests and the bounded production contract check pass.
10. Existing product, calculation, checkout, analytics, and content-truth tests remain green.
11. The production build and Cloudflare package build pass.
12. No Worker bundle, GitHub remote, or Cloudflare deployment is modified without separate approval.

## 12. Deployment boundary

This implementation may create and commit local changes in the fresh checkout. It will stop before pushing a branch, opening a pull request, or deploying to Cloudflare. Production publication requires a separate explicit user instruction after the verified diff is reviewed.
