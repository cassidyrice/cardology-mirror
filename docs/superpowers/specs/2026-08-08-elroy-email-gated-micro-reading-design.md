# Elroy Email-Gated Micro-Reading Design

**Date:** 2026-08-08

**Status:** Approved in conversation; awaiting review of this written specification

**Project:** Card Blueprints (`cardblueprints.com`)

**Repository:** `/Users/main/cardology-mirror`

## 1. Summary

Add Elroy as the Card Blueprints site chat guide. A small site-wide launcher offers a deterministic micro-reading based on the visitor's birth date. Elroy reveals the visitor's birth-card name before the gate, then asks for an email address. After successful Cloudflare Turnstile verification and contact capture, the chat displays the micro-reading immediately and sends the same reading by email.

The reading is assembled from the existing Card Blueprints engine and curated Card Blueprints copy. It does not use an LLM. The only commercial next step is the $29 Personal Card Blueprint.

Elroy belongs exclusively to Card Blueprints. The retired Elroy Answers brand is not mentioned or linked.

## 2. Goals

1. Convert anonymous Card Blueprints visitors into permissioned email contacts.
2. Give useful, immediate value before and after the email gate.
3. Introduce Elroy as a recognizable Card Blueprints character.
4. Keep all card facts deterministic, repeatable, and grounded in the repository's engine and interpretation data.
5. Lead qualified visitors to the $29 Personal Card Blueprint without replacing its value.
6. Protect the public email endpoint with managed Cloudflare Turnstile from launch.
7. Preserve page performance, accessibility, privacy, and the current cream-paper visual system.

## 3. Non-goals

Version one will not include:

- open-ended AI conversation;
- LLM-generated interpretations;
- current-year or current-chapter calculations;
- the paid Blueprint's full prompt set;
- relationship readings;
- a general support chatbot;
- a nurture-sequence builder or campaign automation;
- a database of birth dates or chat transcripts;
- references to Elroy Answers;
- automatic opening of the full chat panel.

## 4. Placement and eligibility

Elroy is independent of the birth-card calculator and appears across public Card Blueprints marketing, editorial, calculator, card-meaning, and product pages.

Elroy is excluded from routes where a floating offer would distract from a transaction or private reading, including:

- `/checkout/*`
- `/access`
- `/reading`
- `/onboarding`
- `/free-course/watch`
- internal, preview-only, or operational routes

The launcher is fixed to the lower-right corner on desktop and respects the mobile safe area. It must not cover cookie, checkout, or primary navigation controls.

## 5. Visitor flow

### 5.1 Launcher and teaser

1. The compact Elroy launcher is available after hydration.
2. If the browser has no active suppression record, a one-message teaser appears after 10 seconds:
   > Your birthday has a pattern. Want the short version?
3. The teaser never opens the chat automatically.
4. Clicking the teaser or launcher opens the panel and records `elroy_opened`.
5. Dismissing or completing the experience suppresses the teaser and launcher for 30 days in that browser.
6. Suppression stores only an expiry timestamp. It stores no birth date, email, card, or reading.

### 5.2 Conversation

1. **Introduction**
   - Elroy identifies himself as `Elroy · Card Blueprints`.
   - He says the result comes from a fixed playing-card calculation, not a shuffle, prediction, or random draw.
2. **Birth date**
   - Elroy asks for the full birth date using an accessible date input.
   - Client validation rejects missing, malformed, future, or impossible dates.
3. **Pre-gate reveal**
   - The browser uses the existing deterministic card engine to reveal the birth-card face and label immediately.
   - The micro-reading remains locked.
4. **Email gate**
   - Elroy asks for an email address to display the micro-reading and send a copy.
   - The disclosure reads:
     > By continuing, you agree to receive your reading and occasional Card Blueprints emails. Unsubscribe anytime.
   - The disclosure links to `/privacy-policy`.
5. **Bot verification and submission**
   - Managed Turnstile verifies the request with action `elroy_reading`.
   - A hidden honeypot remains as defense in depth.
6. **Immediate reading**
   - After the server confirms contact capture, Elroy displays the reading in three paced messages.
7. **Commercial next step**
   - Elroy shows one primary button: `See my full Blueprint · $29`.
   - The button links to `/products/personal-card-blueprint` and carries Elroy attribution through the existing anonymous analytics system.

