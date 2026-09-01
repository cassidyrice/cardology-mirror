# The Cardology System

The single specification for the 90-spread system. Every claim here that can be
checked is checked by `scripts/cardology-system.test.ts` against the real engine.
If this document and the engine disagree, the test fails and this document is
wrong.

## 0. The one-authority rule

`lib/engine-core/engine.js` is the only executable authority. It is byte-verified
against the published calculator and **must not be modified**; when a consumer
needs a new primitive, declare it in `engine.d.ts`.

Anything that reproduces the spreads — a lookup table, a spreadsheet, a port in
another language, a skill — is a **derived copy**, and a derived copy without a
parity test against `engine.js` does not exist. It will drift, it will look
plausible while drifting, and no one will notice.

**Never re-derive the permutation by hand.** A transcription applied in the wrong
direction produces tables that agree at spreads 0 and 45 and are wrong at the
other 88. Run the engine and diff its output.

## 1. Cards and birth card

Solar values 1–52 map by suit then rank: Hearts A–K = 1–13, Clubs 14–26,
Diamonds 27–39, Spades 40–52.

```
solar_value = 55 − (2 × month + day)
if solar_value <= 0: solar_value += 52
```

Dec 31 yields solar value 52 → K♠ in this engine. The Joker-lineage conflict is
disclosed on the reading, never hidden. Feb 29 births read from Feb 28 in
non-leap years.

## 2. The 90 spreads

One fixed permutation `P` advances Year 0 to Year 1, and `S(n) = Pⁿ(S₀)`.

`P` decomposes into cycles of lengths **45, 2, 2, 1, 1, 1**, so it has order
`lcm(45, 2) = 90`. Therefore:

- Spreads are indexed **0–89**; there are exactly 90 distinct arrangements.
- **Spread 90 is spread 0.** The engine caches 91 entries (0–90) so that `age + 1`
  at age 89 does not fall off the end. The 91st is a duplicate, not a 91st spread.
- All wrap-around is `mod 90`, never `clamp`. Age 94 → spread 4, not spread 90.

`getSpread()` reduces internally. **`getEnvironmentDisplacement(card, spreadYear)`
does not** — it indexes `SPREADS[spreadYear]` raw, and out-of-range input returns
`null`, which is indistinguishable from the legitimate `null` for a Fixed Card.
Callers must reduce before calling it.

### Fixed and Semi-Fixed cards

- **Fixed** — `8♣, J♥, K♠` are fixed points of `P`. They never move, in any
  spread, and have no karma pair. Return null and say so.
- **Semi-Fixed** — `2♥↔A♣` and `9♥↔7♦` form the two 2-cycles.

The Semi-Fixed pairs are why the cycle is 90 and not 45. After 45 steps the
45-cycle returns home but both 2-cycles are still swapped, so spread 45 differs
from spread 0 in exactly those four cards. **A 45-year shortcut is right for 48
cards and silently wrong for four.** It has been implemented by mistake more than
once.

## 3. The calculator split

**An age does not name a spread.** Three reading elements resolve an age three
different ways. Naming the wrong one is the defining bug of this system.

| Element | Resolution |
|---|---|
| **Karma spread** — Environment / Displacement | `age mod 90` |
| **Period spread** — Mercury→Neptune, Pluto, Result | `(age + 1) mod 90` |
| **Long Range** | spread `floor(age / 7) + 1`, position `age mod 7` |

Karma and period differ by 1 because spread 0 is the reference layout while age
0's own period wheel is spread 1. Long Range is not an offset variant at all — it
indexes by seven-year cycle, so it only ever touches spreads 1–13.

No parameter named `spreadYear` can be correct for all three. The unsuffixed name
is **banned**, not discouraged. Every stored record labels which index it used.

Age is **completed** age on the target date: subtract one if the birthday has not
yet passed.

## 4. Environment and Displacement

Read against spread 0:

- **Environment** — the card in the target spread at the birth card's spread-0 position.
- **Displacement** — the spread-0 card at the birth card's target-spread position.

An inverse positional lookup. Calling environment "support" and displacement
"tax" is interpretation, not calculation.

**Lifetime karma** uses spread **1** — `getEnvironmentDisplacement(card, 1)`. That
is what every shipped product renders, and `scripts/karma-golden.test.ts` is its
contract for all 52 cards.

### The mirror law

The karma sequence is a palindrome around spread 45. For every non-Fixed card:

```
env(n)  =  disp(90 − n)
disp(n) =  env(90 − n)
```

Verified for all 49 non-Fixed cards at every n tested. Spreads 0 and 45 are the
fixed points of the mirror, where `90 − n ≡ n` forces `env === disp`.

Separately — and measured, not derived — the 90 spreads collapse further:

