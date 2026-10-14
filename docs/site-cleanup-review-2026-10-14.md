# Website cleanup review — October 14, 2026

Local review only. No deployment, merge, push, real purchase, customer-data change or product retirement.

## Completed

- Shared desktop/mobile navigation: Find your card, Compatibility, Learn, Full reading, plus My purchases. Full reading retains the existing $13 One Question Reading destination and offer-click tracking. Shorter labels allow desktop navigation from 1024px.
- Homepage: calculator first, concise explanation, one static paid invitation, three learning links. Removed duplicate above-fold links, app-sample promotion, benefit list/sample teaser, and repeated exploration section. Calculator/result logic is unchanged.
- Footer: one tools/library group, reading/support, About/methodology/editorial, and all policy/privacy-choice links. Lower-priority resources remain linked through Explore and contextual page content.
- Explore: find a card, compare cards, understand timing, learn the method. Retains birthdays, pairings, ruling cards, timing tools, course, karma relationships, spreads and video library.
- Videos demoted from broad footer navigation; URL and embedded media remain intact.
- `/52-card-astrology-explained`: removed keyword-list introduction and repeated deck/calendar explanation; retained chart, leap-day/Joker details, FAQs, free course, canonical, anchors and calculator links. Corrected “chart above” to “chart below.”

## Evidence and ownership

Read the plan, GSC page and query-overlap exports, Cloudflare observations and 30/90-day conversion CSVs in `audit/2026-10-14/`. The GSC export is capped at 1,000 pages; query overlap is a top-20 list excluding anonymized queries. Cloudflare path counts and some events are sampled. Missing rows are unknown usage, not zero. Recorded purchase contribution protects karma relationships; course signups and Your Year checkout contribution support keeping those pages.

`lib/site.ts`, `lib/worker-seo-routes.ts`, and `middleware.ts` identify `/born-on/`, `/compatibility/`, `/sitemap-cardology.xml`, and `/sitemap-compatibility.xml` as owned by the separate `cardology-unlock` Worker. Explore uses ordinary anchors for its directory links. This cleanup changes no Worker source or route ownership. Pages sitemap/redirect/canonical configuration is unchanged because no URLs were retired.

The instructed `~/cardblueprints-ops/STATE.md`, queue and Worker source are absent on Cass's Mac. No `.agents/skills` directory was found in this checkout. A local claim was recorded in `ops/site-cleanup-queue.md`. Applied Ponytail and frontend-testing guidance. Preserved pre-existing untracked `audit/`, `desktop/` and cleanup-plan document.

## Article decisions

All candidate article URLs remain intact. The plan requires full traffic history and backlinks before permanent removal; neither is supplied for these candidates. No blanket redirect, sitemap deletion or canonical reassignment was justified. Proposed destinations below are conditional, not implemented redirects. Every row is Pages-owned.

