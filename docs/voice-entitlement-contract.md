# Voice entitlement contract — cardology-unlock Worker

**Status: REQUIRED, NOT YET IMPLEMENTED IN THIS REPOSITORY.**

The website (this repo) sells three voice readings and describes their limits
in public copy, checkout metadata, and legal terms. The AI reading line itself
is answered by the external `cardology-unlock` Cloudflare Worker, whose source
is **not** in this repository. Nothing in this repo technically enforces call
duration, session consumption, or fair use — the Worker must. Until the Worker
implements this contract, the limits below are policy statements, not
technical controls.

## Canonical offers (lib/products.ts)

| Slug | Price | Access type | Session cap | Window | Completed calls |
|---|---|---|---|---|---|
| `quick-question` | $19 | `single_session` | 5 min | 30 days | 1 |
| `complete-reading` | $39 | `single_session` | 15 min | 30 days | 1 |
| `season-pass-90` | $199 | `season_pass` | 15 min/session | 90 days | unlimited (fair use) |

Checkout sessions carry this entitlement in Stripe metadata (set by
`app/checkout/[offer]/route.ts`, values derived server-side from
`lib/products.ts`, never from the client):

```
offer_slug            quick-question | complete-reading | season-pass-90
offer_name            display name
access_type           single_session | season_pass
max_session_minutes   "5" | "15"
access_days           "30" | "90"
max_completed_calls   "1" (absent for season pass)
```

Stripe Checkout collects the buyer's phone number
(`phone_number_collection.enabled = true`); it arrives in
`checkout.session.completed` as `customer_details.phone`.

## What the Worker must enforce

1. **Recognize the purchasing phone number.** Match inbound caller ID against
   the phone number captured at checkout. Access is per-number, not per-email.
2. **Read the canonical purchased entitlement** (from the Stripe webhook /
   metadata above, or its own store seeded from it) — never trust caller
   input for entitlement values.
3. **Quick Question:** at most one completed call, hard-capped at 5 minutes.
4. **Complete Reading:** at most one completed call, hard-capped at 15 minutes.
5. **Consume single-session offers only on completion.** A call that fails to
   connect, is abandoned before the reading starts, or has zero/near-zero
   duration must not consume the session. Define a concrete threshold (e.g.
   reading delivered ≥ N seconds) and apply it consistently.
6. **Enforce Season Pass expiration:** reject paid access more than 90 days
   after purchase (and single-session access more than 30 days after
   purchase, if unused).
7. **Cap Season Pass sessions at 15 minutes** each.
8. **One active session at a time** per purchased entitlement — reject a
   second concurrent call on the same access.
9. **Fair use:** detect and reject account sharing (multiple simultaneous
   numbers), automated/robotic calling, and abusive or unusually excessive
   use, per the published fair-use policy.
10. **Record usage idempotently.** Duplicate Stripe webhook deliveries or
    duplicate call events must not double-grant or double-consume access.
    Key usage records on Stripe session/event IDs and call IDs.
11. **Recovery for interrupted calls:** if a paid session drops mid-call for
    technical reasons, the caller should be able to resume without losing the
    session (e.g. a grace window that treats a reconnect within X minutes as
    the same session).
12. **Auditable usage records:** store per-call records (number, offer,
    start/end, duration, consumed y/n, reason) so refund reviews and support
    (`/refund-policy` promises a review of "the access record") are possible.

## What this repo already does

- Sells the three offers and 303-redirects `/checkout/[slug]` to Stripe
  Checkout with the metadata above.
- Webhook (`app/api/checkout/webhook/route.ts`) emails the buyer start-here
  instructions and mints a **site** access token (30/90 days, matching
  `accessDays`) for the web reading tools. This token gates website AI
  features only — it does not and cannot limit phone calls.
- Publishes the limits in `/readings`, `/terms-of-service`,
  `/refund-policy`, and checkout copy.

## Explicitly out of scope here (do not claim as done)

- Minute enforcement on calls.
- Single-session consumption.
- Concurrency limits, fair-use detection, usage ledger.

When the Worker implements this contract, verify each rule with real test
calls (free preview, each paid tier, expiry, duplicate webhook replay) before
publicly describing the limits as enforced.
