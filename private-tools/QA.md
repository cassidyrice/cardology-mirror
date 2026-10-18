# Verification report — 18 October 2026

**Status: local implementation verified; not deployed.** All committed changes are confined to `private-tools/` on `feat/private-report-tools`, based on `aa16fed`. Shared engine, desktop report renderer/CSS and public storefront sources are unchanged. Family is exactly three people, with the existing template and complete shared engine output.

## Executed checks

| Check | Result and scope |
| --- | --- |
| `npm test` | **29 passed, 0 failed**, including 11 existing desktop engine/model tests rerun during this task. Unit tests plus actual local workerd, Static Assets routing and signed JWKS verification. |
| `npm run test:timezones` | Identical output hashes in UTC, America/Los_Angeles, Europe/London and Pacific/Auckland: 12 spread plus 12 Professional report cases per zone, digest prefix `22959e91259e`. Covers leap day, fixed cards, age 126 and DST boundary reading dates. |
| `npm run test:browser` | Passed in installed Google Chrome via Playwright; 1440×1000 and 390×844; **0 captured console/page errors**. Latest fixture URL was `http://127.0.0.1:60229` and was closed after the run. |
| Root `bun run test` | Exit 0. **409 Bun tests passed** across its six test batches, plus public-truth/privacy/media checks, mocked checkout/fulfillment/app flows, actual local D1 concurrency tests, revenue self-test and 199-URL sitemap smoke. All payment/email providers were synthetic. |
| `npm run check:worker` | Dry-run passed with 7 asset files; reported Worker upload **2478.63 KiB**, gzip **1676.54 KiB**. Identity variables remain blank; no domain routes; no upload/deploy occurred. |
| `npm run profile` | Completed 20 local CPU samples per case after two warmups. Results below. |

Environment: macOS on Apple M4, Node v26.12.0, Bun 1.4.3, Wrangler 4.115.0, Playwright 1.60.0, installed Google Chrome. Unit test timezone is UTC; browser context is America/Los_Angeles; CPU profile inherited the Mac's America/Denver timezone. No packages, browser binaries or system software were installed. No paid API calls were used.

Initial root attempts failed because Bun could not resolve the borrowed root dependencies and then because the sandbox denied local port binding. The final successful run used a temporary dependency symlink outside the cloned repository and approved localhost access. The symlink was removed afterward. These initial runs are not counted as passes. The private engine tests emit the existing Node module-type warning for `lib/engine-core/engine.js`; it is not a test failure, and the root package was left unchanged.

## Authentication and runtime coverage

- Every known page, asset and API rejects missing assertions before accessing assets or generating results. Missing/malformed identity configuration fails closed.
- Valid exact-user tokens succeed. Wrong signer, email, issuer or audience; missing claims; malformed tokens; expired tokens; future issue time; and email-header-only attempts fail.
- Alternate workers.dev/preview hosts, the public hostname, HTTP and a nonstandard port fail. No source-map, raw data, environment file or Worker source route is exposed.
- Browser artifacts contain only UI modules; the build metadata confirms engine/model imports are in the Worker. Production artifacts contain no fixture identity.
- Methods, cross-origin requests, unsupported media/encoding, invalid JSON, oversized streamed bodies, unsupported offers and writing limits are checked. Expiry after body streaming is rejected before generation.
- Actual local workerd uses its Static Assets router and the production Worker bundle. Root and HTML pages return 200 without canonicalization redirects after authentication; unauthenticated files return denial. JWKS HTTP is intercepted with an ephemeral RSA public key; unexpected network requests fail.
- Client races cover expiry headers, network denial, signout while JSON streams, new requests while signout navigation is pending, and an obsolete response arriving after a new session. Old results cannot render or expire the newer session.