| Card type | Distinct ordered pairs across all 90 spreads |
|---|---|
| The 45 rotation cards | **45**, each occurring exactly twice |
| The 4 Semi-Fixed cards | **2** |

So a rotation card's per-age karma sequence is **exactly half redundant**: 45
readings shown twice, not 90 distinct ones. Those 45 reduce to 23 unordered pairs
— 22 reversed couples plus the one symmetric self-pair.

At **spread 0** every card is its own environment and displacement, because spread
0 is the reference. At **spread 45** the same holds *except* for the four
Semi-Fixed cards, which return their partner:

```
spread 45:   8♦ → 8♦/8♦      A♥ → A♥/A♥
             2♥ → A♣/A♣      9♥ → 7♦/7♦
```

That is the two 2-cycles reading out directly: spread 45 is spread 0 with only
those four swapped (§2).

**Consequences for anything that renders karma per age.**

1. Lifetime karma is simply age 1 of the per-age sequence — identical output, not a
   separate mechanic. Age 89 is its exact reverse.
2. The per-age sequence carries **45 distinct pairs, not 90** — each appears twice.
   For a Semi-Fixed card it carries **2**. Do not present it as 90 independent
   readings; a 2♥ customer would be shown the same two answers ninety times.
3. Spread 0 (age 0) is degenerate — every card returns itself. Not a bug.
4. The four Semi-Fixed cards have `env === disp`, so the mirror is invisible on
   them. Reversing a symmetric pair changes nothing.

Because 88 of 90 ages produce a different pair than the lifetime one, a per-age
karma display will contradict every surface that renders lifetime karma. If both
are ever shipped, the per-age series needs a **different name** — "Environment"
and "Displacement" are already claimed.

## 5. Nine-card extraction

From an anchor card's position in a spread, walking the flattened grid and
wrapping through the crown, collect nine cards in order: Mercury, Venus, Mars,
Jupiter, Saturn, Uranus, Neptune, **Pluto, Result**.

Pluto and Result are positions in this extraction, not periods of time.

## 6. Grid, crown, orientation

49 grid cells (7×7) plus 3 crown cells = 52 positions. Rows and columns are both
ordered Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune.

Orientation is a genuine, documented split: the engine and yearly-grid document
store each row and the crown Neptune→Mercury; workbook position numbering reads
Mercury→Neptune. Both describe the same 52 positions. **Never convert a position
number to a row/column label without stating `display_orientation`.**

## 7. Planetary periods

The birthday is day 1.

| Planet | Days |
|---|---|
| Mercury | 1–52 |
| Venus | 53–104 |
| Mars | 105–156 |
| Jupiter | 157–208 |
| Saturn | 209–260 |
| Uranus | 261–312 |
| Neptune | 313–366 |

Neptune absorbs the remainder — 53 or 54 days depending on whether the birthday
year spans a leap day. **"Seven periods of exactly 52 days" accounts for only 364
days and is an approximation**; do not encode it. Outputs should show actual date
ranges rather than imply equal lengths.

## 8. The daily and weekly fractal

`630 = 90 spreads × 7 days`. One spread per week, one card per weekday, repeating
perpetually. Use `getWeekly()`:

```
weeksLived  = floor((targetDate − birthDate) / 7 days)   // real elapsed days
spreadIndex = (weeksLived + 1) mod 90                    // period convention
```

It returns `weeks_lived`, `spread_used`, the seven cards Monday→Sunday, and
`current_card` — the daily card.

Two failure modes to avoid, both of which have shipped before:

1. `years × 52 + week_of_year` is not a week count. A year is ~52.18 weeks, so it
   drifts about a week every seven years, and it mixes a January-anchored ISO week
   into a birth-anchored count.
2. `targetDate` is required. Never call it implicitly for "today" from a build
   step — that bakes build-time "today" into a page that claims current timing.

## 9. The seven-year structure

`90 = 12 × 7 + 6`. Ages 0–89 hold twelve complete seven-year cycles plus a
six-year remainder (ages 84–89, cycle 12).

Cycle 12's extraction generates seven cards but only six are ever assigned; the
seventh is reached only at age 90. **Open question:** whether that card is shown,
dropped, or the canon extends to age 90 for this layer alone. Do not render cycle
12 as a full seven-year chapter until it is decided.

## 10. Ages past the canon

Ages ≥ 90 are projections, not new spreads. Return the canonical age and label it:

```json
{ "age": 94, "canonicalAge": 4, "cycleNumber": 2, "isProjection": true }
```

## Related

- `scripts/cardology-system.test.ts` — enforces this document
- `scripts/karma-golden.test.ts` — the 52-card karma contract
- `docs/reading-voice.md` — reading tone and labeling rules
- Cardology Brain `canon/` — interpretive ontology and source provenance
