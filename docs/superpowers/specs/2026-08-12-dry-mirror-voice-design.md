# Dry-Mirror Voice Design

**Date:** 2026-08-12

**Status:** Written for review. No implementation until this spec is approved.

**Project:** Card Blueprints (`cardblueprints.com`)

**Repository:** `/Users/main/cardology-mirror`

**Decision:** Approach A — one voice law, rewrite at the source. Keep the live SKU and the three-position meaning model. Change the register from roast / gag-gift to dry-mirror.

## 1. Summary

The paid Card Blueprints stack currently speaks like a gag gift. The LLM reading prompts instruct a roast register with screenshot-worthy jokes. The deterministic meaning lines do the same work: punchlines, diagnosis-as-insult, slang dunks.

This spec replaces that register with one voice law for every surface in this pass:

**A clean mirror. Second person, present tense. Name the observable pattern and its cost. No jokes. No woo. No affirmation padding.**

The product remains the Personal Card Blueprint. "Mirror" is the voice, not a new SKU.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Scope | Whole voice system for the paid stack + Elroy |
| Temperature | Dry mirror |
| This pass | Meanings, reports, Blueprint sales, Elroy |
| Product name | Keep **Personal Card Blueprint** |
| Meaning model | Keep under / balanced / over |
| Engine math | Unchanged |
| Analog Algorithm, blog, shorts, pSEO | Out of this pass |

## 3. Goals

1. A paying reader should feel seen, not roasted.
2. The same sentence could be read alone, sent to a friend, or used as a reflection prompt without sounding like a dunk.
3. Shadow stays useful: habit + cost, never character defect.
4. One register across meanings, Blueprint report, Blueprint sales, Elroy, and gated LLM readings.
5. No slide back into roast or into soft woo.

## 4. Non-goals

This pass will not:

- rename the live SKU or Stripe product;
- change prices, checkout, fulfillment, or engine formulas;
- replace under / balanced / over with a new ontology;
- rewrite The Analog Algorithm, blog posts, shorts, or Worker pSEO pages;
- add 5:1 affirmation or inspirational uplift;
- add humor quotas, punchlines, or "screenshot-worthy" requirements;
- invent card meanings, numerology, fate, or medical / psych / legal / financial advice.

## 5. Voice law

Use this paragraph as the constitution. Every rewritten line must pass it.

> You are a clean mirror. Write in second person, present tense. Name the pattern as observable behavior, then name what it costs. Be specific enough that the reader can recognize a real Tuesday. Do not joke. Do not dunk. Do not diagnose character. Do not soothe, bless, or prophesy. Shadow is a habit that costs something, not a defect they are stuck with. If a line would get a laugh in a group chat, rewrite it.

### 5.1 Required

- Second person, present tense.
- Concrete behavior a stranger could watch.
- A cost, limit, or tradeoff when the pattern slips.
- Balanced lines that describe proportion, not praise.
- Reflective questions that point at a real choice, not a gotcha.
- Claim labels stay in force: mechanics are verified; interpretation is interpretive; origin myths stay speculative and labeled.

### 5.2 Banned

- Roast, mockery, sarcasm, smartass asides, dark-filter jokes.
- Screenshot bait and punchline metaphors (Pokémon cards, hostage situation, emotional tyrant, cancerous martyrdom, narcissistic supply).
- Diagnosis-as-insult (delusional, tyrant, weaponizing, pathologizing used as a dunk).
- Woo: the universe, energy, vibrations, manifest, destiny, fate, "exactly where you need to be."
- Horoscope clichés and inspirational-poster uplift.
- Soft hedges that hide the pattern: "you might gently notice," "perhaps a tender invitation."
- Humor quotas in prompts ("land at least one funny line").

### 5.3 Before / after (locked examples)

These are the register. New lines must sit next to them, not next to the old roast.

**5♥ under**

- Now: You're collecting relationships like Pokémon cards, vanishing whenever intimacy requires staying still.
- Mirror: You leave when a connection starts asking you to stay in one place. Variety looks like freedom; it can also be how you avoid being known.

**2♥ over**

- Now: You're managing everyone's emotions like a hostage situation, sacrificing yourself while secretly resenting their ingratitude.
- Mirror: You take responsibility for other people's moods. The cost is you disappear, then resent the people you were managing.

**6♥ under**

- Now: You're silencing your own needs for false harmony, harboring resentment while your martyrdom grows cancerous.
- Mirror: You keep the peace by not saying what you need. The quiet does not stay quiet; it turns into resentment.

**Sales headline**

- Now: More than your card. The *whole pattern*, in writing.
- Mirror: The pattern you already run, written down. Strengths, blind spots, current chapter.

## 6. Meaning contract

Keep the three positions. Change what each position is allowed to say.

| Position | Job | Must include | Must not include |
|---|---|---|---|
| Under | The pattern goes quiet, avoidant, or underused | The withdrawal and its cost | Cowardice jokes, defect language |
| Balanced | The pattern in proportion | What it looks like when it works | Praise, destiny, "your gift from the universe" |
| Over | The pattern takes over | The excess and its cost | Villain language, punchlines |

Length: one or two sentences. No lists inside a meaning line. No parenthetical jokes.

`card-descriptions.json` follows the same law:

- `core_identity`: who the pattern is when it is in proportion. Not a roast nickname dump.
- `shadow`: the habit plus the cost. First sentence must be publishable by Elroy on its own.
- `gifts`: observable capacities, not compliments.
- `life_direction`: a practice, not a prophecy.

Elroy currently takes the first sentence of `core_identity` and `shadow`. Those first sentences are therefore public product copy.