### 5.3 Calendar boundaries

- **February 29:** The current public methodology treats this date as outside the standard 52-card cycle. Elroy explains that boundary plainly, links to the methodology, and does not ask for an email because no standard micro-reading can be generated.
- **December 31:** Elroy uses the repository's Joker handling and a dedicated, reviewed Joker micro-reading. He must not silently force the date into one of the 52 standard cards.
- All other valid supported dates must resolve through the repository's deterministic engine.

## 6. Elroy visual and voice system

### 6.1 Visual direction

Elroy is a small illustrated human guide, presented as a friendly young man rather than a robot or generic AI sparkle icon.

- Warm paper base
- Black ink linework
- Restrained oxblood accent
- Compatible with the existing Card Blueprints cream-paper theme and logo system
- No neon, sci-fi chrome, robot head, or unrelated Elroy Answers visual language
- Avatar asset should be an optimized local SVG or WebP under `public/brand/`

Desktop panel target width is 380 px. Mobile uses a bottom sheet that fits the viewport, respects safe-area insets, and leaves a visible close control.

### 6.2 Voice

Elroy is concise, calm, observant, and lightly knowing. He avoids mystical filler, exaggerated certainty, and hard selling.

Representative lines:

- `I found your fixed card. Here's the part worth noticing.`
- `This is a mirror, not a forecast.`
- `Your ruling card changes the tone, not the underlying card.`

Elroy does not claim human consciousness, psychic ability, or authorship of the Card Blueprints method.

## 7. Micro-reading content contract

Every standard micro-reading contains exactly three visitor-facing sections:

1. **Core pattern**
   - One compact interpretation of the birth card's constructive expression.
2. **Tension to watch**
   - One grounded shadow or imbalance from the birth card.
   - At most one short ruling-card nuance.
3. **Reflection question**
   - One practical, non-diagnostic question tied to the same verified card data.

The generator may combine curated rank, suit, card, and ruling-layer fragments, but the final sentences must be reviewed as complete readings rather than exposed as raw fragments.

The micro-reading must not contain:

- fate or prediction claims;
- medical, legal, financial, or mental-health advice;
- psychological diagnosis;
- current-year timing or chapter material;
- karma-card analysis;
- the paid report's complete three-prompt set;
- statements unsupported by repository-owned card data.

A concise footer states that Cardology is a symbolic framework for reflection rather than scientific or professional advice.

## 8. Component architecture

### 8.1 Client components

- `ElroyLauncher`
  - Mounted once from the root layout.
  - Applies route exclusions and suppression rules.
  - Renders only the lightweight launcher and teaser.
  - Dynamically loads the full chat panel after interaction.
- `ElroyChatPanel`
  - Owns the deterministic conversation state machine.
  - Handles focus, keyboard behavior, client validation, and submission.
- `ElroyCardReveal`
  - Reuses the existing playing-card presentation and deterministic client engine.
  - Displays only the pre-gate card face and label.
- `ElroyTurnstile`
  - Explicitly renders the managed widget.
  - Retains the widget ID and token.
  - Resets after every completed submission attempt before allowing a retry.
- `ElroyReading`
  - Displays only the server-returned reading.
  - Does not regenerate or reinterpret card data in the browser.

The chat state machine has explicit states:

`closed -> intro -> birthdate -> card_reveal -> email -> verifying -> reading | recoverable_error | terminal_boundary`

### 8.2 Server modules

- `POST /api/elroy/micro-reading`
  - Normalizes and validates request data.
  - Rejects honeypot submissions.
  - Verifies Turnstile.
  - Resolves deterministic card data.
  - Builds the curated reading.
  - Adds the contact to Resend.
  - Sends the reading email.
  - Returns the reading with a non-sensitive delivery status.
- `lib/elroy/micro-reading.ts`
  - Pure deterministic generator and curated copy source.
- `lib/turnstile.ts`
  - Canonical server-side Siteverify helper.
- `lib/marketing-contact.ts`
  - Generic email-only Resend contact helper.
  - Existing course behavior remains compatible.
- `lib/elroy/email.ts`
  - Strict reading-email sender with text and simple branded HTML versions.
  - Missing production email configuration is an error, not a silent success.

Each unit has a narrow interface and can be tested without rendering the complete site.

## 9. API contract

### 9.1 Request

