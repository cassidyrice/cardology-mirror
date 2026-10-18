# Private Report Builder and Spread Explorer

Local implementation for `https://reports.cardblueprints.com`, based on `aa16fed`. The production configuration is deliberately inactive: no domain routes, no workers.dev or preview URLs, and blank Access identity settings. Missing identity configuration denies requests. No Cloudflare account, Access application, DNS record or deployment has been created by this work.

All source changes are under `private-tools/`. The desktop application, calculation modules, report templates, public storefront and its deployment configuration are unchanged. See [QA.md](QA.md) for executed checks and remaining deployment gates.

## Behavior and boundaries

- Report Builder supports the existing Timing Map, Chemistry and Professional reports, plus **exactly three people** for the private Family Snapshot. It uses the existing Family template and full shared calculation output; there is no five-person mode or filtered subset of family facts.
- Spread Explorer provides all six existing views, all 90 boards, card details and JSON export.
- Calculations and report rendering run in the Worker. Browser bundles contain UI code only. `build.mjs` imports the existing engine and renderer into the Worker and rejects calculation/data imports in browser assets.
- Draft JSON, generated HTML and engine JSON download through the browser. PDF uses the report iframe's browser print dialog; select Save as PDF. There is no server file store, database, object storage or email integration.
- Unsaved inputs live in the current tab. Session expiry clears generated content and disables exports but keeps inputs so the draft can be downloaded before signing in in a new tab. Sign out clears the workspace and broadcasts to other open tool tabs. Previously downloaded files remain on the computer.
- Private Family drafts use format `card-blueprints-report`, **version 3**, with exactly three people. The unchanged desktop Family format is version 2 with four people. Importing that desktop Family draft is rejected with an explanatory error; nobody is silently removed. Other offer drafts retain existing version 2 behavior and supported legacy migration. Desktop cannot read the new Family v3 draft without a separate future change.

## Local commands

Run from `private-tools/`. Prerequisites are Node 22 or newer and the versions in `package.json`: jose 5.9.6, esbuild 0.25.12, Playwright 1.60.0 and Wrangler 4.115.0. Browser checks use an already installed Google Chrome (`channel: 'chrome'`). Tests use the Miniflare bundled with Wrangler.

```sh
npm run build
npm test
npm run test:timezones
npm run test:browser
npm run profile
CLOUDFLARE_SEND_METRICS=false npm run check:worker
```

`check:worker` is a packaging dry-run; it does not deploy. Runtime/browser tests need permission to listen on loopback. They intercept external network requests and use ephemeral signed test tokens and fictional data. Generated builds and test logs are ignored.

For a manual local preview:

```sh
npm run preview:fixture
```

Open the printed loopback URL. This uses a **synthetic local session**, not the real Access service; it is for fictional-data UI review only. Stop with Ctrl-C. It binds only to `127.0.0.1`. The fixture is excluded from the production build, and production has no development-auth environment switch.

No dependencies were installed during implementation. This checkout reuses existing packages through ignored `node_modules` symlinks. A fresh checkout requires those dependencies to be provisioned separately. No private-tools lockfile was created; capture and audit the resolved dependency tree before an approved production release. Do not copy the ignored local links into an artifact or treat the borrowed installation as a reproducible release install.

The root repository's `bun run test` is a separate storefront regression check. This work ran it successfully against the unchanged root sources using the existing root dependency installation.

## Authentication and privacy

Every production request must use the exact HTTPS origin `reports.cardblueprints.com`. Alternate hosts, workers.dev names, previews, HTTP and nonstandard ports are rejected before any assets or generation. The Worker then validates `Cf-Access-Jwt-Assertion` using RS256 against the configured Access team's HTTPS JWKS endpoint, issuer, application audience, expiry, issue time, subject and exact allowed email. An email header alone grants no access. Configuration and JWKS failures deny access.

Static Assets use `run_worker_first: true`, so authentication runs before file delivery. `html_handling: "none"` preserves `/report.html` and prevents asset canonicalization from redirecting `/index.html` back to `/`. Only seven built asset files are served; Worker code, maps, test code and data files are not browser assets. The asset request receives no incoming cookies or JWT headers. All responses set private/no-store cache headers, CSP, no-referrer, nosniff, framing denial and noindex headers. Query strings are rejected.

