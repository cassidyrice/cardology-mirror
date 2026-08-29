# Compatibility Life Path board — design

Date: 2026-08-29  
Status: draft for Cass review (not implemented)  
Repo: `~/cardology-elroy-qa`  
Route: `/birth-card-compatibility-calculator` only

## Goal

Upgrade the **existing** two-birthday compatibility calculator so the result is a **tappable Moon+13 Life Path board** (swap whose board), then sell **Get Deep Dive $9** in-calculator — not $13 Blueprint.

Line: Cards are coordinates. You choose the meaning. No fate / destiny / fortune / predict. No 52xseven.com. No new Stripe SKU.

## Approved decisions

- Upgrade in place (same URL). Not a new `/compat-lab`. Not a 7×7 fractal grid.
- Board is **14 seats** (Moon + 13). Engine already emits `position` 0–13. Do not fake a 13-only board.
- Tap a seat on person A’s path to see that seat’s card and whether person B’s **birth card** lives in that role. Swap A/B.
- Paid CTA: **Get Deep Dive $9**, same Stripe path as birth-card calculator (`DeepDiveCta` → `/checkout/deep-dive/session`).
- Deep Dive is for the **first birthday** only. Copy must say that. No second checkout for person B in this version.
- Keep pair Worker link + `{card} meaning` links.

## Non-goals

- New route or sitemap URL
- Worker `/compatibility/*` HTML
- Names, avatars, ruling-card overlay
- 7×7 Life Spread visualization
- Mass pair-leaf title work
- Changing Life Path math (`LIFE_PATH_SPREAD_YEAR = "1"` stays; this is **not** year-0 / spirit spread)

## Current state (replace, don’t duplicate)

`components/seo/CompatibilityCalculator.tsx`:

- Form: two `<input type="date">` → `buildLifePathProfile`
- Result: two tilted `PlayingCard`s, suit chemistry sentence, two `ConstitutionPanel` essays, “Relationship cross-reference”, shared-card rows, **Get My Blueprint $13**, pair anchor, meaning links
- Joker: `buildLifePathProfile` fails → “Enter two full birthdays to compare.”

Engine (`lib/life-path.ts`) already has everything the board needs: `allCards` (14), `compareLifePathProfiles` → `aSeesB`, `bSeesA`, `sharedCards`.

## Architecture

Same page shell and SEO/FAQ. Client calculator only. No new API. No Worker deploy.

```
dates → buildLifePathProfile(a), buildLifePathProfile(b)
      → compareLifePathProfiles(a, b)
      → UI: header + board(active) + detail + shared chips + $9 CTA
```

Swap flips `active`/`other`. Does not recompute.

## UI

1. **Form** — unchanged (first birthday, second birthday, Compare).
2. **PairHeader** — two face-up cards + “meets” + existing suit one-liner.
3. **BoardOwnerToggle** — “First person’s path” | “Second person’s path”. Default first.
4. **LifePathBoard** — 14 seats in engine order: Moon, Birth, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Princess, Prince, Queen, King.
   - Each seat: `shortTitle` + card pip (`card` code).
   - **Hit ring** (gold): `seat.card === other.birthCard` (this is `aSeesB` / `bSeesA` depending on owner).
   - **Shared mark**: `seat.card` appears in `other.allCards`.
   - One selected seat. `aria-pressed`. Arrow keys + Enter/Space.
   - Default selection: hit seat if present, else Birth (position 1).
5. **SeatDetail** — selected seat:
   - `{shortTitle} — {phrase}`
   - `{label}` + constitution line
   - If hit: existing `relationshipSentence` for that role
   - If not hit: one sentence that the other birth card is **not** in this seat (no score, no “incompatible”)
6. **SharedList** — chips from `sharedCards`. Tap selects that card’s seat on the **active** board (first matching role if several).
7. **CTA block**
   - `DeepDiveCta` with `placement="compatibility-calculator-result"`, `birthdate={firstDate}`, `source="birth-card-compatibility-calculator"`
   - Remove Blueprint $13 button and `personalCheckoutHref` / `instantReportBySlug` from this result
   - Keep `CompatibilityWorkerAnchor`
   - Keep meaning links with exact `{label} meaning` text
   - Keep guide link to `/cardology-compatibility`

Mobile: board is a 2-column list of seats (not a tiny 14-up grid). Desktop: wrap to ~7+7 or 2×7. No horizontal page overflow. Calculator-first: form still above the result.

## Copy rules

- No fate / destiny / fortune / predict / soulmate / “meant to be”
- “Coordinates / pattern / role” language
- Deep Dive line: this $9 is the **first** birthday’s Deep Dive, not a couple report
- Do not bake any price except $9

## Errors and empty states

| Case | Behavior |
|---|---|
| Missing/invalid date | Existing error string. No board. |
| Joker (Dec 31) | Profile null → same error. Never silent K♠. |
| Same two dates | Allowed. Board works; hit will be Birth vs Birth. |
| No hit (`aSeesB` null) | Board still renders. Default seat Birth. Detail has no relationshipSentence. |
| No shared cards | SharedList shows the existing “no direct shared cards” note. |
| Swap with no pair | Toggle disabled until both profiles exist. |

Do not send birthdays in funnel event payloads (privacy test already greps this file).

## Data / accessibility

- Hit computation must match `compareLifePathProfiles` (no second algorithm).
- Selected seat announced via `aria-live` (reuse the status node).
- Seats are buttons, not divs.
- Color is not the only hit signal (ring + text “lives here”).

## Testing

Keep existing:

- `scripts/compatibility-calculator-h1.test.ts` (calculator still first on the page)
- `scripts/calculator-library-links.test.ts` (Worker pair `<a href>` not `next/link`)
- `scripts/audit-privacy-leak.test.ts`

Add:

- Engine: given two known birth cards, `aSeesB.position` equals the board’s hit seat for A
- Source grep: result must contain `DeepDiveCta` and must **not** contain `Get My Blueprint` / `personal-card-blueprint` offer slug
- Source grep: `LIFE_PATH_ROLES` length 14 still drives the board (no hardcoded 13)

`bun run test && bunx tsc --noEmit` before deploy.

## Files likely to change

| File | Change |
|---|---|
| `components/seo/CompatibilityCalculator.tsx` | Replace `ConstitutionPanel` result with board + detail + $9 CTA |
| `app/birth-card-compatibility-calculator/page.tsx` | Only if FAQ/H1 needs a one-line “tap the Life Path” — optional, not required |
| `scripts/*` tests above | Grep/assertions |

No `lib/life-path.ts` math change unless a test proves `compareLifePathProfiles` disagrees with the board (then fix the UI, not the spread year).

## Deploy

Next Pages only (`bun run pages:deploy` from `~/cardology-elroy-qa`). No Worker. Cass says **deploy**.

## Success

- Result is usable on a phone: tap seats, swap, read one panel
- First-birthday $9 checkout still POSTs `/checkout/deep-dive/session`
- Organic URL unchanged; no query split
