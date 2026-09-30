# App sales and fulfillment — September 30, 2026

The existing Card Blueprint App is on sale at $69 once. Production price binding is `STRIPE_PRICE_CARD_BLUEPRINT_APP`; existing project is `cardology-mirror`, account `acct_1U1a1dChx1yAVyrs`. The $13 question reading remains available. The approved operating plan and dated baseline are in `/Users/main/cardblueprints-ops/plans/revenue-90d-2026-09-30.md` and `/Users/main/cardblueprints-ops/outputs/revenue-90d-2026-09-30/`.

Before enabling sales on another environment, apply `migrations/0002_app_deliveries.sql` to the existing `READING_ORDERS` binding and configure price, Stripe webhook secret, access-token secret and existing Resend sender. Do not create new storage or products. Signed app payment completion persists the exact email payload before sending; concurrent/ambiguous retries reuse its provider idempotency key. Provider acceptance is not inbox delivery.

Recoverable failures return HTTP 503 so Stripe retries. Pending deliveries older than 23 hours move to review before Resend's 24-hour idempotency expiry. A successful owner alert can acknowledge a terminal review; it does not mean the buyer was emailed. Inspect only session ID/status/start timestamp first, and compare provider acceptance history before any manual resend. The stored payload contains private access and buyer data: do not print it in logs or reports. My purchases / success page can recover app access for a verified paid session.

If checkout or delivery breaks, disable `CARD_APP_ON_SALE` and use the guarded canonical deployment procedure; preserve this table and existing buyer access. Do not roll back database contents or delete fulfilled orders. Fix forward if the previous code would lose delivery idempotency.

Validation: `bun run test`, TypeScript, build, and `APP_QA_ORIGIN=http://127.0.0.1:3577 bun run test:app:browser`. Sandbox proof used real Stripe test checkout/payment/signed webhook plus local SQL and captured email; live paid inbox proof requires the owner's real purchase. Exclude it from revenue by session ID or `REVENUE_OWNER_EMAILS`.

Measure with `bash scripts/growth-report.sh 30`. Stripe paginated cash reconciliation governs monetary results. GSC clicks, anonymous tab sessions and raw sampled events describe different populations. No recurring job is created by this launch.