| Candidate | Decision and content review | Conditional destination | Rollback |
| --- | --- | --- | --- |
| `/52-card-astrology-explained` | Simplify in place; about 100 Cloudflare views despite 0 GSC clicks/14 impressions. Retain chart, calendar, suit/rank, leap-day and Joker explanation. | Same URL | Revert this commit's page edit |
| `/blog/how-to-find-your-birth-card` | Hold; 0/12 GSC. Calculator instructions overlap, but article also explains reading the meaning, confusing birth/ruling cards and ranges of expression. | `/birth-card-calculator` after preserving those instructions | No URL change |
| `/blog/how-a-birthday-becomes-a-card` | Hold; 0/13. Separates fixed assignment, birth year and interpretation. Methodology already has more concrete derivation and a worked example, making it closer than a bare tool. | `/methodology` after content/history/backlink review | No URL change |
| `/birth-card-vs-ruling-card` and `/blog/birth-card-vs-ruling-card-how-to-read-both` | Hold both; hub 0/14, article 3/12. Hub explicitly preserves dual ruling cards; article has richer reading sequence, contradictory layers and compatibility application. Article is provisional survivor based on visible search evidence, not a final equity decision. | `/blog/birth-card-vs-ruling-card-how-to-read-both` if hub's unique details are relocated and links/history support it | No URL change |
| `/blog/how-52-day-periods-divide-your-year` | Hold; 2/20. Arithmetic, birthday start, planet order and Venus/Saturn example are more specific than the destination's broad reflection advice. Its day-zero FAQ also needs checking against the timing engine before copying. | `/blog/52-day-periods-in-cardology` (6/60) after verifying and relocating useful details | No URL change |
| `/blog/planetary-periods-without-prediction` | Hold; 0/16. Has planetary lens examples, practical five-step sequence and journaling application. | `/blog/52-day-periods-in-cardology` after preserving sequence and distinct examples | No URL change |
| `/blog/how-to-compare-two-birth-cards` | Hold; 0/15. Five-step sequence adds rank movement, asymmetric positions in both directions, ruling-card tone and a three-sentence summary. | `/cardology-compatibility` after preserving the sequence | No URL change |
| `/blog/cardology-compatibility-beginner-guide` | Hold; 0/13. Overlaps guide's suit/Life Path language; preserves contextual reading and “not permission” framing. Guide has stronger search acquisition (137/836) and the tool has distinct intent (61/525). | `/cardology-compatibility` after targeted usage/backlink review | No URL change |
| `/cardology-vs-tarot` and `/cartomancy-vs-tarot` | Keep both; 0/15 and 1/23. Cardology page compares birthday calculations with shuffled readings; cartomancy page covers umbrella taxonomy, ordinary-deck translation, suit/court equivalents and Major Arcana. Related topics, distinct visitor questions. | Same URLs | No URL change |
| `/videos` | Demote, retain; 0/39 GSC and Cloudflare exact-path “No data” do not prove zero usage. Still linked from Explore. | Same URL | Revert footer edit |

Keep `/what-is-cardology`, `/destiny-cards`, period tool, all 53 card records, both compatibility entry pages and both directories. No individual long-tail deletion was attempted.

## Current-state differences deliberately preserved

The checkout already uses automated fulfillment with an “about a minute” SLA, and result screens offer Year Ahead alongside One Question Reading. These predate this diff and conflict with older AGENTS one-product/manual-fulfillment language. The October 14 task explicitly prohibits product retirement. No price, fulfillment, offer flag, paid access or result offer was changed. “One paid invitation” applies to the initial homepage; existing result offers remain. Separate desktop app untouched.

## Validation

Validation results are recorded below after bounded runs. Browser target is `http://127.0.0.1:3577`, using installed Chrome on Cass's Mac through the repository Playwright runner. The desktop-control launch hung and was abandoned; it was not retried. The Browser plugin was unavailable. The test runner now accepts `PLAYWRIGHT_EXECUTABLE_PATH` and has explicit launch/navigation/interaction timeouts. Temporary outer watchdog caps the full suite at 90 seconds and browser suite at 180 seconds.

