# Karma origin lab (v1 dwell → $9) — design

Date: 2026-08-29  
Status: draft for Cass review (not implemented)  
Repo: `~/cardology-elroy-qa`  
Route: `/birth-card-calculator` result only (no new URL)

## Goal

A **free-to-$9 dwell**: birth card → one-person Life Path board → **karma origin taught by doing the math** → Get Deep Dive $9.

Not a club. Not chat, polls, XP, 7-year, yearly, 52-day, or daily discovery.

Line: Cards are coordinates. You choose the meaning. No fate / destiny / fortune / predict.

## Approved decisions

- v1 job = conversion path, not post-purchase map or logged-in community
- Gated layer = **karma cards**
- Unlock = pedagogy: equation → tap **solar value on spirit (year-0) spread** → find that card on **life spread (spread 1)** → see Env/Disp origin
- One widget on the existing calculator result
- $9 in-calculator Stripe (`DeepDiveCta`), this birthday only

## Non-goals

- New account, chat, polls, gamification loops
- Compat swap board (already shipped elsewhere)
- Worker HTML
- New karma formula
- Joker silent K♠

## Engine (do not reinvent)

| Fact | Source |
|---|---|
| Spirit spread = year 0 | `SPREADS[0]` / life-spread comments in `lib/reading.ts` |
| Life path = spread 1 | `LIFE_PATH_SPREAD_YEAR = "1"`; not year-0 walk |
| Lifetime karma | `cardology.getEnvironmentDisplacement(bc, 1)` |
| Golden pairs | `scripts/karma-golden.test.ts` (A♥→A♦/3♥, Q♠→10♦/8♦, 8♦→7♣/Q♠, Fixed null) |
| No karma | J♥, 8♣, K♠ (`bc_lifetime` null) — 17 birthdays/year |
| Joker | Dec 31, solar value 0 — lab does not start |

**Solar tap (beat B):** the correct cell is the unique year-0 grid cell the engine associates with this birth card’s `solar_value`. Pin with a unit test on **1991-02-17 → 8♦** before UI. Do not invent a second coordinate system in the component.

Env = environment card; Disp = displacement card. On-screen labels: **Environment** and **Displacement**. Age-indexed yearly Env/Disp (age vs age+1) is **out of v1** — this lab is **lifetime** karma only (`…(bc, 1)`).

## Result layout (top → bottom)

1. Existing birth-card reveal (card, ruling, meaning link)
2. **Life Path board** — 14 seats, this person only, no swap, no $9
3. **KarmaOriginLab** — beats A → B → C, cannot skip
4. **DeepDiveCta** `placement="birth-card-calculator-result"` `source="birth-card-calculator"` (move from above the lab so dwell happens first)
5. Existing free-course block

## Beats

### A — Equation
- Show: date → solar value → birth card (same numbers the engine used)
- Challenge: pick the correct card from 3 options (1 real, 2 other deck cards, never the two Fixed that would confuse “no karma”)
- Wrong: stay on A. Right: unlock B
- Copy: “Same date, same card. Not a draw.”

### B — Spirit (year 0)
- 7×7 grid labeled **Spirit (year 0)**
- Tap a cell. Correct = solar-value coordinate for this birth card
- Wrong: “Not that coordinate.”
- Right: highlight the card that tap names; unlock C
- Do not call this Life Path

### C — Life spread + karma
- Grid labeled **Life path (spread 1)**
- Highlight the card named in B
- Then show Env + Disp from golden table, each with existing meaning one-liner if already on `/birth-card/{slug}`
- One sentence: these cards come from reading spirit against spread 1 — coordinates, you choose the meaning
- Then $9 CTA below the lab

### Fixed cards
Skip B/C grids. After A: “J♥ / 8♣ / K♠ have no Environment or Displacement pair.” Still show Life Path board. Still offer $9 for the rest of the map.

### Joker
Lab hidden. Existing Joker copy. No karma, no fake K♠.

## Files (likely)

| File | Change |
|---|---|
| `components/seo/BirthCardCalculator.tsx` | Insert Life Path + lab; move `DeepDiveCta` below lab |
| `components/seo/KarmaOriginLab.tsx` | New client widget |
| `lib/life-path.ts` / engine | **Read only** unless a test proves a tap coordinate helper is missing — then a tiny exported helper with golden tests, no math change to karma pairs |
| `scripts/karma-origin-lab.test.ts` | New |

No Worker. No new route.

## Errors

| Case | Behavior |
|---|---|
| No reveal yet | Lab not mounted |
| Joker | Lab not mounted |
| Wrong equation pick | Stay A |
| Wrong spirit cell | Stay B, no C leak in DOM |
| Fixed card | A then honest empty; $9 still available |
| Engine null karma on a non-Fixed card | Fail closed: don’t invent cards; show “unavailable” |

Do not put birthdays in funnel event payloads.

## Tests

Keep `karma-golden.test.ts` unchanged (contract).

Add:

- 8♦ (1991-02-17) Env/Disp = 7♣ / Q♠ and lab would show those codes
- J♥ / 8♣ / K♠ → null, empty state copy present in source
- Beat C markup cannot render before A+B success (state machine test or source invariant)
- `DeepDiveCta` still present once on the calculator page; not above the lab
- Spirit label and Life path label both present (anti-mixup)
- Banned words in new copy: fate, destiny, fortune, predict, soulmate

`bun run test && bunx tsc --noEmit`

## Deploy

Pages only, from `~/cardology-elroy-qa`, Cass says **deploy**.

## Later (not this spec)

7-year long range, yearly 9-walk, 52-day, week/day, polls, chat, XP. Those wait until this dwell actually moves $9.
