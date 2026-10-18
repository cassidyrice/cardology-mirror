# Verification report — 18 October 2026

This records the preceding hosted baseline through `6c1f088`. Its three-person Timing behavior and performance figures are historical. The separate one-person Timing follow-up, guarded shared-renderer change and newly executed checks are recorded in [TIMING-QA.md](TIMING-QA.md).

**Status: local implementation verified; not deployed.** All committed changes are confined to `private-tools/` on `feat/private-report-tools`, based on `aa16fed`. Shared engine, desktop report renderer/CSS and public storefront sources are unchanged. Family supports **two or three people, including the buyer**, with the existing template and complete shared engine output. Reproducible dependencies are resolved locally.

## Executed checks

| Check | Result and scope |
| --- | --- |
| `npm test` | **30 passed, 0 failed**, including 11 existing desktop engine/model tests rerun during this task. Unit tests plus actual local workerd, Static Assets routing and signed JWKS verification. Rerun after pinning the confirmed sole email. |
| `npm run test:timezones` | Identical output hashes in UTC, America/Los_Angeles, Europe/London and Pacific/Auckland: 12 spread plus 12 Professional report cases per zone, digest prefix `22959e91259e`. Covers leap day, fixed cards, age 126 and DST boundary reading dates. |
| `npm run test:browser` | Passed in installed Google Chrome via Playwright; 1440×1000 and 390×844; **0 captured console/page errors**. Latest fixture URL was `http://127.0.0.1:61525` and was closed after the run. |
| Root `bun run test` | Exit 0 during the initial local verification: **409 Bun tests passed** across its six test batches, plus public-truth/privacy/media checks, mocked checkout/fulfillment/app flows, actual local D1 concurrency tests, revenue self-test and 199-URL sitemap smoke. All payment/email providers were synthetic. This unchanged root suite was not rerun for the private-only Family/dependency follow-through. |
| Fresh locked install and audit | `npm ci --ignore-scripts` passed with 42 packages installed from npmjs.org; `npm ls --all` passed; final `npm audit` reported **0 advisories** across the locked tree. Private unit/runtime, timezone, browser and dry-run checks above were rerun with this installation. |
| `npm run check:worker` | Rerun after the identity update. Dry-run passed with 7 asset files; reported Worker upload **2478.64 KiB**, gzip **1676.55 KiB**. `ALLOWED_EMAIL` is the confirmed address; Access team/audience remain blank; no domain routes; no upload/deploy occurred. |
| `npm run profile` | Completed 20 local CPU samples per case after two warmups. Results below. |

Environment: macOS on Apple M4, Node v26.12.0, npm 11.20.0, Bun 1.4.3, Wrangler 4.151.1, Playwright 1.60.0, installed Google Chrome. Unit test timezone is UTC; browser context is America/Los_Angeles; CPU profile inherited the Mac's America/Denver timezone. The approved follow-through installed npm dependencies locally; no browser binaries, system software or paid services were installed. No paid API calls were used.

The later exact-email/configuration and account-plan follow-through reran only the unit/runtime suite and Worker packaging dry-run. Timezone, browser/PDF, CPU and root regression evidence above remains from the preceding implementation verification; those checks were not rerun for this configuration/documentation change.

Initial root attempts failed because Bun could not resolve the borrowed root dependencies and then because the sandbox denied local port binding. The final successful root run used a temporary dependency symlink outside the cloned repository and approved localhost access. The symlink was removed afterward. These initial runs are not counted as passes. The private engine tests emit the existing Node module-type warning for `lib/engine-core/engine.js`; it is not a test failure, and the root package was left unchanged.

## Dependency reproducibility

The prior private `node_modules` directory contained only four links into the writer checkout. Those links were moved out before lockfile generation and are not used by the final install. The final `package-lock.json` is npm lockfile v3, with 122 resolved registry package entries including optional platform packages. Every entry has an integrity hash and an `https://registry.npmjs.org/` URL; none is a local/file/link dependency. Lockfile SHA-256: `a5bec698094a52290f327d1b4da5db074d9288a306455c7a962f7000a0184e80`.

The final install used `npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ --cache=/tmp/cardblueprints-private-npm-cache`. It rebuilt `node_modules` from the lockfile; all four direct packages are real installed directories. Lifecycle scripts stayed disabled, and build, workerd, Chrome, and packaging checks still passed.

