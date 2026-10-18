# Private reports: Cloudflare setup decision

Prepared on 18 October 2026. This is a proposal for approval, not an executed deployment. The exact permitted user is **therealcassrice@gmail.com**. The local configuration already pins that address; blank Access team/audience values still deny all requests.

## Verified account and hostname state

| Item | Read-only result |
| --- | --- |
| Existing Wrangler login | Existing OAuth session belongs to `therealcassrice@gmail.com`; no new login, token or permission grant was created. |
| Account | `Therealcassrice@gmail.com's Account`, ID `ed56f6f3b938abe4f3f024a53a789d4f`. |
| Proposed Worker | `cardblueprints-private-tools` does not exist in that account. An authenticated `wrangler deployments list --name cardblueprints-private-tools --json` returned Cloudflare code `10007`, explicitly stating that the Worker does not exist. |
| Proposed hostname | Public DNS lookup for `reports.cardblueprints.com` returned `NXDOMAIN`. The root domain uses `kip.ns.cloudflare.com` and `kayleigh.ns.cloudflare.com`. This does not prove which account owns the zone or exclude unpublished configuration. |
| Browser dashboard | Chrome is signed out at `https://dash.cloudflare.com/login`. The visible Mac browser has a **🔒 Private reports** tab group containing the Cloudflare Dashboard tab, with a saved Google profile for the confirmed email. The tab is preserved for handoff. |
| Still to inspect | Zone ownership in the verified account; existing DNS, Worker routes and matching Access applications; Workers subscription/usage; Zero Trust organization, plan, seats, team domain and identity providers. |

The CLI session works. A new Cloudflare account or a refreshed, broader CLI authorization is not needed for these completed checks. Wrangler used the existing credential internally; the agent did not inspect, print or copy credential material. The dashboard's Google sign-in choice does not establish the identity provider configured for an Access application.

## Secure sign-in handoff

Cass can open **Chrome → 🔒 Private reports → Cloudflare Dashboard** and complete the existing Google sign-in directly in that window. The button includes acceptance of Cloudflare terms, so that action was left to Cass. Passwords, verification codes and payment details belong in the vendor's browser flow, never in chat or the repository.

After sign-in, inspect the account above and the unresolved items in the table without saving changes. Reuse an existing Zero Trust organization and its suitable login method. If the zone belongs to another account, stop and resolve the target before creating anything.

## Proposed minimum scope

| Setting | Proposed value |
| --- | --- |
| Cloudflare account | The verified account above, subject to confirming zone ownership |
| Worker | One new Worker: `cardblueprints-private-tools` |
| Access application | `Card Blueprints private tools`; self-hosted; destination type `worker`, using this Worker's actual ID; **All traffic for this Worker only** |
| Allow policy | One exact email: `therealcassrice@gmail.com`; no other Include alternatives |
| App and policy session duration | `1h`; review existing identity-provider/global-session behavior without changing account-wide session settings |
| Login method | Reuse a suitable existing provider; a new Zero Trust organization receives Cloudflare's default provider, restricted to account members |
| Public binding, after Access verification | Exactly `reports.cardblueprints.com` as a Worker custom domain |
| Alternate entry points | `workers_dev: false`, `preview_urls: false`, no wildcard routes |
| Storage/integrations | Static Assets only; no database, bucket, email integration, service token, tunnel, WARP enrollment or new API credential |

Cloudflare documents protection scoped to one Worker across its domains and routes. Matching hostname/path applications take precedence and must be inspected. The quick wizard's whole-account and email-domain choices are broader than the requested identity. Prepare the exact-email policy in the custom policy editor before applying protection; if that editor cannot attach it to the Worker destination, stop before saving. Do not temporarily enable a broader grant. [Worker Access configuration](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)

The application policy must express this exact Include rule:

```json
{"decision":"allow","include":[{"email":{"email":"therealcassrice@gmail.com"}}]}
```

The Worker separately verifies the signed Access assertion and the same email, ignoring case only. Gmail plus-addresses, `googlemail.com` aliases, unrelated addresses and an email header without a signed assertion are rejected. This is covered by the 30 passing local tests; real Access policy evaluation remains a deployment acceptance check.

