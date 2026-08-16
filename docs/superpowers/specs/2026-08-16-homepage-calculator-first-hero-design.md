# Homepage Calculator-First Hero Design

**Date:** 2026-08-16  
**Status:** Approved design  
**Project:** Card Blueprints (`cardblueprints.com`)

## Goal

Replace the homepage cinematic journey with an interactive, calculator-first hero that increases free birth-card calculator completions and creates an optional path into the existing free four-part course.

The hero must give visitors their birth card before asking for an email address. The paid Personal Card Blueprint remains available, but it must not compete with the calculator before the visitor receives a result.

## Success criteria

- A visitor can enter a full birth date and reveal a birth card without leaving the homepage.
- The result is free, immediate, and does not require signup.
- The result state offers the existing four-part birth-card course as an optional email follow-up.
- Homepage calculator and lead events can be measured separately from the dedicated calculator page.
- Birth dates, names, and email addresses never appear in analytics payloads.
- The four-scene cinematic journey is removed from the homepage.
- The hero remains accessible and usable across mobile, tablet, and desktop layouts.

## Approved visual direction

Use the **editorial split** layout selected during visual review.

### Desktop and tablet

The hero uses two primary columns:

- The left column establishes the free offer, explains the fixed 52-card system, and carries a restrained three-card illustration.
- The right column contains the birthday input and primary calculator action.

The form must appear within the initial desktop viewport. The visual hierarchy must make the calculator action unmistakably primary.

### Mobile

The content stacks in this order:

1. Eyebrow
2. Headline
3. Explanation
4. Birthday form and submit button
5. Trust markers
6. Supporting card illustration, if it fits without pushing the form below the first useful viewport

The calculator must remain the first meaningful interaction. Decorative imagery may be reduced or omitted at small breakpoints.

### Brand treatment

Continue the existing Card Blueprints paper, ink, oxblood, serif, and editorial visual system. Use a restrained card composition rather than the current full-screen video journey. Respect reduced-motion preferences and avoid motion required to understand or use the form.

## Initial hero content

### Left column

- **Eyebrow:** Free · instant · no signup
- **Headline:** Which playing card were you born under?
- **Explanation:** Your birthday maps to one card in a fixed 52-card system. Enter it to reveal yours.
- **Trust markers:** 52 cards · 366 birthdays · not tarot

### Right column

- **Label:** Enter your birthday
- Full birthday date input
- **Primary action:** Reveal my birth card
- **Reassurance:** Private calculation · result appears here

There is no paid Blueprint CTA inside the initial hero. The global header may retain its current $13 Blueprint action.

## Result and lead flow

After a valid submission, the result expands within the homepage hero without navigation.

### 1. Immediate result

Show:

- Playing-card artwork
- The birth-card name in the form “Your birth card is the Eight of Diamonds”
- The ruling-card layer when applicable

No signup is required to see this state.

### 2. Free meaning path

Offer a contextual link such as **Read the Eight of Diamonds meaning**. This keeps the next free action specific to the revealed result and routes the visitor into indexable card content.

### 3. Optional course invitation

Below the free result, show:

- **Prompt:** Want to learn how to read your card?
- Name field
- Email field
- **Action:** Send me the free 4-part course
- Existing consent, privacy-policy, and unsubscribe language

Reuse the current free-course signup system and submit with the source value `home-hero-result`. A successful submission follows the existing course-access behavior.

### 4. Paid path

Show a visually quieter link below the free actions:

- **Get the complete Personal Blueprint · $13**

The paid action must not obscure the result or appear before it.

## Component design

Replace `<HomepageJourney />` in `app/page.tsx` with a dedicated `<HomepageCalculatorHero />`.

The new hero must reuse the existing Cardology calculation engine and birth-card truth mapping. It must not introduce a second calculation implementation.

Implementation may parameterize or extract reusable behavior from `components/seo/BirthCardCalculator.tsx`, but the resulting boundaries must keep these responsibilities distinct:

- Shared date validation and Cardology calculation
- Shared result data and accessible status announcement
- Dedicated calculator-page presentation
- Dedicated homepage editorial hero presentation
- Optional homepage-only free-course invitation
- Placement-aware analytics attribution

The homepage implementation must preserve the current Elroy birth-card reveal event behavior if the shared calculator flow already depends on it.

## Analytics and privacy

Track anonymous funnel behavior with homepage-specific placement values:

- Calculator started
- Calculator completed
- Card-meaning link clicked
- Course offer shown
- Course signup submitted or completed through the existing lead event
- Blueprint link clicked

Use placement or source values that distinguish the homepage hero from the dedicated calculator page. Do not include birth date, card-derived personal data, name, or email in GA4 or other analytics payloads.

The birth date remains browser-side for calculation and UI state. The free-course request sends only the fields already required by the course API: name, email, honeypot field, and source.

## Homepage cleanup

Because the calculator becomes the homepage entry point:

- Remove the duplicate **Find Your Birth Card Free** row from the free-path section immediately below the hero.
- Keep the compatibility calculator, birthday directory, and beginner pathway.
- Remove the four-scene cinematic journey from the homepage.
- Leave the journey media files in place unless a repository-wide reference check confirms they are unused and removal is explicitly included in the implementation plan.
- Keep the deeper free-course section lower on the homepage as a second opportunity for visitors who do not submit through the hero.
- Correct touched $29 Personal Blueprint references to the live $13 price.

Do not perform unrelated homepage restructuring or visual refactoring.

## Error handling

- An incomplete or invalid date produces a clear inline error associated with the field.
- A calculation failure never displays a guessed or stale result.
- The free result remains visible if course signup fails.
- Course errors are shown inline and can be retried.
- A course API failure never blocks the free meaning link or paid Blueprint path.
- Submission controls communicate loading state and prevent accidental duplicate course requests.

## Accessibility

- Use a visible date label and accessible error association.
- Support keyboard input and form submission.
- Announce calculation status and result through an appropriate live region.
- Move or preserve focus deliberately when the result expands, without trapping the visitor.
- Ensure all controls meet minimum touch-target expectations.
- Maintain readable contrast in paper, ink, oxblood, and dark course-offer states.
- Respect `prefers-reduced-motion` for card reveals and scrolling.

## Verification plan

### Automated checks

- Valid standard birthday returns the expected birth and ruling cards.
- Leap-day handling returns the expected result.
- December 31 returns the Joker boundary result.
- Invalid and incomplete inputs do not produce results.
- Homepage analytics use homepage-specific placement values.
- Course requests use `home-hero-result` attribution.
- Analytics payloads contain no birth date, name, or email.
- Existing calculator-page behavior remains intact.

### Manual checks

- Desktop, tablet, and mobile layout verification
- Keyboard-only completion and course signup
- Screen-reader label, error, and result announcements
- Reduced-motion behavior
- Successful and failed course requests
- Result links for standard cards and Joker
- Initial viewport prominence of the calculator
- No duplicate calculator CTA immediately below the hero

### Release checks

- Repository tests pass.
- TypeScript validation passes.
- Production build passes.
- Live homepage is verified in a real browser at mobile and desktop widths.
- GA4 receives only anonymous funnel metadata.
- No deployment or production cutover occurs without explicit user approval.

## Out of scope

- Changing the Cardology calculation rules
- Redesigning the dedicated calculator page beyond reusable internal refactoring
- Rewriting the four-part course
- Changing the course email provider or API contract
- Altering the $13 Blueprint product or checkout
- Deleting journey media without a verified unused-file review
- Broad homepage, navigation, or footer redesign
