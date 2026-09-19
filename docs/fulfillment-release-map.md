# Active repositories, routes and local release contract — 2026-09-19

This describes the proposed local integration, not production. The read-only source verifier still reports Pages `dbccd66` and `cardology-unlock` `7bcb1504`; `/api/one-question` is currently an HTML 404. `STATE.md`'s instant-reading entry does not match those probes. Canonical site main is `17dc87e`, not deployed. Do not reset or restore `ac5f70b` wholesale.

| Owner | Routes / responsibility | Local integration source |
|---|---|---|
| Pages `cardology-mirror` | Calculator; product/review; `/checkout/deep-dive/session`; `/api/checkout/webhook`; `/checkout/success`; new `/api/one-question`; historical `/blueprint`, report/download/membership tokens | `cardblueprints-cleanup-20260919`, branch `codex/fulfillment-cleanup-20260919` |
| Python `cardology-reading` | Authenticated writer POST at `READING_WORKER_URL`; card math, brief, voice, bounded correction pass | `cardblueprints-reading` main `8df20e9`, unchanged |
| `cardology-unlock` | `/born-on`, `/compatibility`, Worker sitemaps; legacy `/webhook/stripe`, access and reports | `cardblueprints-unlock-cleanup-20260919`, branch `codex/paid-fulfillment-cleanup-20260919` |
| Manual fallback | Existing `reading` launcher and original Python CLI | Restored byte-for-byte from `Backups/cardology-2026-09-16/cardblueprints-ops/card-reading` into `cardblueprints-ops/card-reading`; synthetic brief checks only |

## Paid flow

Review collects birthday and question → Stripe session metadata retains slug `deep-dive`, SKU `one-question-47`, configured price unchanged → signed completed or async-payment-succeeded webhook checks payment → one atomic D1 INSERT keyed by session ID authorizes one writer attempt → existing Python writer → D1 persists text → strict Resend send with stable per-order key and persisted payload → delivery acknowledgment. A paid success-page fallback shares this same reservation; it cannot race into another generation. Its existing confirmation copy stays intact; only purchased text is added when available.

D1 is the primary store, not a KV lock. Primary-only reads and conditional SQL writes guarantee one generation reservation. Generation failures, disconnects and ambiguous storage outcomes never automatically clear it. A failed/unfinished generation needs operator reconciliation. This is at-most-once automatic generation, not an exactly-once external transaction guarantee. The provider has no idempotency contract verified in this task. Its existing correction pass remains part of the one writer request.

Reservations still writing after five minutes surface as failed/review and trigger the operator notification; the reservation remains intact. Delivery retries read saved text. Concurrent email attempts use the same Resend key and persisted body including the normalized original sender; after 23 hours from the first attempt, ambiguous delivery moves to `review` before Resend's 24-hour key retention ends. Missing email configuration throws, never marks sent. Review notifications go only to the configured operator, use a separate key, and retain a paste-ready original CLI command with an instruction to reconcile first. Notification failure leaves Stripe's event retryable.

Historical KV text remains readable and imports with delivery `review` (unknown prior email outcome). Old missing records must not authorize another generation: `READING_FULFILLMENT_START` is a required Unix timestamp in seconds, and sessions created before that cutoff require manual reconciliation. Existing D1/KV text can still be retrieved. Reading access retains the 400-day window; permanent D1 order tombstones prevent regeneration after expiry. D1 data has no automatic TTL: operators must purge expired `reading` and `delivery_payload` values while preserving the session tombstones. No live retention job was created.

All existing token formats, fallback secret order and expiry comparisons remain. Gate validation now rejects payloads carrying another product family's `slug`; old gate email/expiry tokens remain valid, and buyer links continue working in their intended verifier. This avoids a token-format migration.

## Required integration/release sequence (not executed)

1. Review these commits and the sibling `HANDOFF.md` evidence. Merge/cherry-pick the site branch into clean canonical `cardology-elroy-qa` main; integrate the legacy Worker branch in its canonical repository. Do not deploy from either isolated worktree. Keep current main history and cleanup `62da374` (integrated as `3c82fc3`).
2. In an authorized release window, provision D1 `cardblueprints-reading-orders`, replace `READING_ORDERS_PLACEHOLDER` in `wrangler.toml`, and apply `migrations/0001_reading_orders.sql` to that database before enabling the site flow. Keep the existing READINGS namespace and all R2/analytics bindings. The placeholder deliberately blocks production preflight.
3. Set `READING_FULFILLMENT_START` to the chosen activation Unix timestamp (new sessions only). Verify `READING_WORKER_URL`, `READING_SHARED_SECRET`, the writer's model key, Resend sender/key and operator email are configured. No secret values were read or changed here. Use approved CLI secret operations one at a time, never a dashboard environment save.
4. Ensure both Stripe webhook subscriptions receive `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use only the Card Blueprint account. No settings or real transactions were inspected/changed here.
5. Repeat normal/expanded tests, typecheck, production and adapter builds, generated SEO comparison, Worker contracts, and desktop/mobile review checks from integrated source. Next 15.5.24 + React 19.0.8 passed local adapter build/runtime probes with adapter 1.13.16, but Next exceeds its declared <=15.5.2 peer range. The adapter's generic dynamic-template prerender warnings did not produce invalid functions; sampled generated and unknown-slug routes passed locally. Do not treat this as upstream-supported compatibility.
6. Only the authorized release owner deploys the legacy Worker and Pages from their canonical sources. Record actual source/version (`record-deploy.sh`) and run `verify-deploy-source.sh`, preserving rollback artifacts. Keep `STATE.md` factual.
7. Separately authorize a controlled end-to-end payment/email test if needed. No live purchase, model call, email or production fulfillment was proven by this work.

## Recovery / deliberately excluded changes

Inspect D1 status and the provider history before running the original `reading M/D/YYYY 'question' --send 'buyer'` command. If D1 already holds text, deliver that text without generation; the CLI's existing `--file` mode is available for a saved reading. Never delete a generation tombstone to trigger a retry. After manual reconciliation, acknowledge the stored order's delivery state through an audited operator action. Stuck writing rows, failed generations and `delivery='review'` require this human check.

No public copy was changed. Proposed separately for Cass: replace the homepage's claim that readings are “written by hand” with wording consistent with automated drafting and manual review; replace unconditional success-page “Receipt and instructions were sent” with delivery-state-aware wording. Those are public-copy decisions and are excluded here. No new product, automatic retry-generation policy, replacement CLI, adapter migration, live retention automation, or deployment was introduced.

Sources: https://developers.cloudflare.com/d1/best-practices/read-replication/ ; https://resend.com/docs/dashboard/emails/idempotency-keys ; https://nextjs.org/blog/august-2026-security-release .