The first locked tree exposed four high-severity npm audit entries in the old Wrangler development chain, through `miniflare`, `sharp` and `undici`. Pinned Wrangler was updated from 4.115.0 to npm's recommended same-major 4.151.1; the final tree contains Sharp 0.35.5 and Undici 7.29.1 and reports zero npm advisories. Wrangler's bundled Miniflare 5.20261012.1-beta uses a new configuration API, so the test-only harness uses its exported `convertV4MiniflareOptions` adapter. Real local routing and JWKS tests passed with that adapter. No production auth or calculation code changed for the tool upgrade.

## Authentication and runtime coverage

- Every known page, asset and API rejects missing assertions before accessing assets or generating results. Missing/malformed identity configuration fails closed.
- Valid exact-user tokens succeed. Wrong signer, email, issuer or audience; missing claims; malformed tokens; expired tokens; future issue time; and email-header-only attempts fail.
- The committed config pins Cass's confirmed `therealcassrice@gmail.com`. Even a correctly signed token for that email receives 503 while Access configuration is blank. With synthetic Access settings, the exact email and uppercase spelling succeed; plus-address, googlemail alias, another Gmail address, the old fictional fixture email and email-header-only attempts fail. The test uses ephemeral local signatures, not a real user's credentials.
- Alternate workers.dev/preview hosts, the public hostname, HTTP and a nonstandard port fail. No source-map, raw data, environment file or Worker source route is exposed.
- Browser artifacts contain only UI modules; the build metadata confirms engine/model imports are in the Worker. Production artifacts contain no fixture identity.
- Methods, cross-origin requests, unsupported media/encoding, invalid JSON, oversized streamed bodies, unsupported offers and writing limits are checked. Expiry after body streaming is rejected before generation.
- Actual local workerd uses its Static Assets router and the production Worker bundle. Root and HTML pages return 200 without canonicalization redirects after authentication; unauthenticated files return denial. JWKS HTTP is intercepted with an ephemeral RSA public key; unexpected network requests fail.
- Client races cover expiry headers, network denial, signout while JSON streams, new requests while signout navigation is pending, and an obsolete response arriving after a new session. Old results cannot render or expire the newer session.