```json
{
  "birthdate": "YYYY-MM-DD",
  "email": "person@example.com",
  "consent": true,
  "source": "/current-public-path",
  "company": "",
  "turnstileToken": "single-use-token"
}
```

Constraints:

- `birthdate` must be a real, non-future calendar date.
- `email` is trimmed, lowercased, syntactically validated, and limited to 254 characters.
- `consent` must equal `true`.
- `source` is sanitized and limited to 80 characters.
- `company` must remain empty.
- `turnstileToken` must be non-empty and no more than 2,048 characters.

### 9.2 Success response

```ts
type ElroyMicroReadingResponse = {
  card: {
    birthCard: string;
    birthCardLabel: string;
    rulingCards: string[];
  };
  reading: {
    core: string;
    tension: string;
    reflection: string;
    disclaimer: string;
  };
  emailSent: boolean;
};
```

As a deterministic engine sanity example, January 15 resolves to birth card `Q♦` and ruling card `7♣` in the current repository. The response never includes the submitted email or raw birth date.

### 9.3 Failure behavior

- `400`: malformed date, email, consent, source, or honeypot failure.
- `403`: missing, invalid, expired, replayed, wrong-action, or wrong-hostname Turnstile result.
- `422`: supported calendar input that has no standard micro-reading, such as February 29. The client uses a dedicated explanatory state and does not submit contact data for this boundary.
- `503`: engine, contact-capture, or required provider configuration failure.

If contact capture succeeds but email delivery fails, the route returns `200` with the reading and `emailSent: false`. The visitor still receives the immediate value and sees a plain delivery warning. If contact capture fails, the route does not reveal the reading.

All responses use `Cache-Control: no-store`.

## 10. Turnstile security contract

Use one managed Cloudflare Turnstile widget for the Elroy surface.

Candidate widget domains:

- `cardblueprints.com`
- `www.cardblueprints.com`
- `cardology-mirror.pages.dev`
- `localhost`
- `127.0.0.1`

Production hostname validation must not include local hostnames. Preview and production deployments use environment-appropriate allowlists.

