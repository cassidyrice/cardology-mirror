# Private Report Builder and Spread Explorer

Local implementation for `https://reports.cardblueprints.com`, based on `aa16fed`. The sole allowed identity is **therealcassrice@gmail.com**, confirmed by Cass. The production configuration is deliberately inactive: no domain routes, no workers.dev or preview URLs, and blank Access team/audience settings. Those missing settings deny requests even for the confirmed email. No Cloudflare account, Access application, DNS record or deployment has been created by this work.

The hosted adapter and browser live under `private-tools/`. The focused one-person Timing follow-up also adds an explicit individual variant to shared `desktop/src/offer-render.mjs`; its default legacy output is preserved. Calculation modules, desktop UI, public storefront, authentication and deployment configuration are unchanged. See [TIMING-QA.md](TIMING-QA.md) for this follow-up's checks, [QA.md](QA.md) for the preceding baseline verification, and [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md) for the account/setup handoff.

## Behavior and boundaries

- Report Builder supports a **one-person Timing Map**, the existing Chemistry and Professional reports, and **two or three people, including the buyer**, for Family Snapshot. Timing has four writing sections: baseline/yearly themes, dated seasons across the next twelve months, the current season in practice, and questions for the year ahead. Its individual layout uses the unchanged engine and omits comparison/shared-card/crossing chapters. Dates determine the season windows; the report does not promise exactly seven windows.
- **Birth Card Blueprint** (`birth-card-blueprint`, one person, v3 drafts) is generated from the birth date alone by `desktop/src/birth-card-blueprint.mjs` (`buildBirthCardBlueprint({month, day, year?})`): birth card from solar value 55 − (2 × month + day) via engine-core `SOLAR_TO_CARD` (December 31 is the Joker), ruling card(s) from `PRC_DATA`, and section text from `lib/card-bible.json` and `lib/card-reading-notes.json`. It renders through the `birth-card-blueprint` variant of shared `offer-render.mjs`; other offers' output is unchanged. Writing sections are optional. The closing page ("Using your blueprint") offers no other product: $13 is the only price, pinned by a test across all 366 birthdays.
- Choose the Family count in its form; switching temporarily to two preserves the third person's inputs in the tab. Switching to Timing excludes all extra people from generation, drafts and exports while keeping their inputs available if you switch back. Family retains its existing template and full shared calculation output.
- Spread Explorer provides all six existing views, all 90 boards, card details and JSON export.
- Calculations and report rendering run in the Worker. Browser bundles contain UI code only. `build.mjs` imports the existing engine and renderer into the Worker and rejects calculation/data imports in browser assets.
- Draft JSON, generated HTML and engine JSON download through the browser. PDF uses the report iframe's browser print dialog; select Save as PDF. There is no server file store, database, object storage or email integration.
- Unsaved inputs live in the current tab. Session expiry clears generated content and disables exports but keeps inputs so the draft can be downloaded before signing in in a new tab. Sign out clears the workspace and broadcasts to other open tool tabs. Previously downloaded files remain on the computer.
- Private Timing and Family drafts use format `card-blueprints-report`, **version 3**, with exactly one person for Timing and two or three for Family. Desktop v2 Timing still uses three people and Family four. Importing those legacy files into the hosted builder is rejected clearly; no people are dropped or writing reinterpreted, and a rejected import preserves the currently open report. Open those files in the legacy desktop builder. Chemistry/Professional retain existing version 2 behavior and supported legacy migration. Desktop does not open the new Timing/Family v3 drafts.

## Local commands

Run from `private-tools/`. Prerequisites are Node 22 or newer and npm. Direct dependencies are pinned in `package.json`: jose 5.9.6, esbuild 0.25.12, Playwright 1.60.0 and Wrangler 4.151.1. `package-lock.json` pins the complete dependency tree with registry integrity hashes. Browser checks use an already installed Google Chrome (`channel: 'chrome'`). Tests use the Miniflare bundled with Wrangler.

```sh
npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/
npm audit --registry=https://registry.npmjs.org/
npm run build
npm test
npm run test:timezones
npm run test:browser
npm run profile
npm run check:worker
```

`check:worker` is a packaging dry-run with Wrangler telemetry disabled; it does not deploy. Runtime/browser tests need permission to listen on loopback. They intercept external application requests and use ephemeral signed test tokens and fictional data; fixture telemetry is disabled. Dependency install/audit use the npm registry. Generated builds and test logs are ignored.

For a manual local preview:

```sh
npm run preview:fixture
```

Open the printed loopback URL. This uses a **synthetic local session**, not the real Access service; it is for fictional-data UI review only. Stop with Ctrl-C. It binds only to `127.0.0.1`. The fixture is excluded from the production build, and production has no development-auth environment switch.

The final verification used a fresh `npm ci` installation from this lockfile, with lifecycle scripts disabled, after removing the borrowed dependency links. No source package resolves to a local path. The initially pinned Wrangler 4.115.0 tool chain had npm audit findings through Sharp and Undici; Wrangler 4.151.1 resolves them, and the final full-tree audit reported zero advisories. This does not require a Cloudflare account or paid service. See QA.md for exact installation evidence.

The root repository's `bun run test` is a separate storefront regression check. This work ran it successfully against the unchanged root sources using the existing root dependency installation.

## Authentication and privacy

Every production request must use the exact HTTPS origin `reports.cardblueprints.com`. Alternate hosts, workers.dev names, previews, HTTP and nonstandard ports are rejected before any assets or generation. The Worker then validates `Cf-Access-Jwt-Assertion` using RS256 against the configured Access team's HTTPS JWKS endpoint, issuer, application audience, expiry, issue time, subject and exact allowed email **therealcassrice@gmail.com** (case-insensitive only; no Gmail plus-address or googlemail aliases). An email header alone grants no access. Configuration and JWKS failures deny access.

