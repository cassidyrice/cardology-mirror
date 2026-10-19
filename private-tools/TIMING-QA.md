# Individual Timing verification — 18 October 2026

**Ready for independent review; locally committed only.** The isolated branch is `feat/private-individual-timing`, based on `6c1f088`, in `/Users/rice/Documents/Codex/2026-10-18/task-2/private-individual-timing`. The published `feat/private-report-tools` checkout remains clean at `6c1f088`.

## Change and compatibility

Hosted Timing accepts exactly one person and saves version-3 drafts. The four writing sections cover baseline/yearly themes, dated seasons across the next twelve months, the current season in practice, and questions for the year ahead. It reuses core cards, yearly themes, seasons, calendar and appendix rendering. The individual presentation omits comparison, shared-card and crossing chapters and counts the actual engine windows.

The shared renderer requires the explicit `individual-timing` variant together with a Timing v3 draft and exactly one draft/engine person. Existing callers keep its default behavior. Ten complete HTML hashes captured from unmodified `6c1f088` still match: normal and 60-character names for legacy Timing three-person, Chemistry two-person, and Family two-, three- and four-person reports.

Legacy Timing v2 imports receive an explanatory error directing the user to desktop. The file, current inputs and current generated report are preserved; people and writing are not trimmed or automatically migrated. Desktop still parses and renders the original three-person draft. Hosted Family remains two or three people. Switching from Family to Timing excludes cached extra people from the request, saved draft and exported engine; switching back restores their inputs.

Only three production files changed: `private-tools/src/reports.mjs`, `private-tools/browser/report.mjs` and shared `desktop/src/offer-render.mjs`. `buildEngineData`, all calculation modules, desktop UI/model, public checkout/storefront, authentication, Worker routes and dependency manifests/lockfile are unchanged. Existing installed dependencies were copied into this worktree; no package installation or account change was needed.

## Executed verification

| Check | Result |
| --- | --- |
| `npm test` | **35 passed, 0 failed**, including existing desktop checks, signed JWT/auth/session tests, actual local workerd/Static Assets tests, hosted counts/drafts, individual presentation guards, engine parity and all ten legacy HTML hashes. |
| `npm run test:timezones` | Same digest prefix `7783de1216ec` in UTC, America/Los_Angeles, Europe/London and Pacific/Auckland. Each zone runs 12 spread, 12 Professional and 12 individual Timing cases. |
| `npm run test:browser` | Passed with installed Chrome in an isolated headless process, after the Stan writer released browser work. Viewports 1440×1000 and 390×844. **Zero unexpected console/page errors.** One deliberate legacy-draft HTTP 400 is asserted separately. Final fixture URL `http://127.0.0.1:60592` was closed afterward. |
| `npm run check:worker` | Packaging dry-run passed: 7 assets, 2481.64 KiB upload / 1677.48 KiB gzip. No upload or deployment occurred. |
| Root `bun run test` | Executed in this worktree during this follow-up: **409 Bun tests passed**, plus privacy/public-truth/media checks, mocked checkout/fulfillment/app flows, local D1 concurrency, revenue self-test and 199-URL sitemap smoke. Root sources stayed unchanged. |
| `git diff --check` and protected-file comparison | Passed. No change in calculation code, desktop UI/model, authentication, configuration, dependencies, public application or deployment workflow. |

Timing count tests accept one and reject zero, two, three and four, through both report and draft endpoints. Family two/three acceptance and one/four rejection remain covered. New drafts round-trip. The individual engine object deep-equals unchanged `buildEngineData`, and its buyer data/window deep-equals the existing three-person desktop calculation across seven birthday/leap-date cases. Those cases include both seven- and eight-window rolling years, with contiguous dates and matching horizon endpoints.

Browser checks cover the single-person sample/form, all four writing sections, escaped writing, draft save/open, engine/HTML export, preview navigation, the print action, Family count switching, cached extra people, rejection without data loss, mobile layout, late responses, expiry and signout. Spread Explorer's existing six views, 90-board export and board/detail controls remain covered. Browser bundles still exclude calculations and source data.

## PDF and layout evidence

All **13 PDFs / 264 physical pages** match their numbered HTML page counts. Print-layout checks inspect every text rectangle for page-edge clipping and footer collisions and check every page number. The actual PDF MediaBoxes are A4 (594.95996 × 841.91998 points, within one point of A4). A separate check with the Mac's existing Swift/PDFKit read the actual PDFs and verified the correct page number, coordinates footer and review-status footer on all 264 pages. It also rendered PDF pages for visual comparison. PDF text extraction inserts spaces into letterspaced headings, so those checks normalize whitespace before matching.

| Fixture | Numbered HTML / physical PDF pages |
| --- | ---: |
| Single-person sample with escaped writing | 16 / 16 |
| Normal rolling year, eight windows | 15 / 15 |
| Birthday | 14 / 14 |
| Birthday eve / day after birthday | 15 / 15 each |
| February 29 birthday in a non-leap year / on leap day | 14 / 14 each |
| 60-character unbroken name | 15 / 15 |
| Maximum writing and long name | 61 / 61 |
| Family two people, normal / long names | 18 / 18 and 19 / 19 |
| Family three people, normal / long names | 23 / 23 and 25 / 25 |

The maximum-writing fixture has four 6,000-character sections, 12,000 note characters and a 60-character unbroken name. Literal `<script>` text remains escaped. A first PDF pass caught clipped labels in one-day timeline segments at a birthday boundary. The individual variant now leaves short bands unlabelled and points to the dated season pages, which retain every date/card. The change is scoped to the individual variant; legacy HTML hashes remain identical.

Screenshots were visually inspected for the normal/long-name covers, timeline, current-season page, writing continuation, appendix and mobile builder, plus the actual PDF timeline and maximum-writing page. Evidence is under `/tmp/cardblueprints-individual-timing-qa/`: `timing-*.pdf`, `family-*.pdf`, matching screenshots, `physical-pdf-checks.json` and the browser views. The supplementary native check is saved alongside them as `physical-pdf-check.swift`; it can be run with the already installed `swift` command. Test logs are ignored under `private-tools/test-results/`, including `unit.txt`, `browser.json` and `storefront-regression.txt`. Temporary evidence is not guaranteed to persist; the committed browser tests regenerate the PDFs and HTML layout checks.

## Remaining acceptance and scope

This is local fulfillment verification with fictional inputs and synthetic Access assertions. Real Cloudflare Access/login/revocation, edge CPU, account setup and deployment remain outside this change. Local PDF checks do not certify every possible future template or Unicode input. The native Save as PDF dialog was not automated; print initiation and Chromium's actual PDF output were tested separately.

No push, merge, deploy, account mutation, public checkout change, paid API use or purchase occurred. The website Timing order button remains outside this work. Independent review should compare this branch against `6c1f088`; its merge/publish must be coordinated with the organizer.