Environment bindings:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET`
- `TURNSTILE_HOSTNAMES`

Server verification requirements:

1. Use Cloudflare's canonical Siteverify endpoint.
2. Send the single-use response token and best available client IP.
3. Apply a 10-second timeout.
4. Fail closed on network, non-2xx, or invalid JSON errors.
5. Require `success === true`.
6. Require action `elroy_reading`.
7. Require the returned hostname to be in `TURNSTILE_HOSTNAMES`.
8. Perform no engine, contact, or email work before verification passes.
9. Reset the client widget after every request attempt so retries obtain a fresh token.

The Turnstile secret is stored only in the deployment's secret manager. It is never committed, logged, sent to the browser, or pasted into documentation.

## 11. Data and privacy

- The raw birth date exists only in the browser form and the one no-store API request.
- The server does not write birth dates, card codes, readings, chat text, or emails to application logs.
- Resend stores the normalized email as a subscribed contact. No birth date is attached to the contact.
- Anonymous analytics include event name, route placement, outcome, and existing traffic attribution only.
- Analytics never include birth date, email, card identity, Turnstile token, or reading text.
- Browser persistence stores only the Elroy suppression expiry timestamp.
- The privacy policy is updated before launch to explain ephemeral birth-date processing, email delivery, marketing consent, Resend processing, and unsubscribe behavior.

## 12. Email behavior

Subject:

`Your micro-reading from Elroy`

The email includes:

1. a brief reminder that the recipient requested the reading;
2. birth-card label and optional ruling-card label;
3. the same three reading sections shown in chat;
4. the symbolic-framework disclaimer;
5. one link to the $29 Personal Card Blueprint;
6. standard unsubscribe and Card Blueprints identity information.

The raw birth date is not included in the email. Text and simple branded HTML variants carry equivalent content.

## 13. Analytics

Add non-PII funnel events to the existing first-party and GA4 mapping:

1. `elroy_teaser_seen`
2. `elroy_opened`
3. `elroy_birthdate_submitted`
4. `elroy_email_submitted`
5. `elroy_micro_reading_viewed`
6. `elroy_blueprint_clicked`

Allowed context:

- `placement`: sanitized route or `sitewide-elroy`
- `outcome`: `success`, `validation_error`, `turnstile_error`, `engine_error`, `contact_error`, or `email_error`
- `offerSlug`: `personal-card-blueprint` only for the final CTA

No event contains user-entered values.

## 14. Accessibility and interaction requirements

- Launcher and close controls have descriptive accessible names.
- The panel uses dialog semantics and a visible heading.
- Opening moves focus into the panel; closing returns focus to the launcher.
- Escape closes the panel.
- Tab order remains contained while the modal-style mobile sheet is open.
- New Elroy messages are announced politely without rereading the entire transcript.
- Errors are connected to their fields and announced.
- All controls meet target-size and contrast requirements.
- Reduced-motion users receive immediate transitions without animated typing delays.
- The card reveal and Turnstile have usable non-visual labels.

## 15. Performance requirements

- The initial launcher must not import the full chat, reading generator, or email logic into the page bundle.
- The chat panel loads only after the visitor opens Elroy.
- The avatar is optimized and served locally.
- The launcher reserves its own fixed overlay area and causes no cumulative layout shift.
- Third-party Turnstile code loads only when the chat reaches the email step, not on initial page load.
- Existing page metadata, crawlable content, and calculator behavior remain unchanged.

## 16. Error recovery

- Invalid birth date or email preserves other valid entries.
- Turnstile errors provide a fresh challenge and never reuse a redeemed token.
- Network errors preserve birth date and email in component state for a retry but do not persist them across reloads.
- Engine or contact failures do not display the gated reading.
- Email-only failure displays the reading and a non-blocking message that the copy could not be sent.
- Closing the panel during a request aborts or safely ignores the late client response.

## 17. Testing and verification

### 17.1 Unit tests

- Input normalization and validation
- Every supported calendar date produces a non-empty deterministic result
- February 29 follows the explicit boundary path
- December 31 follows the explicit Joker path
- Repeat calls for identical input produce byte-stable reading content
- Birth and ruling roles are not mislabeled
- Prohibited paid content and prediction language are absent
- No response serializer includes email or raw birth date

### 17.2 API tests

- Missing Turnstile token
- Failed Siteverify result
- Wrong action
- Wrong hostname
- Siteverify timeout or malformed response
- Honeypot rejection
- Invalid date, future date, malformed email, and missing consent
- Engine failure before contact creation
- Contact failure with no reading disclosure
- Email failure after contact success with reading disclosure
- `Cache-Control: no-store`

### 17.3 Browser tests

- Launcher and 10-second teaser behavior
- No automatic panel opening
- Full successful desktop and mobile flow
- Keyboard-only operation and focus return
- Escape close and safe-area layout
- 30-day completion/dismissal suppression
- Reduced-motion behavior
- No launcher on excluded routes
- CTA destination and anonymous attribution
- Turnstile reset before retry

### 17.4 Real integration verification

- Use official Turnstile test keys for automated local paths.
- Validate the configured widget domains and secret without exposing the secret.
- Exercise the deployed endpoint with a fresh real Turnstile token.
- Confirm one successful request.
- Confirm replaying the same token is rejected.
- Confirm one real reading email reaches a controlled inbox.
- Confirm the Resend contact exists.
- Confirm no PII appears in analytics requests or application logs.

### 17.5 Release gates

Before launch:

1. Existing `bun run test` passes.
2. New Elroy tests pass.
3. `bun run pages:build` passes.
4. Cloudflare production secrets and hostname allowlist are verified.
5. Deployment completes.
6. Live desktop and mobile smoke tests pass.
7. The $29 CTA reaches the correct product page.
8. GA4 and first-party events appear without PII.

## 18. Acceptance criteria

The feature is complete only when all of the following are true:

- Elroy appears as a Card Blueprints-only site guide on eligible public routes.
- The chat never opens automatically.
- A visitor receives the birth-card reveal before entering an email.
- The micro-reading remains gated until Turnstile and contact capture succeed.
- Reading facts come from the deterministic Card Blueprints engine and reviewed copy.
- The chat and email show matching core, tension, and reflection sections.
- The raw birth date is not persisted or sent to analytics or Resend.
- Turnstile checks success, action, hostname, and single-use token behavior.
- Email failure does not hide a reading after contact capture has succeeded.
- The only post-reading offer is the $29 Personal Card Blueprint.
- Elroy Answers is not referenced.
- Accessibility, test, build, deploy, email, analytics, and live verification gates pass.