## 7. Surfaces in this pass

### 7.1 Engine copy

- `lib/card-meanings.json` — all 52 under / sweet_spot / over lines
- `lib/engine-data/card-descriptions.json` — core_identity, shadow, gifts, life_direction as needed to pass the voice law
- `lib/elroy/copy-overrides.ts` — any override that still roasts

Do not change card titles, codes, or calculation tables.

### 7.2 Paid Blueprint

- `lib/products.ts` — oneLine, bestFor, includes, checkoutNote only if they carry roast or gag-gift framing
- `app/products/personal-card-blueprint/page.tsx` — headline, body, section copy
- `lib/blueprint.ts` — the three reflection prompts
- `lib/blueprint-sample.ts` — sample report text stays in sync with the live builder

SKU, price ($29), slug, and fulfillment stay as they are.

### 7.3 Gated LLM readings

Replace the roast overlay in:

- `lib/interpretation-guidance.ts` (Reader voice section + provenance comment)
- `app/api/deepdive/route.ts`
- `app/api/storyarc/route.ts`

New prompt voice block must quote the voice law. Delete: smartass, roast, sarcastic, dark filter, screenshot-worthy, "do not soften this," mockery-in-service-of-insight.

Keep: card fidelity, no fate, under / balanced / over, second person, concrete Tuesday-level examples.

If `cardology-myquestion` still carries the old overlay, treat it as a follow-up repo. Do not silently edit it in this pass unless the implementation plan explicitly includes it.

### 7.4 Elroy

Elroy stays deterministic. No new LLM.

- Rewrite source sentences so inherited core / tension lines pass the voice law
- Teaser and intro copy stay dry-mirror if they currently punch
- Closing CTA remains the $29 Personal Card Blueprint
- Disclaimer stays: reflection prompt, not prediction or professional advice
- Widget behavior, Turnstile, suppression, and analytics do not change

## 8. Out of this pass

- The Analog Algorithm PDF and `/products/analog-algorithm`
- Blog, shorts, video VO, pSEO Worker pages
- Birth-card public meaning pages only if they do not consume the rewritten JSON. If they do consume it, they inherit automatically and do not need a separate rewrite.
- Stripe objects, prices, checkout session shape
- Offer retirement or ladder changes

A later pass can extend the same voice law to those surfaces. Do not sneak them in here.

## 9. Architecture

No new product kind. No new routes. No schema change unless a test currently asserts roast strings.

```text
voice law (this spec)
        │
        ▼
card-meanings.json ──► Blueprint current-chapter under/balanced/over
        │
card-descriptions.json ──► Blueprint core/shadow + Elroy first sentences
        │
interpretation-guidance + deepdive/storyarc prompts
        │
Blueprint sales copy + reflection prompts
```

The live site already derives report text from these files. Rewriting the source is the implementation. Do not add a render-time "tone translator."

## 10. Implementation order

1. Add a fail-closed voice lint (RED): banned tokens and roast prompt phrases must be absent from the files in §7.
2. Rewrite `card-meanings.json`.
3. Rewrite `card-descriptions.json` and Elroy overrides.
4. Replace LLM / interpretation voice overlays.
5. Rewrite Blueprint sales + `blueprint.ts` prompts + sample.
6. Turn the lint GREEN. Re-run Elroy copy audit and Blueprint / Elroy tests.
7. Page-by-page QA of the Blueprint sample and four Elroy readings (one per suit) before any preview approval.

Do not flip live copy in a partial state. Ship as one commit series on a clean worktree. Publication still requires explicit approval.

## 11. Verification

### 11.1 Voice lint

A regression script must fail if any in-scope file contains:

- roast, smartass, sarcastic, screenshot-worthy, gag, dunk
- Pokémon, hostage situation, narcissistic supply
- woo phrases: "the universe", "manifest", "vibrations", "your energy"
- "do not soften" as a prompt instruction
- Do not ban the isolated word "energy" — too many false positives

The lint must also fail if a meaning line uses a locked roast example from §5.3 ("Pokémon cards", "hostage situation", "martyrdom grows cancerous").

Mutation test: restore one old roast line, confirm the lint goes red, restore the clean file byte-exact.

### 11.2 Product contract

- Personal Card Blueprint remains slug `personal-card-blueprint`, $29, instant report
- `buildBlueprint` still returns the same fields
- Elroy still returns core / tension / reflection / disclaimer
- No new checkout path, no price change, no fulfillment change

### 11.3 Human QA

Before asking for preview approval, render:

1. Blueprint sample (existing sample birthday)
2. One Hearts, one Clubs, one Diamonds, one Spades Elroy reading
3. One deepdive prompt diff showing the roast block gone

Check each against the voice law. If a line would get a laugh in a group chat, it fails.

## 12. Legal and claims

Unchanged:

- Entertainment and self-reflection, not medical / psychological / legal / financial advice
- Tendencies, not fate
- Engine data wins conflicts with narrative prose
- Interpretive lines stay interpretive; do not promote them to verified mechanics

## 13. Success criteria

This spec is implemented when:

1. A stranger can read any under / over line and not mistake the product for a roast gift.
2. The same stranger still cannot mistake it for a horoscope or a pep talk.
3. Elroy, Blueprint sales, Blueprint report, and gated reading prompts do not contradict each other in tone.
4. The voice lint is GREEN and has been watched to fail.
5. Live SKU, price, and fulfillment are untouched.

## 14. Open items (none blocking)

- Whether `cardology-myquestion` is updated in a follow-up plan. Default: later.
- Whether public birth-card pages need unique prose beyond inherited JSON. Default: inherit only.