Real Access policy evaluation, login, revocation propagation, key rotation and account routing are **not** proven by these synthetic tests. Those acceptance steps remain in [README.md](README.md#approval-dependent-deployment-prerequisites).

## Calculation and export coverage

- Timing Map, Chemistry and Professional HTTP report output deep-equals the unchanged desktop `buildDocument` output. Three-person Family engine output deep-equals the unchanged shared `buildEngineData`; rendering calls the unchanged existing Family renderer directly with that complete data.
- Family UI presents exactly three people. Private v3 drafts round-trip. Desktop v2 four-person Family imports are rejected explicitly. Invalid people counts fail; no person is silently discarded.
- Spread results deep-equal the existing engine for leap birthdays, fixed cards and age 126. All 90 boards retain 52 unique cards. Existing tests additionally iterate every calendar birthday and all board positions, contiguous yearly periods, cross-person intersections and explicit unsupported-date/Joker errors.
- Browser checks exercised escaped reader writing with no executable report script, report page navigation, draft save/open, engine JSON/HTML downloads, stale-response invalidation and the unsaved-draft guard.
- Spread Explorer checks exercised all six views, board 89 with all 52 positions, card detail dialog, JSON export, changed-date invalidation, expired-session denial while retaining inputs, and signout clearing visible personal data.
- Browser print action is verified via a print stub; actual PDFs are separately generated through Chromium's print renderer. The native system Save as PDF dialog was not automated. Timing Map output is 25 pages. Family normal-name output is 23 pages; 60-character-name output is 25 pages. Both Family PDFs have one physical A4 page per numbered report page and no page taller than A4. These are bounded fixtures, not a promise about every possible future template change or unlimited writing.

Screenshots were captured and visually inspected: desktop report preview, desktop Explorer, mobile report form/preview, mobile Explorer controls and full board, and the Family long-name cover. The initial Explorer full-page screenshot had repeated compositor tiles; viewport captures after resize and scrolling provide the final visual evidence. The board is readable and remains within the mobile viewport. Desktop renders preserve the existing visual system.

Evidence from the final browser run is in `/tmp/cardblueprints-private-tools-qa/` (fictional inputs only; temporary local files, not committed):

- `report-preview-desktop.png`, `report-empty-desktop.png`, `report-mobile.png`
- `explorer-desktop.png`, `explorer-mobile.png`, `explorer-mobile-board.png`
- `family-three-long-cover.png`
- `sample-timing-map.pdf` — 25 pages; 2,212,819 bytes
- `family-three.pdf` — 23 pages; 2,028,223 bytes
- `family-three-long.pdf` — 25 pages; 2,095,043 bytes

Run logs are ignored under `private-tools/test-results/`: `unit.txt`, `browser.json`, `profile.json`, `storefront-regression.txt` and the unsuccessful sandbox run log. Build dependency evidence is `dist/build-meta.json`. Tests are committed and can regenerate the artifacts; temporary file retention is not guaranteed.

## Local CPU measurements

This measures **local Node process user+system CPU on Apple M4**, using the production Worker bundle, real RSA signature verification with an in-memory fixture key, body parsing, unchanged generation, JSON serialization and response consumption. Token signing, network JWKS retrieval, module loading and Cloudflare edge behavior are excluded. Two warmups precede 20 samples per case. Median is the upper middle sample; p95 is the 19th sorted sample.

| Request | CPU median (ms) | CPU p95 (ms) | Wall median (ms) | Response bytes |
| --- | ---: | ---: | ---: | ---: |
| Spread, age 126 | 0.38 | 0.93 | 0.29 | 66,460 |
| Professional | 0.67 | 1.07 | 0.52 | 95,137 |
| Chemistry | 3.58 | 6.47 | 3.29 | 905,352 |
| Timing Map, three people | 8.37 | 11.49 | 5.93 | 1,438,544 |
| Family, three people | 5.66 | 10.60 | 4.94 | 1,106,941 |
| Family, three people, maximum writing | 7.31 | 11.49 | 5.47 | 1,213,477 |

The maximum-writing case uses 60-character names/relationships, four 6,000-character writing sections and 12,000 note characters. It profiles computation/serialization, not a worst-case browser pagination guarantee.

**Cloudflare Free suitability is unverified.** Its documented CPU cap is 10 ms per invocation. Several local p95 measurements exceed that number, but local Node CPU is not Cloudflare billed CPU. Neither this benchmark nor a successful local workerd test certifies production CPU, memory, cold starts or quotas. Check actual protected Worker metrics before selecting a plan; do not turn on a paid upgrade automatically. See [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/).

## Release blockers and scope

1. Confirm Cloudflare account/zone/plan and exact allowed identity; create and verify Worker-level Access coverage before exposing the custom domain. Test actual expiry/revocation and alternate-host protection.
2. Obtain separate approval for any provisioning, Access grant, DNS change or deployment. Public Pages bindings and environment must remain untouched.
3. Verify Cloudflare billed CPU under cold and warm conditions; investigate or obtain a separate plan decision if the 10 ms free limit is not met.
4. Provision and audit a reproducible dependency installation before production; this task reused already installed packages and made no lockfile or install changes.
5. Review integration deliberately: the public deploy workflow runs on pushes to `main` with no path filter, even if the diff contains only private-tools files.

No public pricing, checkout, storefront, desktop source, shared calculation or template file was changed. No commit was pushed, merged into public main or deployed. No account access was granted, secrets changed, DNS edited, messages sent, live purchases made or paid upgrades enabled.