Real Access policy evaluation, login, revocation propagation, key rotation and account routing are **not** proven by these synthetic tests. Those acceptance steps remain in [README.md](README.md#approval-dependent-deployment-prerequisites).

## Calculation and export coverage

- Timing Map, Chemistry and Professional HTTP report output deep-equals the unchanged desktop `buildDocument` output. Both two- and three-person Family engine output deep-equals the unchanged shared `buildEngineData`, and complete HTML equals the unchanged Family renderer's output.
- The engine's pair and cross-person loops work over the supplied people array; the renderer likewise uses the actual people array and already varies its two-person prompts. The old four-person requirement belongs to desktop draft validation, not calculation semantics. The private adapter accepts 2 or 3 people and rejects 0, 1, 4 and 5. Shared calculations and templates are untouched.
- Family UI allows two or three people. Private v3 drafts round-trip with the selected count. Switching 3→2 invalidates the old export; regenerated engine JSON and saved draft contain two people. Switching back to three restores the third person's entered details. Desktop v2 four-person Family imports remain explicitly rejected; no person is silently discarded.
- Spread results deep-equal the existing engine for leap birthdays, fixed cards and age 126. All 90 boards retain 52 unique cards. Existing tests additionally iterate every calendar birthday and all board positions, contiguous yearly periods, cross-person intersections and explicit unsupported-date/Joker errors.
- Browser checks exercised escaped reader writing with no executable report script, report page navigation, draft save/open, engine JSON/HTML downloads, stale-response invalidation and the unsaved-draft guard.
- Spread Explorer checks exercised all six views, board 89 with all 52 positions, card detail dialog, JSON export, changed-date invalidation, expired-session denial while retaining inputs, and signout clearing visible personal data.
- Browser print action is verified via a print stub; actual PDFs are separately generated through Chromium's print renderer. The native system Save as PDF dialog was not automated. Timing Map output is 25 pages. Two-person Family output is 18 pages with normal names and 19 with 60-character names; three-person Family is 23 and 25 pages respectively. All four Family PDFs have one physical A4 page per numbered report page and no page taller than A4. These are bounded fixtures, not a promise about every possible future template change or unlimited writing.

Screenshots were captured and visually inspected: desktop report preview, desktop Explorer, mobile report form/preview including the Family count selector, mobile Explorer controls and full board, and both Family long-name covers. The initial Explorer full-page screenshot had repeated compositor tiles; viewport captures after resize and scrolling provide the final visual evidence. The board is readable and remains within the mobile viewport. Desktop renders preserve the existing visual system.

Evidence from the final browser run is in `/tmp/cardblueprints-private-tools-qa/` (fictional inputs only; temporary local files, not committed):

- `report-preview-desktop.png`, `report-empty-desktop.png`, `report-mobile.png`
- `explorer-desktop.png`, `explorer-mobile.png`, `explorer-mobile-board.png`
- `family-two-long-cover.png`, `family-three-long-cover.png`
- `sample-timing-map.pdf` — 25 pages; 2,212,819 bytes
- `family-three.pdf` — 23 pages; 2,028,223 bytes
- `family-three-long.pdf` — 25 pages; 2,095,043 bytes
- `family-two.pdf` — 18 pages; 1,568,275 bytes
- `family-two-long.pdf` — 19 pages; 1,572,308 bytes

Run logs are ignored under `private-tools/test-results/`: `unit.txt`, `browser.json`, `profile.json`, `dependency-tree.json`, `dependency-audit.json`, `dependency-audit-before.json`, `storefront-regression.txt` and the unsuccessful sandbox run log. Build dependency evidence is `dist/build-meta.json`. Tests are committed and can regenerate the artifacts; temporary file retention is not guaranteed.

## Local CPU measurements

This measures **local Node process user+system CPU on Apple M4**, using the production Worker bundle, real RSA signature verification with an in-memory fixture key, body parsing, unchanged generation, JSON serialization and response consumption. Token signing, network JWKS retrieval, module loading and Cloudflare edge behavior are excluded. Two warmups precede 20 samples per case. Median is the upper middle sample; p95 is the 19th sorted sample.

| Request | CPU median (ms) | CPU p95 (ms) | Wall median (ms) | Response bytes |
| --- | ---: | ---: | ---: | ---: |
| Spread, age 126 | 0.40 | 0.90 | 0.29 | 66,460 |
| Professional | 0.57 | 0.97 | 0.42 | 95,137 |
| Chemistry | 3.54 | 6.34 | 3.23 | 905,352 |
| Timing Map, three people | 7.41 | 11.69 | 5.85 | 1,438,544 |
| Family, three people | 6.74 | 10.14 | 4.82 | 1,106,941 |
| Family, two people | 4.15 | 8.49 | 3.23 | 906,922 |
| Family, three people, maximum writing | 6.23 | 11.23 | 5.35 | 1,213,477 |

The maximum-writing case uses 60-character names/relationships, four 6,000-character writing sections and 12,000 note characters. It profiles computation/serialization, not a worst-case browser pagination guarantee.

**Cloudflare Free suitability is unverified.** Its documented CPU cap is 10 ms per invocation. Several local p95 measurements exceed that number, but local Node CPU is not Cloudflare billed CPU. Neither this benchmark nor a successful local workerd test certifies production CPU, memory, cold starts or quotas. Check actual protected Worker metrics before selecting a plan; do not turn on a paid upgrade automatically. See [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/).

## Release blockers and scope

The exact identity and existing CLI account are now confirmed. Read-only Cloudflare inspection found account `ed56f6f3b938abe4f3f024a53a789d4f`, no Worker named `cardblueprints-private-tools` (API code 10007), and public DNS NXDOMAIN for `reports.cardblueprints.com`. The dashboard is signed out, with the confirmed Google profile available in a preserved Chrome tab. Wrangler used its existing credential internally; no credential values were exposed or copied into task files. [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md) records the minimum scope, current published costs and concrete approval steps.

1. Complete the dashboard sign-in handoff and confirm zone ownership, current Workers/Zero Trust plan, existing organization/provider and matching Access policies. Create and verify the exact-email Worker-level Access coverage before exposing the custom domain. Test actual expiry/revocation and alternate-host protection.
2. Obtain separate approval for any provisioning, Access grant, DNS change or deployment. Public Pages bindings and environment must remain untouched.
3. Verify Cloudflare billed CPU under cold and warm conditions; investigate or obtain a separate plan decision if the 10 ms free limit is not met.
4. Review integration deliberately: the public deploy workflow runs on pushes to `main` with no path filter, even if the diff contains only private-tools files.

No public pricing, checkout, storefront, desktop source, shared calculation or template file was changed. No commit was pushed, merged into public main or deployed. No account access was granted, secrets changed, DNS edited, messages sent, live purchases made or paid upgrades enabled.