For a new organization, Cloudflare automatically supplies an identity provider with account-member restriction. Keep that restriction and still apply the exact-email application policy. This avoids creating a new Google OAuth client or adding another login integration. Existing organizations require inspection first. [Cloudflare identity provider](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/)

## Costs checked against current official sources

| Option | Published cost and limit | Decision |
| --- | --- | --- |
| Access Free | $0; advertised for teams under 50 users | Proposed if the existing organization is eligible. Actual plan/seats are not yet verified. [Access pricing](https://www.cloudflare.com/sase/products/access/) |
| Workers Free | $0; 100,000 requests/day and 10 ms CPU per invocation | Proposed only if the account is on Free and measured edge CPU fits. Local Node results do not establish suitability. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Workers Paid | Minimum $5 USD/month per account; includes 10 million requests and 30 million CPU ms/month; additional usage is $0.30/million requests and $0.02/million CPU ms | **Not approved.** If already paid, this Worker shares the existing account allowances; incremental cost depends on total usage. If Free is inadequate, return with measured evidence and a separate decision. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |

All private asset requests invoke the authentication Worker because `run_worker_first` is enabled, so they consume Worker request allowance. Asset storage has no additional charge. [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

New Zero Trust onboarding requires payment details even when selecting Free; Cloudflare states that Free selection is not charged. If onboarding is necessary, Cass must review the actual plan/terms and enter payment details directly. No card collection or enrollment was attempted here. [Zero Trust setup](https://developers.cloudflare.com/cloudflare-one/setup/)

These are published rates, not a verified account invoice or a guarantee of a $0 deployment. Several local CPU p95 results exceed 10 ms; edge measurements are required. No paid plan, model API or additional usage purchase is authorized by this proposal.

## Ordered execution and approval points

1. **Read-only inspection after sign-in.** Confirm the account, zone, unused hostname, current subscriptions and Access hierarchy. Record the actual team domain and existing login provider. Stop on a conflicting route or policy; do not replace it automatically.
2. **Zero Trust onboarding, only if absent.** Prepare the Free plan selection and a team name for review; prefer an existing organization whenever available. Ask at the actual enrollment/terms step. Cass enters required payment details in the browser. Do not select a paid plan or add account members.
3. **Initial private Worker upload.** Request approval for the reviewed local commit and one new Worker in the confirmed account. Retain blank Access team/audience, no routes, disabled workers.dev/previews and worker-first assets. This is a remote deployment even though it has no public route. Capture its actual Worker ID after the approved upload.
4. **Exact Access grant.** Prepare the single-Worker application and exact-email policy above, with no hostname or account-wide expansion. Show the final settings and request action-time approval immediately before applying the persistent grant. Capture the resulting application AUD. Inspect higher-priority hostname/path policies before exposing the hostname.
5. **Final private-domain deployment.** Copy `wrangler.json` to ignored `wrangler.local.json`; set the verified account ID, team hostname and application AUD; retain the confirmed email and all protective settings. Add only `{"pattern":"reports.cardblueprints.com","custom_domain":true}` to routes. Review a dry-run of that exact configuration, recheck DNS, then request approval for the one custom-domain/DNS binding and deployment. Do not push to `main` as part of this operation.
6. **Accept the deployed boundary.** Check a fresh unauthenticated browser, a denied identity controlled by Cass, and Cass's exact identity. Verify every page/asset/API, alternate hosts, expiry, signout, revocation, key rotation and unavailable keys. Use fictional report inputs. Confirm the public site is unchanged and measure Cloudflare CPU for cold/warm Timing Map and two-/three-person Family requests, including maximum writing. Stop for a performance or plan decision if Free limits are unsuitable.

The next safe action is the browser sign-in handoff followed by read-only inspection. Later approvals are separate because they create persistent access, accept vendor terms, change DNS or deploy code; none has been performed. The existing public workflow deploys on every push to `main`, without a path filter, so this branch remains local until its integration/release is deliberately authorized.
