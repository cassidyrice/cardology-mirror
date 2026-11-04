# Fulfill a $13 Birth Card Blueprint

Orders from the embedded calculator checkout are queued in the site's `READING_ORDERS` D1 binding. A signed Stripe payment event must match the saved order and Checkout Session and confirm USD 13.00 before a row enters the queue. One operator sends each seven-page PDF. Stripe holds the email address. D1 holds the birth month and day until delivery.

## Before accepting orders

Apply migration `0004_birth_card_blueprint_orders.sql` to the intended environment before enabling checkout. In the **Card Blueprint** Stripe account, enable `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired` for the site's existing signed webhook. Assign an operator to check the queue daily and prove one test-mode order through PDF receipt. The older fulfillment Worker's generated Blueprint uses a different layout. The exact seven-page generator is on Cassidys-Mini.

In the sandbox, configure a dedicated active one-time USD 13.00 Price for the Birth Card Blueprint, the matching publishable and restricted/secret keys, the webhook signing secret, the sandbox merchant ID and the preview origin. The credential must be able to identify its account, read Prices, and create/read Checkout Sessions. See `.env.example` for names. Set `CARD_BLUEPRINT_EMBEDDED_CHECKOUT=1` for both the build and server runtime in that environment. The main deploy workflow reads a GitHub Actions repository variable of that name for the static calculator build. The Pages runtime reads its own environment variable of the same name for the session endpoint. Keep the flag off in production until the order queue, receipt and manual PDF delivery have been verified. Only the site's Card Blueprint merchant can create live Sessions on cardblueprints.com.

## Work the queue

Run the SQL below in the bound D1 database for the same environment as the Stripe payment. List open orders, including any another operator already claimed.

```sql
SELECT stripe_session_id, paid_at, claimed_at FROM blueprint_checkout_orders
WHERE paid_at IS NOT NULL AND fulfilled_at IS NULL ORDER BY paid_at;
```

Replace `SESSION_ID` with one listed Checkout Session ID. Claim it before generating anything. Continue only if this returns a row. If it is already claimed or a previous send was interrupted, reconcile with the current operator and sent-mail history before attempting delivery.

```sql
UPDATE blueprint_checkout_orders SET claimed_at=unixepoch()
WHERE stripe_session_id='SESSION_ID' AND paid_at IS NOT NULL AND claimed_at IS NULL
RETURNING stripe_session_id, birth_month, birth_day;
```

1. Open the exact Checkout Session in the matching Stripe account and mode. Check its associated payment is paid, unrefunded and undisputed. Use the checkout email for delivery. If the purchase or address is unclear, hold the claim for investigation.
2. Follow `/Users/rice/birth-card-blueprint/README.md`. In `/Users/rice/birth-card-blueprint`, run `python3 template/build.py --month MONTH --day DAY --slug ORDER_ID`, replacing the placeholders. Use an order-specific filename without the birthday or email. The buyer's first name is optional. Check the overflow result, seven pages, calculated birth and ruling cards, the love/work section and seven-day practice. Check the Joker or additional ruling cards when present.
3. Email the generated PDF as an attachment from the business mailbox. Record the Stripe session ID in your internal delivery record so a second operator can reconcile an interrupted send. Once the provider accepts the email, finish the claim and clear the birthday. A duplicate webhook leaves this tombstone intact.

```sql
UPDATE blueprint_checkout_orders
SET fulfilled_at=unixepoch(), birth_month=NULL, birth_day=NULL
WHERE stripe_session_id='SESSION_ID' AND claimed_at IS NOT NULL AND fulfilled_at IS NULL
RETURNING stripe_session_id, fulfilled_at;
```

Remove the generated local copy and preview files per the generator README. If delivery fails, keep the row claimed and recover the original order.

## Abandoned attempts

The signed expiration event deletes an unpaid row bound to that session. Periodically clear old attempts that never received a Checkout Session. For bound sessions missed by the expiration webhook, check Stripe confirms the corresponding session expired unpaid before deleting its specific unpaid row. Keep paid rows for replay protection.

```sql
DELETE FROM blueprint_checkout_orders
WHERE stripe_session_id IS NULL AND paid_at IS NULL AND created_at < unixepoch('-7 days');
```
