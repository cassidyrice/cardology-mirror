# Live purchase runbook — all three products

Prepare-only until Cass runs it. Linear [CAR-6](https://linear.app/cardblueprints/issue/CAR-6/put-one-real-purchase-through-each-live-product-end-to-end).

No real purchase has been put through any live product. Unit tests, integration tests, and read-only probes are the only evidence that Stripe → webhook → fulfillment → email → success page works. This is the operator script that closes that gap.

This file is the whole procedure. Do not merge, deploy, or edit Cloudflare Pages environment variables while running it. A dashboard save on 2026-09-04 blanked every secret and took checkout down.

## What you are proving

Three products take money today:

| Product | Price | Public page | Review page | Internal slug | What the buyer is supposed to get |
|---|---|---|---|---|---|
| One Question Reading | $13 | https://cardblueprints.com/products/one-question-reading | `/checkout/deep-dive` | `deep-dive` (SKU `one-question-47`) | ~600-word reading on screen and in email within about a minute |
| Blueprint Report | $129 | https://cardblueprints.com/products/blueprint-report | `/checkout/blueprint-report` | `blueprint-report` | Printable report, link good 12 months |
| Blueprint Report + Consultation | $297 | same page, featured tier | `/checkout/blueprint-report-consult` | `blueprint-report-consult` | Same report, plus a request form so you arrange a 45-minute call |

Charge each one with a real card on the live **Card Blueprint** Stripe account (`acct_1U1a1dChx1yAVyrs`). Never the Cassidy Rice / 52xseven account. After the checks for that product pass, refund it. Then do one delayed/async payment (Klarna, Affirm, Afterpay, pay-by-bank, Bancontact, or ACSS) so `checkout.session.async_payment_succeeded` fires in production for the first time.

Use an inbox you control. Plus-address if you can (`you+car6-13@…`, `you+car6-129@…`, `you+car6-297@…`, `you+car6-async@…`) so the four receipts stay distinct.

Recommended test inputs (any real past birthday except December 31 for the reports):

- Birth date: `1988-07-14` (the date `/checkout-check` already uses)
- Cover name (reports only, optional): `CAR-6`
- $13 question: `CAR-6 live path check: should I keep the One Question Reading live?`

December 31 is the Joker. The $13 reading accepts it. The report checkout refuses it before Stripe and must not be used for this test.

## Do not

- Do not use Stripe test mode or a test card. This is live Checkout.
- Do not use the Cassidy Rice / 52xseven Stripe account.
- Do not edit Cloudflare Pages environment variables. If a secret is missing, stop and use `npx wrangler pages secret put NAME --project-name cardology-mirror` later, one name at a time, then a real deploy. That is a different ticket.
- Do not change webhook endpoints, price IDs, or payment-method settings.
- Do not run `bun run pages:deploy`.
- Do not expect `CLAUDE.md` to match this path. That file still describes hand fulfillment in two business days. Live copy and code write the $13 reading the moment payment lands.

`docs/SITE-RECORD.md` is cited by CAR-6 and was not in this repo when the runbook was written. The product list and checks below come from the live checkout, webhook, and fulfillment code.

## Before the first charge

1. Confirm you are on the live site: https://cardblueprints.com
2. Confirm Stripe CLI is the Card Blueprint account, or stop:

```bash
stripe config --list | grep account_id
# must print acct_1U1a1dChx1yAVyrs
# if not: stripe login   then pick Card Blueprint
```

3. Confirm wrangler can talk to the live account (D1 + Analytics Engine). `npx wrangler login` if `npx wrangler whoami` fails.
4. Confirm you can read the inbox that will be typed into Stripe Checkout, including spam.
5. Confirm you can read the operator inbox behind `INTAKE_EMAIL` (Cass’s intake). You will not print that address here.
6. Open a notes file. For every purchase copy: product, amount, buyer email, Stripe session id (`cs_live_…`), payment intent (`pi_…`), refund id (`re_…`), pass/fail for each check below.

A session create that does not set `payment_method_types` is the live behavior. Stripe may show cards and delayed methods on the same Checkout page. For the three required purchases, pay with a card so fulfillment is immediate. Save a delayed method for the async pass.

---

## Shared checks (run after every successful payment)

Do these for each session id. Substitute the `cs_live_…` you just created.

### 1. Success page

Open:

```
https://cardblueprints.com/checkout/success?session_id=cs_live_REPLACE
```

Card payment that has already cleared must show the kicker **Payment received** and the product-specific heading in the product sections below.

If you landed here while a delayed method was still pending, the page is supposed to say **Payment not verified** / **We could not confirm this purchase yet.** That is not a failure. Wait until the payment clears, then reload the same URL.

### 2. Stripe session (Card Blueprint only)

```bash
stripe checkout sessions retrieve cs_live_REPLACE --live
```

Need: `status=complete`, `payment_status=paid`, `amount_total` matching the product (1300 / 12900 / 29700 cents, plus tax if Stripe added any), `metadata.offer_slug` matching the table above, `metadata.birthdate=1988-07-14`. For the $13 reading also `metadata.sku=one-question-47` and `metadata.question` equal to what you typed.

Copy `payment_intent` (`pi_…`) into your notes. You need it to refund.

### 3. Buyer email

Look in the Stripe Checkout email, then in the product-specific fulfillment email described below. Both should arrive at the address typed into Checkout. Subject lines are exact.

There is no `bcc` header on the Resend send. Cass’s copy is a **second Resend message to `INTAKE_EMAIL`**, except on a successful $13 reading (see that product). If you are grepping mail headers for `Bcc:`, you will get a false fail.

### 4. READINGS KV / D1

Only the $13 reading writes a row. Reports do not.

```bash
# D1 is the live store for new $13 orders
npx wrangler d1 execute cardblueprints-reading-orders --remote --command \
  "SELECT session_id, status, delivery FROM reading_orders WHERE session_id = 'cs_live_REPLACE'"

# KV is legacy. A brand-new order should not appear here.
npx wrangler kv key get --remote --namespace-id=468369b7e1ae4380a111efbe50dd253c \
  "reading:cs_live_REPLACE"
```

D1 pass for $13: one row, `status=ready`, `delivery=sent`.  
KV pass for a new $13 order: empty / not found.  
Reports: D1 query returns no row. That is correct. Do not create one.

Do not dump `reading` or `delivery_payload` into chat or this file. Those columns hold the buyer’s text.

### 5. Operator copy (`INTAKE_EMAIL`)

Search the intake inbox for the Stripe session id. Expected mail is listed per product. A missing intake mail on a **successful** $13 reading is expected. A missing intake mail on $129 / $297 is a fail.

### 6. Funnel events (`cardblueprints_funnel`)

Analytics Engine can lag a few minutes. From the site repo:

```bash
# last few hours, the two server events that matter
bash scripts/growth-report.sh 1
```

Then, with a wrangler token that can read Account Analytics (the same login `growth-report.sh` uses):

```bash
# replace the INTERVAL if you started yesterday
# blob1 = event name, blob11 = offer slug, blob13 = outcome, double1 = cents
```

Use the SQL API the same way `scripts/growth-report.sh` does (`cardblueprints_funnel`, account `ed56f6f3b938abe4f3f024a53a789d4f`). You want two rows per product after a card payment:

| blob1 | blob11 | blob13 | double1 (approx) |
|---|---|---|---|
| `checkout_started` | product slug (`deep-dive` / `blueprint-report` / `blueprint-report-consult`) | `stripe-session-created` | price in cents |
| `purchase_completed` | same slug | `payment-confirmed` | same |

`purchase_completed` is written only after the webhook sees `payment_status=paid` (or a zero-total session). A delayed method that is still unpaid will have `checkout_started` and will **not** have `purchase_completed` yet. That is the async case, not a funnel bug.

Client events you may also see, and should not require: `offer_cta_clicked` from the calculator or product page, `offer_selected` on the review page.

---

## Product 1 — $13 One Question Reading

**Entry (pick one; the product page is enough):**

1. https://cardblueprints.com/products/one-question-reading
2. Click **Ask your question — $13** (or the calculator CTA **Ask one question, $13 →** after a non-Joker result on https://cardblueprints.com/birth-card-calculator)

**Buy:**

1. Review page heading is **Ask one question.** Price line is **One Question Reading — $13**.
2. Enter birth date `1988-07-14` if it is empty.
3. Type the CAR-6 question (5–400 characters).
4. Continue to Secure Checkout. You must land on `checkout.stripe.com` branded Card Blueprints, not Cassidy Rice.
5. Pay **$13** (plus tax if shown) with a real card. Use the plus-address for this product.

**What should arrive, where, how fast:**

| What | Where | How fast |
|---|---|---|
| Success page with your question quoted | `/checkout/success?session_id=cs_live_…` | immediately after card payment |
| The reading text on that same page | under “What happens now”, in the serif article | about a minute; the page polls every 3s, and after 30s it will write the reading itself if the webhook has not |
| Email subject `Your reading` | buyer inbox | about a minute |
| Stripe receipt | buyer inbox | Stripe’s usual minutes |
| D1 row `status=ready`, `delivery=sent` | `cardblueprints-reading-orders` | with the email |
| Funnel `checkout_started` + `purchase_completed` for slug `deep-dive` | `cardblueprints_funnel` | usually under a few minutes |

The emailed body starts with `You asked: "…"` and ends with `Cass` / `Card Blueprints`. Reply-to is `INTAKE_EMAIL`. There is no login, no PDF, no video.

**Success-page copy to match:**

- Kicker: **Payment received**
- Heading: **Payment confirmed. Your question is in.**
- Body includes: written the moment you pay; on your screen and in your inbox within about a minute
- Receipt line names the buyer email
- Blockquote is the question you typed
- Reading text appears once the poll gets `status=ready`

If the article is still blank at 4 minutes, the page has given up. That is a fail. Check D1 and intake before refunding: a `delivery=review` or `status=failed` row means the writer or Resend needs a person, and intake should have **Reading fulfillment needs review** with a paste-ready `reading 7/14/1988 '…' --send '…'` line. Do not run that command until you have inspected the D1 row. Never regenerate if text is already stored.

**INTAKE_EMAIL on a clean $13 success:** nothing. The buyer mail’s reply-to is the only operator hook. An intake message here means the automatic path did not finish.

**KV:** empty for this new session.

**Refund this charge** (section at the bottom) once the six shared checks pass, then go to product 2.

---

## Product 2 — $129 Blueprint Report

**Entry (pick one):**

1. https://cardblueprints.com/products/blueprint-report → **Report only, $129**
2. Calculator result → the text link **Just the report, no call?**

**Buy:**

1. Review page heading is **Blueprint Report — $129**.
2. Birth date `1988-07-14`. Optional cover name `CAR-6`.
3. Continue to Stripe. Confirm the line item is the report-only price, not $297.
4. Pay with a card. Use the plus-address for this product.

December 31 must not be used. If you did, checkout returns **December 31 is not supported by this report. No payment was started.** Start over with `1988-07-14`.

**What should arrive, where, how fast:**

| What | Where | How fast |
|---|---|---|
| Success page **Payment confirmed. Your Blueprint is ready.** | `/checkout/success?session_id=cs_live_…` | immediately after card payment |
| Button **Open my report** | same page | immediately |
| Report document | `/blueprint?token=…` redirects to `/report?token=…` | immediately |
| Email subject `Your Blueprint Report is ready` | buyer inbox | about a minute |
| `My purchases` link in that email | `/my-purchases?session_id=cs_live_…` | with the email |
| Separate intake mail `Payment received (report): Blueprint Report — you+car6-129@…` | `INTAKE_EMAIL` | about a minute |
| Funnel events for slug `blueprint-report` | `cardblueprints_funnel` | a few minutes |

Open the report. You should get a printable multi-page document (sample is 22 pages; length varies). Birth card for 1988-07-14 must be present. Cover name `CAR-6` if you typed it. Browser Print / Save as PDF is how a buyer keeps it. The token is good for 12 months.

There is no D1 `reading_orders` row and no READINGS KV key. Pass = both empty.

**INTAKE_EMAIL** must contain the session id, `Type: instant report`, `Report email sent: yes`, and the buyer email. If it says `NO — send manually`, the buyer mail failed; fix that before you call the purchase good.

**Refund this charge**, then go to product 3.

---

## Product 3 — $297 Report + Consultation

**Entry (pick one):**

1. https://cardblueprints.com/products/blueprint-report → featured **Report + 45 minutes with Cass, $297**
2. Calculator result → the primary button with that same label

**Buy:**

1. Review page heading is **Blueprint Report + Consultation — $297**.
2. Same birth date and optional cover name.
3. Confirm Stripe shows $297, not $129.
4. Pay with a card. Use the plus-address for this product.

**What should arrive, where, how fast:**

Everything in product 2, plus:

| What | Where | How fast |
|---|---|---|
| Success-page button **Arrange my consultation** | `/checkout/success?session_id=cs_live_…` | immediately |
| Same button on My purchases | `/my-purchases?session_id=cs_live_…` | immediately |
| Intake subject `ACTION: confirm the 45-minute consult for you+car6-297@…` | `INTAKE_EMAIL` | about a minute |
| After you submit the form: page text **Your request is received. Cass will contact you to arrange your call.** | `/consultation?session_id=cs_live_…` | immediately |
| Second intake subject `ACTION: arrange a paid 45-minute consultation` | `INTAKE_EMAIL` | about a minute |

Open **Arrange my consultation**. The form is supposed to accept you because the session is paid and `offer_slug=blueprint-report-consult`. Fill:

- What you want to explore: `CAR-6 live consult path check`
- Time zone: `America/Denver`
- Extra note: optional

Submit once. A repeat click within 24 hours is deduped by Resend (`consultation-request/cs_live_…`). The second intake mail must name the buyer, the session id, the topic, and the time zone, and must say no appointment has been booked.

The report is the same document as the $129 tier (`reportSlug=blueprint-report`). Open it and confirm it renders. No D1 / KV reading row.

Funnel slug is `blueprint-report-consult`.

**Refund this charge**, including after you have submitted the consult request. You do not need to hold a real 45-minute call for CAR-6. Reply to the buyer-looking intake thread so you do not later treat it as a real booking.

---

## Delayed / async payment (required once)

Checkout session creation sets **no** `payment_method_types`. Stripe therefore may offer delayed methods (Klarna, Affirm, Afterpay / Clearpay, pay-by-bank, ACSS, Bancontact) next to cards. `checkout.session.completed` can fire while `payment_status` is still `unpaid`. Fulfillment is supposed to no-op on that event and wait for `checkout.session.async_payment_succeeded`.

That second event has never been seen in production.

**Do this on the $13 reading** so the delayed-method charge is the cheap one. Use a fourth plus-address.

1. Start a new $13 checkout the same way as product 1. New question: `CAR-6 async path check: did delayed payment fulfill?`
2. On Stripe Checkout, pick a delayed method. If Checkout only offers a card, write **no delayed method offered** in your notes and stop this section. Do not change Stripe settings to force one.
3. Finish the delayed method’s own flow (app approve, bank approve, etc.).
4. If Stripe sends you back to `/checkout/success` before the money has cleared:
   - Page must say **Payment not verified** / **We could not confirm this purchase yet.**
   - `stripe checkout sessions retrieve cs_live_… --live` shows `payment_status` other than `paid` (usually `unpaid`).
   - D1 has no `ready`/`sent` row yet.
   - Funnel has `checkout_started` and does **not** yet have `purchase_completed`.
5. Watch for the delayed method to settle (minutes to a couple of days, depending on the method).
6. Then:

```bash
stripe events list --live --limit 20 --type checkout.session.async_payment_succeeded
stripe checkout sessions retrieve cs_live_REPLACE --live
```

Need a live `checkout.session.async_payment_succeeded` whose `data.object.id` is this session, and `payment_status=paid`.

7. Reload the success URL. The $13 heading and reading must appear the same as a card payment. Buyer mail `Your reading` must arrive. D1 `status=ready`, `delivery=sent`. Funnel `purchase_completed` for `deep-dive` must appear after this event, not after the unpaid `completed`.

8. Refund once those checks pass.

If the delayed method fails or expires, that is useful too: record the session, the method, and that fulfillment did not run. Do not retry by editing Stripe.

---

## Refund (every charge, including tax)

Refund from the Card Blueprint account after that purchase’s checks pass. Do not leave a live charge on the card.

```bash
# confirm account first
stripe config --list | grep account_id

stripe refunds create --live --payment-intent pi_REPLACE
```

Or Stripe Dashboard → Card Blueprint → the Payment → Refund. Full refund, including tax.

Banks usually post it in 5–10 business days (`/refund-policy`).

A refund does **not** delete the D1 row, the report token, or the success URL. That is current behavior. Do not try to purge production D1 to “undo” the test. Keep the session ids in your notes so a later cleanup can tombstone or ignore them.

If a charge is $297 and you already submitted the consult form, add a one-line note on the intake thread: test purchase, refunded, do not book.

---

## Sign-off

Copy this into the CAR-6 comments (or a note to yourself) when finished. Every line needs a session id or an explicit skip reason.

```
[ ] $13 card: success page showed the reading
[ ] $13 card: buyer email "Your reading"
[ ] $13 card: D1 ready/sent; KV empty
[ ] $13 card: no success intake mail (or review mail only if it failed)
[ ] $13 card: funnel checkout_started + purchase_completed (deep-dive)
[ ] $13 card: refunded
[ ] $129 card: success page Open my report; /report rendered
[ ] $129 card: buyer email "Your Blueprint Report is ready"
[ ] $129 card: no D1/KV reading row
[ ] $129 card: intake "Payment received (report)"
[ ] $129 card: funnel events (blueprint-report)
[ ] $129 card: refunded
[ ] $297 card: report rendered + Arrange my consultation worked
[ ] $297 card: buyer email includes consult link
[ ] $297 card: intake ACTION confirm + ACTION arrange
[ ] $297 card: funnel events (blueprint-report-consult)
[ ] $297 card: refunded; intake marked test
[ ] Async: completed unpaid did not fulfill
[ ] Async: async_payment_succeeded fulfilled (or "no delayed method offered")
[ ] Async: refunded
```

## If something is already wrong before you pay

- Review page **Secure checkout is temporarily unavailable** / 503: stop. Missing `STRIPE_SECRET_KEY` or the price secret. Do not edit the Pages dashboard.
- `/checkout/deep-dive/session` without a question must bounce to `?status=need-question`, never to Stripe. You can confirm that with the curl in `.claude/commands/checkout-check.md` before spending money.
- Stripe Checkout branded as Cassidy Rice: stop. Wrong account.

## Source map (only if a check fails)

| Step | Code |
|---|---|
| Session create, no `payment_method_types` | `app/checkout/[offer]/session/route.ts` |
| Webhook: `completed` and `async_payment_succeeded`; pay-gate; $13 / report / consult branches | `app/api/checkout/webhook/route.ts` |
| $13 write + email + D1 reservation | `lib/reading-fulfill.ts`, `lib/reading-service.ts`, `lib/reading-writer.ts` |
| Success-page poll / 30s takeover | `app/api/one-question/route.ts`, `components/checkout/OneQuestionReadingLive.tsx` |
| Success-page render | `app/checkout/success/page.tsx` |
| Report token and `/report` | `lib/report-token.ts`, `app/blueprint/page.tsx`, `app/report/route.ts` |
| Consult form | `app/consultation/page.tsx`, `app/api/consultation/route.ts` |
| Funnel write | `lib/analytics-server.ts` → dataset `cardblueprints_funnel` |
| Email send (no BCC) | `lib/email.ts` |