| Check | Result |
| --- | --- |
| `bun run test` | PASS, exit 0. 402 Bun tests, 0 failures, plus integration/public-truth/privacy/media/sitemap scripts. Covers 366 birthdays, 52 same-card comparisons, 104 legacy redirects, synthetic Stripe/Resend fulfillment and retrieval, concurrency/retry, old tokens and paid app access. Main sitemap: 201 URLs. |
| `bun test scripts/site-navigation.test.ts` | PASS: 4 tests, 52 assertions. Desktop/mobile destinations match; unique footer links retain policies/access; four Explore groups retain protected links. |
| `bun x tsc --noEmit` | PASS, exit 0, no diagnostics. |
| `PLAYWRIGHT_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" bun run test:seo:browser` | PASS, exit 0. Identity, meaningful rendering, framework overlays and console/page errors checked. No relevant console or page errors. |
| Mobile/desktop browser | PASS at 360, 390, 820, 1024 and 1280px as applicable. Header overflow, desktop breakpoint, mobile menu labels/clipping. Homepage calculator returns 8 of Diamonds for 1991-02-17 at 390/1280px. Canonical calculator verifies normal/leap dates; compatibility compares and reverses the pair without duplicating pair links. |
| Navigation/library/access | PASS: Learn click opens Explore at 390/1280px; four groups, filter match/empty/reset states, retained Spreads and Videos links; footer My purchases opens anonymous receipt-recovery guidance. |
| Checkout browser | PASS at 390/1280px: birthday carryover/correction, question entry, reachable submit control, request body validated via Playwright interception. No Stripe session created. |
| Redirect HTTP/browser | PASS: `/readings`, `/products/personal-card-blueprint`, `/products/complete-card-blueprint` return direct permanent redirects to the existing One Question Reading page; destination renders 200. |
| Preserved local routes | PASS: 18 HTTP 200 checks with H1/content: ruling card, Your Year, Videos, free course, karma relationships, Joker, What is Cardology, Destiny Cards, period tool, methodology, contact, all policies, Blueprint Report, anonymous blueprint and checkout success. |
| Public Worker GETs | PASS HTTP 200: `/born-on/`, `/born-on/february-29`, `/compatibility/`, `/sitemap-cardology.xml`, `/sitemap-compatibility.xml`. Both sitemaps contain XML sitemap roots. Read-only production requests; no Worker edits. |
| `git diff --check` and independent read-only review | PASS; no material implementation regression found. |

Initial failed attempts: default sandbox blocked local server sockets; bundled Node could not load SWC because of macOS signing restrictions. Resolved with approved loopback access and temporary official Bun runtime. The first browser assertion expected the old footer Spreads link; updated to assert the Explore link and the retained Spreads link inside Explore. Earlier unit assertions expected the old navigation; updated to preserve the new intended contract. All affected final checks pass. The desktop-control tool hang was abandoned, never retried.

Screenshots inspected: `/tmp/cardblueprints-cleanup-home-390.png`, `/tmp/cardblueprints-cleanup-home-1280.png`, `/tmp/cardblueprints-cleanup-explore-390.png`, `/tmp/cardblueprints-cleanup-explore-1280.png`. Initial homepage has one primary static paid invitation; no horizontal overflow in inspected states. Next dev indicator in screenshots is local development UI.

Raw logs: `/tmp/cardblueprints-cleanup-tests.log`, `/tmp/cardblueprints-cleanup-nav.log`, `/tmp/cardblueprints-cleanup-types.log`, `/tmp/cardblueprints-cleanup-seo.log`, `/tmp/cardblueprints-cleanup-routes.log`. Runtime: temporary Bun 1.3.11 in `/tmp/cardblueprints-bun/package/bin`; dependencies installed from the existing frozen lockfile, which is unchanged. Preview uses Bun's Next runtime at loopback only; watchdog stops it automatically.

Not run: real paid Stripe checkout, real email delivery, customer receipt/token retrieval, authenticated production app sessions, full production CWV/backlink/history review, production deployment/build. Mock integration coverage exercises those payment/access handlers without customer data. Browser screenshots and interaction coverage use local development rendering, not a deployed preview. `/checkout-check` production mutation steps were not run because no checkout logic changed and this task excludes real transactions/customer changes. Do not infer deployed behavior from this local diff.

## Files and handoff

Changed implementation: `app/page.tsx`, `app/landing.css`, `app/52-card-astrology-explained/page.tsx`, `components/explore/ExploreDirectory.tsx`, `components/seo/SiteHeader.tsx`, `SiteFooter.tsx`, `HeaderDeepDiveCta.tsx`, `DeepDiveCta.tsx`, `lib/site-nav.ts`.

Changed checks: `scripts/site-navigation.test.ts`, `scripts/internal-link-hygiene.test.ts`, `scripts/seo-integrity-browser.ts`. Added this review and local claim record. Base commit: `319beef`. Revert the cleanup commit to restore previous presentation. Existing untracked audit, desktop app and proposal remain outside the commit. No draft PR required for this local handoff.

Deferred next decision: collect matched-period candidate traffic/backlinks and resolve unique-content transfer before any article redirect. Reassess after 28/56 days only if and when this change is deployed. No automation scheduled.
