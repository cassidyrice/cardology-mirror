# Stripe Checkout Studio integration — 2026-09-09

Scenario A: the existing Checkout Session call in
[app/checkout/[offer]/session/route.ts](app/checkout/[offer]/session/route.ts)
was updated in place. No new files, routes, or infrastructure. Nothing deployed.

## Values to Replace

None. `mode`, `success_url`, `cancel_url`, and `line_items` already hold real values
(no placeholders):

| Field | Current Value | Notes |
|-------|--------------|-------|
| mode | `"payment"` / `"subscription"` (branch on product) | Real. |
| success_url | `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}` | Real. |
| cancel_url | computed per product (`cancelUrl`) | Real. |
| line_items[].price | `deepDivePriceId` from Pages secret `STRIPE_PRICE_52XSEVEN_BLUEPRINT` | Real. |

## Configured Parameters

Set from Checkout Studio in
[app/checkout/[offer]/session/route.ts](app/checkout/[offer]/session/route.ts):

| Parameter | Value | Status |
|-----------|-------|--------|
| billing_address_collection | `"auto"` | already present |
| phone_number_collection | `{ enabled: false }` | already present |
| automatic_tax | `{ enabled: false }` | added (both branches) |
| allow_promotion_codes | `false` | **resolved 2026-09-22** — both branches; see decision 1 |
| payment_method_collection | `"always"` | added (subscription branch only, per Stripe rule) |
| submit_type | `"auto"` | added (both branches) |
| origin_context | `"web"` | added (both branches) |
| ui_mode | `"hosted_page"` | **not written** — see below |

## Decisions to confirm

1. **allow_promotion_codes: false — resolved 2026-09-22.** No public promo code exists;
   the field only sends buyers hunting for one (restoring Cass 2026-09-01 decision after
   Checkout Studio import flipped it). Both call sites in
   `app/checkout/[offer]/session/route.ts` are `false` again.
2. **ui_mode omitted.** Stripe SDK is 22.3.0 (>= 21), so the value would be `"hosted_page"`,
   which is already the default and matches current behaviour (303 redirect to
   checkout.stripe.com). It was left out because `scripts/calculator-deep-dive.test.ts:154`
   asserts the route file never contains `ui_mode` (guard against the old embedded flow).
   Behaviour is identical either way.
3. **Kept, though absent from Checkout Studio:** `metadata`, `payment_intent_data.metadata`,
   `subscription_data.metadata`, `branding_settings`, `customer_creation`. Fulfillment
   (webhook SKU/birthday lookup, past-buyer SKUs) depends on the metadata; removing them
   would break delivery. `custom_text` stays out (Managed Payments rejects it).

## Verification run

- `bun test scripts/calculator-deep-dive.test.ts` — 10 pass
- `bun scripts/checkout-abandon-friction.test.ts` — PASS
- `npx tsc --noEmit` — clean

## Next steps

1. Decision 1 resolved 2026-09-22: promo-code field stays off.
2. Commit, then ship via `/ship`; afterwards run `/checkout-check`.
3. Test cards: `4242 4242 4242 4242` (any future expiry, any CVC) in test mode.
4. Resources: https://docs.stripe.com/payments/checkout, https://support.stripe.com,
   https://docs.stripe.com/mcp