Static Assets use `run_worker_first: true`, so authentication runs before file delivery. `html_handling: "none"` preserves `/report.html` and prevents asset canonicalization from redirecting `/index.html` back to `/`. Only seven built asset files are served; Worker code, maps, test code and data files are not browser assets. The asset request receives no incoming cookies or JWT headers. All responses set private/no-store cache headers, CSP, no-referrer, nosniff, framing denial and noindex headers. Query strings are rejected.

Generation accepts same-origin JSON POSTs only, with a streamed 200,000-byte cap and existing model limits. Tokens are checked again after body receipt and before returning results. Names, notes and writing remain escaped plain text. No client HTML from imported drafts is trusted. The report iframe is sandboxed without script permission.

Worker observability is disabled and application code does not log tokens, personal inputs or results. Cloudflare still processes requests and may retain its own Access/platform metadata under the account's settings; no claim of platform-wide zero logging is made. Authorized users receive generated facts and HTML in their browser and can save them.

Local JWT validation cannot discover server-side revocation before the token expires. **Real Cloudflare Access protection in front of this Worker is required.** Its All traffic scope and policy precedence must be verified, not inferred from the JWT guard. Cloudflare documents roughly 20–30 seconds for revocation propagation; an existing global identity session may also allow reauthentication depending on configuration. Choose and test the actual session/login policy before release. The browser client clears displayed results on a detected expiry or denial; it cannot revoke files already downloaded.

## Approval-dependent deployment prerequisites

These steps remain unperformed. Account provisioning, Access grants/policies, DNS changes, deployments and paid upgrades need separate authorization.

1. The existing Wrangler OAuth session verifies `therealcassrice@gmail.com` and account `ed56f6f3b938abe4f3f024a53a789d4f`; the proposed Worker is absent in that account and public `reports` DNS returns NXDOMAIN. Chrome still needs Cass's sign-in. Confirm that account owns the `cardblueprints.com` zone, inspect DNS/routes and matching Access policies, and verify current Workers/Zero Trust plans. Detailed evidence and the browser handoff are in [ACCOUNT-SETUP.md](ACCOUNT-SETUP.md). Do not modify public Pages settings or copy its secrets/bindings.
2. Decide the approved plan. Access Free is advertised at $0 for teams under 50 users, but Zero Trust onboarding still involves selecting a plan and supplying payment details. Workers Free currently documents 100,000 requests/day and 10 ms CPU per invocation; worker-first asset requests count toward Worker usage. This code has no entitlement to a free plan and must not silently upgrade. Workers Paid starts at $5/month plus usage; that is not approved here.
3. If approved, establish the separate Worker while retaining blank Access team/audience settings, no public route and disabled workers.dev/previews. Prepare a Cloudflare Access application for **this Worker → All traffic**, with one Allow rule: Emails equals **therealcassrice@gmail.com** and proposed app/policy sessions of one hour. Review and approve the exact grant before applying it. The quick wizard's whole-account/email-domain options are too broad; use its custom policy editor without temporarily granting broader access. Do not add Everyone, email-domain-wide, Bypass or service-token grants. Review hostname/path applications because their policies can override the Worker application. Keep public storefront access unchanged.
4. Obtain the Access team domain and this application's AUD from the verified account. Populate an ignored `wrangler.local.json` copied from `wrangler.json`, with the correct account ID. `ACCESS_TEAM_DOMAIN` must be only the team hostname ending in `.cloudflareaccess.com`; `ACCESS_AUD` is the application's 64-character hex audience; retain `ALLOWED_EMAIL: "therealcassrice@gmail.com"`. Do not put API tokens in JSON or source control. Keep `workers_dev: false`, `preview_urls: false`, `run_worker_first: true` and both asset handling settings unchanged.
5. After Access is active and its scope checked, approve the domain/DNS change and set exactly one custom domain entry: `{"pattern":"reports.cardblueprints.com","custom_domain":true}`. No wildcard routes or custom preview domains. Review a dry-run using the final local configuration before the separately authorized deployment.
6. Accept the deployed boundary using a fresh unauthenticated browser, a denied identity and Cass's identity. Confirm every asset/API is protected; wrong/forged/expired tokens fail; workers.dev/previews/other aliases cannot serve it; the public site remains unaffected; sign out, expiry, revocation and reauthentication preserve the intended behavior. Exercise JWKS rotation/unavailability and inspect caching behavior.
7. Measure **Cloudflare billed CPU** for cold and warm requests, including the three-person Family maximum writing case and Timing Map, before deciding that Workers Free is usable. Local numbers in QA.md do not certify this limit. If production exceeds it, stop for a separate performance/plan decision rather than enabling a paid plan automatically.

There is no deployment workflow for these tools. The existing root `.github/workflows/deploy.yml` triggers the **public-site deployment on every push to main, without a path filter**. Do not merge or push this branch to main as a harmless way to save private-tools work. Any later integration/release requires a deliberate plan around that trigger.

Authoritative platform references checked for this work: [Worker Access protection](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Worker-first Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [Access pricing](https://www.cloudflare.com/sase/products/access/), [Zero Trust onboarding](https://developers.cloudflare.com/cloudflare-one/setup/), [Worker limits](https://developers.cloudflare.com/workers/platform/limits/), [Worker pricing](https://developers.cloudflare.com/workers/platform/pricing/).
