# Development ledger

Last updated: **2026-10-18T16:47:06Z**. This is a current-state index; PRs remain the authoritative code history. A draft PR, passing check or approval to implement is not approval to merge or deploy.

Initial ledger [PR #187](https://github.com/cassidyrice/cardology-mirror/pull/187) was merged at `50d4d2a0aeaa1b72717edb1de7844a9f0e97f356`; its [automatic deployment succeeded](https://github.com/cassidyrice/cardology-mirror/actions/runs/39145550679). That merge added only this ledger. The implementation PRs remain unmerged.

## Workstreams

| Workstream | Responsible task | Branch / PR | Latest tested commit | Status |
| --- | --- | --- | --- | --- |
| Storefront | A | `storefront/manual-readings-20261018` · [#185](https://github.com/cassidyrice/cardology-mirror/pull/185) | `a45362038e2ac4e0c98c08e116fee6fbefd98588` | Blocked for launch; verified draft |
| Desktop report builder | A | `review/report-builder-verified-20261018` · [#184](https://github.com/cassidyrice/cardology-mirror/pull/184) | `aa16fed7a518f4c745c4da77669f0b6bde61dc17` | Reviewed; draft, not released |
| Private hosted tools | B | `feat/private-report-tools` · [#186](https://github.com/cassidyrice/cardology-mirror/pull/186) | `6c1f088e7ad318fbeb3eb0856e14f0e0e3160473` | Blocked for hosting; locally verified |
| Hosted one-person Timing repair | B | `feat/private-individual-timing` · [#188](https://github.com/cassidyrice/cardology-mirror/pull/188) | `6df7f3083f2639c5bdacbd228bcc6e5d1d10fa0c` | Independently reviewed locally; draft, not deployed |
| Stan one-person Timing correction | A | External listing; branch/PR not applicable | Git commit not applicable; external revision ID unverified | Published and verified live |

Responsible tasks: **A** — storefront/desktop integration and Stan task `01a14d9a-c11d-72a3-8b8c-ec99154bd0c2`; **B** — hosted tools/Timing task `01a14da9-558e-724f-afe2-9285cc7600d6`. These identify the work owners, not approval grants.

## Evidence, dependencies and remaining approvals

- **Storefront:** [CI passed](https://github.com/cassidyrice/cardology-mirror/actions/runs/39144382651); [PR validation](https://github.com/cassidyrice/cardology-mirror/pull/185) records 411 root tests plus integration/privacy/sitemap checks, prior browser checks and a build matching the tested commit. Independent of desktop/private source. Local one-person Timing fulfillment passed review in #188; ordering stays disabled pending hosted acceptance and release authorization. Reconcile older pricing draft #183 before any integration.
- **Desktop:** [CI passed](https://github.com/cassidyrice/cardology-mirror/actions/runs/39104887677); [pinned verification](https://github.com/cassidyrice/cardology-mirror/blob/aa16fed7a518f4c745c4da77669f0b6bde61dc17/desktop/REPORT-BUILDER.md#verification-integration-checked-2026-10-18) and [PR #184](https://github.com/cassidyrice/cardology-mirror/pull/184) record 11 tests, 15 PDF fixtures/418 pages, UI/native exports and build checks. Current desktop Timing expects three people and Family four; preserve legacy drafts. No merge/release approval is recorded here.
- **Private hosted tools:** stacked on desktop #184, so #186 shows only `private-tools/`. [CI passed](https://github.com/cassidyrice/cardology-mirror/actions/runs/39144404654); [pinned QA](https://github.com/cassidyrice/cardology-mirror/blob/6c1f088e7ad318fbeb3eb0856e14f0e0e3160473/private-tools/QA.md) records 30 tests, timezone/browser/PDF coverage and a packaging dry-run. Family supports two or three people with private v3 drafts; desktop v2 compatibility remains deliberately separate. Real hosting login, Access coverage/revocation/routing and billed-CPU/plan suitability remain unverified. Provisioning, access grants, DNS, paid plans and deployment need separate approval.
- **Timing repair:** #188 is stacked on #186 at `6c1f088`. [Pinned QA](https://github.com/cassidyrice/cardology-mirror/blob/6df7f3083f2639c5bdacbd228bcc6e5d1d10fa0c/private-tools/TIMING-QA.md) records 35 private/desktop tests, timezone/browser checks, 13 PDFs/264 pages, packaging dry-run and 409 root tests. [Independent PASS recorded in #188](https://github.com/cassidyrice/cardology-mirror/pull/188) is tied to the exact tested commit: reviewer task `01a14dea-b79e-7133-a63f-d0526a2bf0e0` checked 24 calculation cases, ten byte-identical legacy HTML comparisons, five focused tests and all saved PDFs plus visual samples; browser interactions were not independently rerun. No blocking local findings. Only the three approved production files changed; calculations, authentication, desktop model/UI, checkout, deployment configuration and dependencies remain unchanged. Hosting/Access/capacity, payment/email follow-up acceptance and release authorization are still required. Desktop parity is optional.
- **Stan:** [live $49 one-person listing](https://stan.store/mycardblueprint/p/your-12month-timing-map) and [corrected confirmation PDF](https://assets.stanwith.me/live/msc/29403259/sfk98/timingmaponepersonorderconfirmation.pdf). Owner verified buyer-only intake and saved attachment on **2026-10-18T16:21:30Z**. This correction is complete; website Timing ordering remains disabled pending hosted acceptance and release authorization. A completed payment, receipt and support inbox/draft/approval/delivery flow remain **unverified**; the acceptance owner is **unverified**.

## Live and rollback state

| Surface | Verified live revision / state | Rollback revision | Evidence time (UTC) |
| --- | --- | --- | --- |
| Public Pages site | `50d4d2a0aeaa1b72717edb1de7844a9f0e97f356` | **Unverified** | 2026-10-18T16:45:26Z |
| Separate `cardology-unlock` Worker | **Unverified** | **Unverified** | Not verified in this update |
| Private hosted tools | Not deployed by these workstreams; live revision **unverified** | **Unverified** | 2026-10-18T16:47:06Z |

The Pages value came from an HTTP 200 [live version stamp](https://cardblueprints.com/version.txt?timing-ledger=20261018T164432Z), not an inference from `main`. Post-#187 checks found all seven public probes healthy, unchanged robots/sitemap bodies and page HTML differing only by the Next build identifier. The older `ops/DEPLOY-SOURCE.md` record does not establish the current Worker or rollback revisions. No storefront, desktop, private-tools or Timing-repair PR above was deployed by this work.

## Update rules

1. The responsible owner replaces their row on material progress: branch/PR changes, a new tested commit, review, blocker or release. Update the UTC timestamp; do not append a second commit history.
2. Mark **reviewed** only with a review result and verification evidence tied to the exact commit. Mark **deployed** only with a production observation/deployment record and timestamp. Record a rollback revision only after verifying the actual recoverable target; otherwise write **unverified**.
3. Keep dependencies and remaining approvals explicit. Passing tests do not grant publication, access or deployment approval. Link evidence rather than copying internal discussions, personal data, credentials or customer artifacts.
4. Submit ledger updates through a documentation PR. The [production workflow](https://github.com/cassidyrice/cardology-mirror/blob/81d065575b5a2f82a7b6f9a610a83ec6d77d61a6/.github/workflows/deploy.yml) runs on **every push to main**, including documentation-only changes. Feature-branch pushes and PR checks do not deploy; no main merge or deployment is authorized by this ledger.
