# Cardology Fractal Explainer — Design Specification

## Status

Design approved in conversation; implementation has not started.

## Intent

Create a high-quality, programmatic, text-led animated explainer for curious beginners. The film explains the mathematical structure of a deck of cards, Cardology birth-card calculation, deterministic permutation, and repeating time scales: weekly, seven-year, and seven-card planetary/life-path structures. The requested 13-year relationship will be verified against repository sources before it is presented as an engine-backed calculation.

## Locked creative brief

- **Format:** text-led; no spoken narration
- **Audience:** curious beginners
- **Length:** approximately 3:30, within the requested 3–4 minute range
- **Destination:** TikTok / Reels
- **Aspect:** 9:16 vertical
- **Visual direction:** Ink Geometry
- **Palette:** warm paper, black ink, restrained red accent
- **Audio:** minimal ambient score with subtle paper/card/diagram sounds
- **Birth-card example:** generic fictional date, not the user's personal birth date
- **Tone:** mathematically curious, clear, grounded, non-spooky

## Editorial guardrail

The film will distinguish between:

1. Arithmetic and deterministic structures that can be verified in the repository, and
2. Cardology's interpretive or symbolic framework.

The video will not imply that Cardology is scientifically validated, predictive fate, or supernatural. Claims such as the 52-card calendar correspondence and Joker remainder will be framed as the Cardology model where appropriate. The 13-year life-path relation will not be called engine-backed until verified against source data and code.

## Storyboard and timing

### 0:00–0:18 — Hook

A single card duplicates into a complete deck. Text introduces the question: a deck has 52 cards and a year has roughly 52 weeks.

### 0:18–0:45 — Deck geometry

Animate 4 suits, 13 ranks, 52 cards, 52 weeks, and 52 × 7 = 364. Fold the 4×13 arrangement into a calendar ring.

### 0:45–1:15 — Joker and remainder

Show 364 positions and the remaining day/overflow concept. Introduce the Joker as a distinct fifth element, clearly labeled as the Cardology model.

### 1:15–1:48 — Permutation

Animate the 7×7 spread through the fixed permutation `P`. Show `Year N + 1 = P(Year N)` and the return condition `P^90 = identity`. Transition the repeating grid into a helix to communicate recurrence without claiming identical years.

### 1:48–2:16 — Birth-card calculation

Use a generic date and the repository's solar-value formula:

```text
solar value = 55 − (2 × month + day)
```

Resolve the value to a card. Include a short December 31 / Joker edge-case note.

### 2:16–2:42 — Weekly fractal

Contract the year into a seven-position week. Show Monday through Sunday as seven cards generated through the same spread logic.

### 2:42–3:07 — Seven-year fractal

Expand a seven-card row into a septennial sequence. Show the age-to-cycle relationship and seven yearly positions, with the current position highlighted.

### 3:07–3:24 — Seven-card planetary / life-path structure

Map seven cards to Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune. Verify the 13-year relationship before final wording; if the repo does not expose it as a calculation, label it as an interpretive framework.

### 3:24–3:30 — Closing mirror

Collapse nested diagrams back to one card. Closing text: “The pattern repeats at different scales. The card is the mirror. The meaning is yours to examine.”

## Visual system

- Warm paper base with subtle grain
- Black engraved linework and card illustrations
- Restrained red for active card paths, current positions, and key equations
- Serif display type for section titles and equation emphasis
- Highly legible sans-serif or humanist text for explanatory labels
- Large text blocks and generous spacing for phone viewing
- Diagrams designed as video compositions, not webpage panels
- Slow camera pushes, measured reveals, and readable holds
- No frantic cuts or decorative motion that competes with the math

## Motion system

Use a single deterministic HyperFrames timeline per composition, with reusable scene modules:

- `DeckCalendarScene`
- `JokerRemainderScene`
- `PermutationScene`
- `BirthCardScene`
- `WeeklyFractalScene`
- `SeptennialScene`
- `LifePathScene`
- `ClosingMirrorScene`

Motion language:

- Card duplication and stacking for structural reveals
- Grid-to-ring and grid-to-helix transformations
- Path drawing for permutations and life-path links
- Count-ups and equation reveals for arithmetic
- Nested scaling to express fractal levels
- Strong perceptible movement: whole-group travel, card slides, line drawing, and camera pushes
- Seek-safe, paused, reproducible animation; no runtime randomness or time-dependent behavior

## Data and architecture

The composition will live in the `cardology-mirror` repository and will not modify the Cardology engine. It will use or mirror verified data from:

- `lib/engine-core/engine.js`
- `lib/engine-core/engine_data.js`
- `lib/birth-card-truth.ts`
- `lib/engine-core/engine.d.ts`
- Relevant Cardology knowledge and content files

Validation must confirm:

- The permutation contains 52 positions
- Applying it 90 times returns the original spread
- Birth-card output matches the repository engine
- December 31 resolves through the public Joker wrapper
- Weekly output contains seven cards
- Septennial output contains seven yearly positions
- The 13-year claim has a source-backed implementation or is explicitly marked interpretive

## Quality gates

1. Typecheck / lint / repository-specific tests pass.
2. HyperFrames composition check passes.
3. A preview render is inspected for phone readability and timing.
4. A freeze-detection check confirms meaningful motion throughout the film.
5. Contrast and text legibility are checked against the warm paper background.
6. Final render is verified as a playable vertical MP4 with the requested approximate duration.

## Deliverables

- Composition source and supporting data/validation script in the repository
- Preview render
- Final 9:16 MP4, approximately 3:30
- Technical notes separating engine-backed facts from interpretive framing
- Final artifact copied to `~/Desktop/hermes-outputs/`
