# My Question launch design

**Date:** 2026-08-10  
**Status:** Approved direction; local implementation only  
**Route:** `/myquestion`  
**Creative direction:** A / proof-first split

## Objective

Sell a human-recorded, personalized 5–7 minute Card Blueprints reading for one focused question. The base reading is $99. A 4–6 page Question Blueprint is an optional $29 add-on.

The public experience must show the real deliverable before asking for payment, remain honest when proof assets are missing, and fail closed when payment or fulfillment infrastructure is incomplete.

## Brand and page architecture

The page extends the existing warm-paper editorial system:

- Warm paper, ivory, ink, oxblood, and bronze.
- Iowan/Palatino editorial display type with restrained system sans copy.
- Minimal framing, thin rules, tactile paper texture, and playing-card geometry.
- No generic gradient SaaS hero, floating dashboard cards, fake metrics, or decorative UI chrome.
- Mobile-first order panel with a sticky desktop placement only when it does not obscure proof.

Page sequence:

1. Compact Card Blueprints header.
2. Proof-first hero: exact offer, one-question mechanism, price, delivery estimate, and creator sample frame.
3. Proof strip: real creator demonstration plus only publication-approved customer excerpts.
4. What the 5–7 minute reading covers.
5. Focused-question examples, including relationship and compatibility questions.
6. Three-step flow: pay, complete intake, receive private video.
7. Order panel: $99 base, optional $29 Question Blueprint, primary birthdate eligibility check.
8. Boundaries and FAQ.
9. Refund, correction, privacy, and professional-advice disclosures.

No testimonial text, reviewer identity, score, permission, outcome, or sample deliverable may be invented. Until the creator video, matching sample PDF, and approved review copy are configured, the page displays an honest proof-pending state and production checkout stays disabled.

## Offer contract

### Base reading — $99

- One focused question, maximum 600 characters.
- One situation, relationship, decision, or recurring pattern.
- Up to three additional birthdates when directly relevant.
- 5–7 minute private video.
- Birth Card.
- Planetary Ruling Card.
- Combined pattern.
- Current 52-day card.
- Current Long Range card.
- Question-relevant timing and cards.
- One practical takeaway or next step.
- Private, downloadable Google Drive link kept active for at least 12 months.

### Question Blueprint — optional $29

- 4–6 page question-specific PDF.
- Uses the same deterministic mechanics and reviewed interpretation as the video.
- This is distinct from the standalone Personal Card Blueprint.

### Boundaries

The service is personalized symbolic insight and self-reflection. It is not fortune-telling, professional advice, guaranteed prediction, emergency help, diagnosis, treatment, mind-reading, or certainty about another person.

Disallowed intake categories:

- Medical advice or diagnosis.
- Legal advice.
- Financial or investment advice.
- Emergency or crisis requests.
- Mental-health treatment advice.
- Guaranteed predictions.
- Claims to know another person’s private thoughts.

December 31 is rejected before checkout because the deterministic engine intentionally refuses the Joker boundary and no approved Joker reading exists.

## Purchase and intake flow

1. Customer enters the primary birthdate and selects the optional Question Blueprint on `/myquestion`.
2. The server validates the date and refuses December 31 before creating payment.
3. The server verifies production checkout is explicitly enabled, proof is approved, Stripe price configuration exists, and the D1 order store is reachable.
4. A short-lived D1 pending-order record stores the primary birthdate and add-on selection. No question or third-party birthdates are collected yet.
5. Stripe-hosted Checkout collects payment and email. Server-controlled Price IDs determine all amounts.
6. Successful payment redirects to `/myquestion/onboarding?session_id=...`.
7. The onboarding page verifies the Stripe session is complete and paid before exposing the intake form.
8. The customer submits name, one question, and up to three relevant birthdates.
9. D1 idempotently assigns one of three slots on the next available Monday–Friday fulfillment date in `America/Chicago`. Holidays remain eligible.
10. The customer receives the exact assigned date. The creator receives a private signed fulfillment link by email.
11. From the private page, the creator starts production, pastes the Google Drive URL, and sends the delivery email.

Payment alone does not reserve a production slot. The slot and delivery clock begin only when valid onboarding is complete.

## Capacity model

- Three completed-onboarding orders per fulfillment date.
- Candidate delivery date is the next eligible weekday in America/Chicago.
- A full date advances to the next weekday.
- Unique `(fulfillment_date, slot_number)` storage prevents overbooking.
- Assignment retries safely on a uniqueness collision.
- Repeated onboarding submission returns the existing assignment rather than creating another slot.
- Public availability is an estimate. The exact date is reserved after onboarding.

## D1 order model

`my_question_orders` stores:

- Opaque order ID.
- Stripe Checkout Session and PaymentIntent references.
- Status and timestamps.
- Primary birthdate.
- Question Blueprint selection.
- Customer name and email.
- One question.
- Up to three relevant birthdates as JSON.
- Assigned fulfillment date and slot number.
- Production start timestamp.
- Delivery timestamp and private Drive URL.
- Reminder timestamps and optional manual extension.
- Detailed-intake purge timestamp.

Statuses:

- `checkout_pending`
- `paid_awaiting_intake`
- `ready`
- `in_production`
- `delivered`
- `refunded`
- `closed`

Detailed intake is purged 90 days after delivery. Stripe remains the payment record. The delivered video stays available through Google Drive for at least 12 months.

## Email workflow

### After payment

Customer:

- Payment confirmation.
- Private onboarding link.
- Clear statement that no production date is reserved until onboarding is complete.

Creator:

- Payment notice.
- Paid amount and add-on state.
- Private signed order link.

### After onboarding

Customer:

- Submitted question.
- Assigned delivery date.
- Summary of what the reading covers.

Creator:

- Full intake.
- Assigned date and slot.
- Private signed fulfillment link.

### Delivery

Customer:

- Restated submitted question.
- Brief scope summary.
- Private downloadable Google Drive URL.
- Twelve-month access statement.
- Correction/support instructions.

Resend idempotency keys prevent duplicate operational emails on retries.

## Incomplete onboarding and scheduled operations

A small Cloudflare scheduled Worker uses the same D1 database:

- Reminder after 1 hour.
- Reminder after 24 hours.
- Final reminder after 72 hours.
- Refund and close after 14 days unless manually extended.
- Purge detailed intake 90 days after delivery.

Automatic refunds remain behind an explicit environment flag until separately approved for production activation.

## Refund and correction policy

- Refundable before production begins.
- Non-refundable after completed onboarding enters production.
- Free correction or re-record for an incorrect submitted birthdate, omitted purchased component, or clear production error.
- Disagreement with interpretation is not refundable.
- If the assigned delivery window is missed, the customer may choose a refund or continued fulfillment.

## Failure behavior

- Missing proof approval, checkout flag, Stripe key, Stripe Price IDs, signing secret, email configuration, or D1 binding: no Checkout Session is created.
- Invalid or December 31 birthdate: inline explanation before payment.
- D1 failure before checkout: payment is blocked.
- D1 failure after payment: paid session remains recoverable by Stripe Session ID; customer gets a support state instead of a false confirmation.
- Unpaid or forged session ID: intake stays inaccessible.
- Duplicate webhook or form submission: idempotent update, no duplicate email or slot.
- Invalid question/category: field-level error, no slot assignment.
- Invalid fulfillment token: no order data is disclosed.
- Invalid delivery URL: delivery is not marked complete.
- Email failure: order remains actionable and is not falsely presented as delivered.

## Launch gates

Production checkout stays closed until all are true:

- Creator sample video exists and is approved.
- Matching sample Question Blueprint exists and is approved.
- Every public review excerpt has explicit permission and approved wording.
- D1 database exists and migrations are applied.
- Stripe CLI account matches the Card Blueprints Dashboard account.
- Live-mode $99 and $29 one-time Prices are verified server-side.
- Stripe, Resend, D1, and signing secrets/bindings are configured.
- Webhook endpoint and scheduled Worker are configured.
- Full test-mode paid-order simulation passes.
- Pre-charge production checkout acceptance passes without entering payment credentials.
- Explicit deployment approval is given.

## Verification plan

Automated:

- Birthdate and Joker-boundary validation.
- One-question and 600-character validation.
- Prohibited-category validation.
- Additional-birthdate limit and validation.
- Weekday/capacity assignment and collision handling.
- Token expiry and tamper rejection.
- Checkout fail-closed behavior and server-controlled totals.
- Paid-session gate and idempotent onboarding.
- Fulfillment URL and status transitions.
- Reminder/refund/purge eligibility.
- Existing repository truth gates and Elroy tests.
- TypeScript, Next build, and next-on-pages build.

Browser and visual:

- Mobile 390×844, tablet, and desktop 1440×900.
- Keyboard navigation and visible focus.
- Heading order, labels, errors, reduced motion, and contrast.
- No horizontal overflow.
- Proof video controls and fallback state.
- Base and add-on totals.
- Checkout cancel, unpaid success URL, paid onboarding, duplicate submit, and fulfillment delivery paths.
- Lighthouse performance and accessibility evidence.

Independent adversarial review must challenge conversion truth, privacy, payment integrity, capacity races, email idempotency, refund automation, accessibility, and mobile layout. Confirmed findings are fixed and re-reviewed before local delivery is called complete.