Generation accepts same-origin JSON POSTs only, with a streamed 200,000-byte cap and existing model limits. Tokens are checked again after body receipt and before returning results. Names, notes and writing remain escaped plain text. No client HTML from imported drafts is trusted. The report iframe is sandboxed without script permission.

Worker observability is disabled and application code does not log tokens, personal inputs or results. Cloudflare still processes requests and may retain its own Access/platform metadata under the account's settings; no claim of platform-wide zero logging is made. Authorized users receive generated facts and HTML in their browser and can save them.

Local JWT validation cannot discover server-side revocation before the token expires. **Real Cloudflare Access protection in front of this Worker is required.** Its All traffic scope and policy precedence must be verified, not inferred from the JWT guard. Cloudflare documents roughly 20–30 seconds for revocation propagation; an existing global identity session may also allow reauthentication depending on configuration. Choose and test the actual session/login policy before release. The browser client clears displayed results on a detected expiry or denial; it cannot revoke files already downloaded.

## Approval-dependent deployment prerequisites

These steps remain unperformed. Account provisioning, Access grants/policies, DNS changes, deployments and paid upgrades need separate authorization.

1. Confirm the intended Cloudflare account owns the `cardblueprints.com` zone, inspect existing `reports` DNS/routes and Access policies, and verify the current plan. The dashboard reached a sign-in screen during this task; account state is unverified. Do not modify public Pages settings or copy its secrets/bindings.
2. Decide the approved plan. Access Free is advertised at $0 for teams under 50 users, but Zero Trust onboarding still involves selecting a plan and supplying payment details. Workers Free currently documents 100,000 requests/day and 10 ms CPU per invocation; worker-first asset requests count toward Worker usage. This code has no entitlement to a free plan and must not silently upgrade. Workers Paid starts at $5/month plus usage; that is not approved here.
3. If approved, establish the separate Worker while retaining blank identity settings, no public route and disabled workers.dev/previews. Add a Cloudflare Access application for **this Worker → All traffic**, with an Allow rule for Cass's confirmed single email only. Do not add Everyone, email-domain-wide, Bypass or service-token grants. Review hostname/path applications because their policies can override the Worker application. Keep public storefront access unchanged.
4. Obtain the Access team domain, this application's AUD and Cass's exact authorized email from the verified account. Populate an ignored `wrangler.local.json` copied from `wrangler.json`, with the correct account ID. `ACCESS_TEAM_DOMAIN` must be only the team hostname ending in `.cloudflareaccess.com`; `ACCESS_AUD` is the application's 64-character hex audience; `ALLOWED_EMAIL` is one address. Do not put API tokens in JSON or source control. Keep `workers_dev: false`, `preview_urls: false`, `run_worker_first: true` and both asset handling settings unchanged.
5. After Access is active and its scope checked, approve the domain/DNS change and set exactly one custom domain entry: `{"pattern":"reports.cardblueprints.com","custom_domain":true}`. No wildcard routes or custom preview domains. Review a dry-run using the final local configuration before the separately authorized deployment.
6. Accept the deployed boundary using a fresh unauthenticated browser, a denied identity and Cass's identity. Confirm every asset/API is protected; wrong/forged/expired tokens fail; workers.dev/previews/other aliases cannot serve it; the public site remains unaffected; sign out, expiry, revocation and reauthentication preserve the intended behavior. Exercise JWKS rotation/unavailability and inspect caching behavior.
7. Measure **Cloudflare billed CPU** for cold and warm requests, including the three-person Family maximum writing case and Timing Map, before deciding that Workers Free is usable. Local numbers in QA.md do not certify this limit. If production exceeds it, stop for a separate performance/plan decision rather than enabling a paid plan automatically.

There is no deployment workflow for these tools. The existing root `.github/workflows/deploy.yml` triggers the **public-site deployment on every push to main, without a path filter**. Do not merge or push this branch to main as a harmless way to save private-tools work. Any later integration/release requires a deliberate plan around that trigger.

Authoritative platform references checked for this work: [Worker Access protection](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Worker-first Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [Access pricing](https://www.cloudflare.com/sase/products/access/), [Zero Trust onboarding](https://developers.cloudflare.com/cloudflare-one/setup/), [Worker limits](https://developers.cloudflare.com/workers/platform/limits/), [Worker pricing](https://developers.cloudflare.com/workers/platform/pricing/).
