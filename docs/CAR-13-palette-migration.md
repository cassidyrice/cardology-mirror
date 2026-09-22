# CAR-13 — Legacy dark palette off the paper-shell layer

Pass 1 inventoried the layer and proposed the mapping. Cass agreed that mapping, including D1 option (a), D2 (accept the warm-wash shift), D3 (ink-button preference), and D5 for shared primitives. Batches A through L are the deletions so far.

Status: batch L landed. Rule 3 (batch A), rule 4 (batch B), rules 5–6 (batch C: `.paper-shell [class*="text-gold"]`, `[class*="text-ember"]`, and the anchor override `a[class*="text-gold"]`), rule 7 (batch D: `.paper-shell .text-sage`, `.text-dusk`), rules 8 and 15 (batch E: `.paper-shell .text-ink`, `.paper-shell .bg-foil`), rule 18 (batch F: `.paper-shell [class*="bg-void"]`, `[class*="bg-haze"]`, `[class*="bg-cosmos"]`, `[class*="bg-white"]`), rule 17 (batch G: `.paper-shell [class*="border-white"]`, `[class*="border-bone"]`, `[class*="border-haze"]`, `[class*="border-gold"]`), rule 16 (batch H: `.paper-shell [class*="bg-gold"]`), rules 1 and 2 (batch I: `.paper-shell .starfield::before`, `.paper-shell .bg-cosmic`, `.paper-shell [class*="bg-cosmic"]`), rule 12 (batch J: `.paper-shell .card-surface`), rules 13 and 14 (batch K: `.paper-shell .card-frame`, `.paper-shell .foil-text`), and rules 9–11 (batch L: `.paper-shell .eyebrow`, `.paper-shell .prose-reading`, `.paper-shell .hairline`) are deleted. Rules 19–23 stay. The 18 palette remaps are gone. `tailwind.config.ts` dark palette keys stay. `:root` gained `--club: #183f30` and Tailwind gained `brand.club`. `brand.ivory` is `color-mix` with `<alpha-value>` so `bg-brand-ivory/70` paints; a bare `var(--ivory)` drops that utility. Solid `bg-brand-ivory` stays ivory.

`docs/SITE-RECORD.md` is not in this repository (`docs/SECURITY.md` already records that). This file is the §1.1 tracking note until that record exists.

## Tracking

The inventory was counted on `main` at `f040184` (the paper-shell remap block was lines 585–747). A deletion of the blueprint-ambient rules earlier in that file had moved this block up from the 739–901 range named in the issue. Batch A removed rule 3. Batch B removed rule 4. Batch C removed rules 5 and 6. Batch D removed rule 7 and added `--club` on `:root`. Batch E removed rules 8 and 15. Batch F removed rule 18. Batch G removed rule 17. Batch H removed rule 16. Batch I removed rules 1 and 2. Batch J removed rule 12 and moved the paper card onto the base `.card-surface` (lines 135–145), with `.card-surface-dark` at lines 147–152. Batch K removed rules 13 and 14. Batch L removed rules 9, 10, and 11. The base `.prose-reading` rule is lines 122–137. The base `.eyebrow` rule is lines 103–109. The base `.hairline` rule is line 140. The base `.foil-text` rule is lines 167–173. The block now ends at line 660. Appendix counts below are the pre-batch-A inventory.

| Slice | Rule groups | Remaining |
| --- | ---: | --- |
| Palette and surface remaps (the layer CAR-13 exists to remove) | 18 | 0 (0%) |
| Geometry and form chrome (radius, inputs, `.app-paper-stage`) | 5 | 5 (100%) |
| Whole `.paper-shell` compatibility block | 23 | 5 (22%) |

Batch A migrated exact `text-bone` on paper-shell screens to `text-brand-ink`, and added `text-brand-ink` beside `.display` (the type class stays). Inert `hover:text-bone` on those screens moved in the same change: `hover:text-brand-ink` on mist chips, `hover:text-brand-oxblood` on the gold anchor chips in `app/birth-card/page.tsx`. Still on the dark palette for bone: `app/layout.tsx` body, `app/access/page.tsx`, onboarding (`app/onboarding/page.tsx`, `ProfileForm`, `IntroSlide`), and unmounted `Brand` and `YearPreview`. `PlayingCard` titles no longer set `text-bone`; they inherit, so a paper-shell title stays ink and an onboarding title stays bone. Batch K split the frame: paper mounts are ivory, and onboarding keeps the dark frame. `ProfileForm`'s `hover:text-bone` stays.

Batch B migrated `text-mist`, `hover:text-mist`, `text-faint`, and `placeholder:text-faint` on paper-shell screens to `text-brand-ink-soft`, `hover:text-brand-ink-soft`, and `placeholder:text-brand-ink-soft`. `text-faint` maps to ink-soft, the same destination as mist. It does not map to `text-brand-ink-faint`. Resting body copy stays `--ink-soft`. Mist chips whose hover was moved to `hover:text-brand-ink` in batch A were inert under rule 4; that hover now darkens to ink. Inputs that carried `placeholder:text-faint` already set `text-brand-ink`. Rule 4's attribute selector was winning that element's own color over rule 19, so typed text moves from `--ink-soft` to `--ink`. Placeholder color was already rule 20 and stays there. Still on the dark palette for mist and faint: `/onboarding` (`app/onboarding/page.tsx`, `ProfileForm`, `IntroSlide`), `/access` (`AccessLink`), and unmounted `BottomNav`, `Brand`, and `YearPreview`.

Batch C migrated `text-gold` and `text-ember` on paper-shell screens in the same change, because rule 6 only exists to beat rule 5 on anchors. Labels are `text-brand-bronze`. Anchors (`<a>` and `<Link>` with the class on that element) are `text-brand-oxblood`. Eyebrows use `!text-brand-bronze`: rule 9 (`.paper-shell .eyebrow`) is more specific than a utility and is emitted after Tailwind, so a plain bronze class would paint ink-soft. Rule 5's `!important` was what kept those labels bronze. A gold class on a child inside a link stays bronze; rule 6 never painted the child. `hover:`, `group-hover:`, and opacity modifiers (`text-gold/80`, `text-gold/90`, `text-gold/50`) collapse to the plain brand class. The attribute selector forced full bronze or oxblood at rest, so those prefixes were already inert. Where `text-brand-ink` or `text-brand-ink-soft` sat on the same element, that resting class is removed, because the override had already beaten it. `text-ember` is bronze even on an anchor; rule 6 did not match it, and no paper anchor used it. `FreeCourseSignupForm`'s ink branch renders inside `/free-course`, so its asterisk is bronze and its privacy link is oxblood. The paper branch already used those tokens. `PositionStack`'s Over label is bronze; its `bg-ember` dot and the sage/dusk rows stay for batch D. `ObservationCard` complement and tension labels are both bronze (rule 5 already painted both that way); sage/dusk labels and the dots stay for batch D. `ReportCheckoutButton variant="link"` renders a button, so it is bronze. Still on the dark palette for gold and ember: `/onboarding` (`app/onboarding/page.tsx` `hover:text-gold`, `ProfileForm` `text-gold` and `text-ember`) and unmounted `BottomNav`, `Brand` (`active:text-gold`), and `YearPreview`.

Batch D applied D1 option (a). `:root` defines `--club: #183f30` (the value rule 7 forced, and the value `.landing-oracle` already set locally). `brand.club` maps to that variable. `text-sage` and `text-dusk` on `PositionStack` and `ObservationCard` are `text-brand-club`. ObservationCard labels sit on `.eyebrow`. Rule 9 is more specific than a utility and is emitted after Tailwind, so those labels use `!text-brand-club` or rule 9 paints ink-soft. Complement and tension were `text-brand-bronze` without `!` after batch C, which let the same rule paint them ink-soft; this batch adds `!text-brand-bronze` so they stay the bronze rule 5 forced. PositionStack labels are not eyebrows, so a plain `text-brand-club` holds. Dots stay three distinct colors: sage (`bg-sage`, the balanced position) is `bg-brand-club`; ember (`bg-ember`, the over position) is `bg-brand-bronze`; dusk (`bg-dusk`, the under position) is `bg-brand-oxblood`. Mapping sage and dusk dots both to club would collapse under and balanced. Option (a) names club and bronze-for-ember and requires three dots; oxblood is the remaining color named in option (b) and in the agreed note. `ObservationCard`'s complement dot was `bg-gold` until batch H (rule 16). `SelfClient`'s `bg-ember/5` and `border-ember/20` warning wash is not a position dot and stays. No paper-shell screen still uses `text-sage`, `text-dusk`, `bg-sage`, or `bg-dusk`. Dark palette keys, including unused `sage` and `dusk`, stay until the last consumer of the set is gone. `ember` still has the SelfClient wash.

Batch E applied D3. Paper-shell `text-ink` + `bg-foil` buttons are `ink-button` (the foil sibling pattern: calculator chips, free-course card CTA, the shell branch of `FreeCourseSignupForm`, `AccessGate`, `BondsClient` compare, `ProfilePrompt`). The three `bg-gold` + `text-ink` pairs (`what-is-cardology`, `cardology-for-beginners`, `destiny-cards`) are the $13 One Question Reading control, so they are `accent-button`. `what-is-cardology` also has a foil "$13 One Question Reading" chip in the keep-going row; that chip is one of several siblings, so it is `ink-button`, and the dedicated card above it stays the single accent. `FreeCourseSignupForm`'s paper branch (homepage, outside the shell) was already `accent-button` and is unchanged. Its default `surface="ink"` branch renders inside `/free-course` and was the foil button; that branch is `ink-button`. Field classes on that branch stay for later batches. `AccessLink` (`/access`) and `ProfileForm` (`/onboarding`) stay on `text-ink`. No paper-shell screen still uses `text-ink`. Decorative `bg-foil` remains on `FoilSheen` and `CardBack`. Batch K kept that gradient. Those are not buttons. Rule 15 had flattened them to `background: var(--ink)` inside the shell, so paper cards now paint the Tailwind foil gradient. Onboarding and the homepage never matched the rule, so their foil is unchanged. `bg-gold` washes that are not the three buttons stayed for batch H (rule 16). That batch moved them to `bg-brand-gold-soft`.

Batch F applied D2 to rule 18 only. Paper-shell `bg-void`, `bg-haze`, and `bg-white`, including every opacity, are `bg-brand-ivory/70`. Rule 18's attribute selector forced cream `rgba(244,240,231,.68)` and cleared `background-image`, so the written opacities (`bg-white/[0.03]`, `bg-white/[0.04]`, `bg-white/[0.06]`, `bg-white/[0.015]`, `bg-white/10`, `bg-white/15`, `bg-void/40`, `bg-void/60`, `bg-void/70`, `bg-haze/40`, `bg-haze/60`, and plain `bg-void` / `bg-haze` / `bg-white`) already painted that one fill. `bg-cosmos` had zero consumers; the dead selector went with the rule. `to-cosmos` does not contain `bg-cosmos`. Batch K dropped it on paper cards. `Skeleton` still uses `via-cosmos`. Inputs, textareas, and selects that carried these classes still take rule 19 (`background: rgba(244,240,231,.9)` on `.paper-shell input`, `textarea`, `select`). That rule is more specific than a utility and is emitted after Tailwind, so those fields stay cream until batch M. Panels, skeleton bars, the journal sheet, and the timing rail are not form controls, so they shift from warm cream to ivory. Still on the dark palette: `ProfileForm` `bg-void` (`/onboarding`), `app/onboarding/page.tsx` `bg-white/10`, and unmounted `Brand` (`hover:bg-haze/60`), `CompareBand` (`bg-white/5`), and `YearPreview` (`bg-white/[0.04]`). No paper-shell screen still uses `bg-void`, `bg-haze`, `bg-cosmos`, or `bg-white`. Rule 12 moved onto the base `.card-surface` in batch J. Rule 13 moved onto the paper `PlayingCard` frame in batch K. Rule 16 moved in batch H. Rule 17 moved in batch G. `tailwind.config.ts` dark keys are not edited. `brand.ivory` uses `color-mix` and `<alpha-value>` so the `/70` utility is emitted; without that, Tailwind drops `bg-brand-ivory/70` and the panel is transparent. Solid `bg-brand-ivory` stays ivory. `void`, `haze`, and `cosmos` stay until the last consumer of the set is gone.

Batch G applied D2 to rule 17 only. Paper-shell `border-white`, `border-gold`, and `border-haze`, including every opacity, are `border-brand-line`. Rule 17's attribute selector forced `border-color: rgba(20,17,13,.16)` at rest, on hover, and on focus, so `hover:`, `focus:`, `group-hover:`, and the written opacities already painted that one line. Those prefixes collapse to the plain class. Where the element already had a resting border color, the inert hover or focus class is removed. Side widths stay (`border`, `border-2`, `border-b`, `border-b-2`, `border-t`, `border-l`, `border-l-2`). `bg-gold` on the same elements stayed for batch H. `border-bone` had no paper-shell consumer. `border-bone/10` is only unmounted `BottomNav`, so that selector could die with the rule. Elements that also have `card-surface` use `!border-brand-line`. Until batch J, rule 12 (`.paper-shell .card-surface`) set a `border` shorthand after Tailwind and was more specific than a utility, so a plain class would have stayed the warm card edge. Batch J moved that shorthand onto the base `.card-surface` as `var(--line)`, the same color the important utility paints. Inputs, textareas, and selects still take rule 19 (`border-color: rgba(20,17,13,.18) !important` on `.paper-shell input`, `textarea`, `select`). That rule is more specific than a utility and is emitted after Tailwind, so field borders stay warm until batch M. `PlayingCard` still defaults to `border-white/10` for `/onboarding` (`ProfileForm`) and `HomepageCalculatorHero` (outside the shell; the live homepage renders `LandingCalculator`). Paper-shell mounts pass `frameBorder="border-brand-line"`. Rule 13 (`.paper-shell .card-frame`) still forces `border-color: rgba(20,17,13,.25) !important`, so the card frame edge stayed warm until batch K, which set `border-brand-line` on the paper frame. `DeckMatrix` already used `border-brand-line`; its inert `group-hover:border-gold/70` is gone, so the mini faces show the ink line rule 17 had been covering. Still on the dark palette: `ProfileForm`, `app/onboarding/page.tsx`, and unmounted `BottomNav`, `CompareBand`, and `YearPreview`. No paper-shell screen still uses `border-white`, `border-gold`, `border-haze`, or `border-bone`. Rule 12 moved onto the base `.card-surface` in batch J. Rule 13 moved onto the paper `PlayingCard` frame in batch K. Rule 16 moved in batch H. `tailwind.config.ts` dark keys are not edited.

Batch H applied D2 to rule 16 only. Paper-shell `bg-gold`, including every opacity, is `bg-brand-gold-soft`. Rule 16's attribute selector forced `background-color: rgba(158,61,36,.12)`, so `bg-gold/90`, `bg-gold/70`, `bg-gold/15`, `bg-gold/5`, `bg-gold/[0.06]`, `bg-gold/[0.04]`, and plain `bg-gold` already painted that one wash. Those prefixes collapse to the plain class. `--gold-soft` is `rgba(184,137,61,.14)`, so the wash shifts from the old warm red to the current gold. The three D3 buttons (`what-is-cardology`, `cardology-for-beginners`, `destiny-cards`) are already `accent-button` from batch E and are not in this change. The journal Save control was `bg-gold/90` with `text-void`. The fill is `bg-brand-gold-soft`. `text-void` has no shell override, so the label was near-black `#0a0b12` on the wash; it is `text-brand-ink`. The timing current-node glow (`shadow-[0_0_14px_2px_rgba(217,178,106,0.7)]`) is not a `bg-gold` class and stays. `from-gold` and `to-gold` on `ArcRail` do not match the selector and stay. Still on the dark palette: `app/onboarding/page.tsx` `bg-gold`, `ProfileForm` `hover:bg-gold`, and unmounted `BottomNav` `bg-gold`. No paper-shell screen still uses `bg-gold`. Rule 12 moved onto the base `.card-surface` in batch J. Rule 13 moved onto the paper `PlayingCard` frame in batch K. `tailwind.config.ts` dark keys are not edited.

Batch I deleted rules 1 and 2. Paper-shell `starfield` and `bg-cosmic` are removed from `TodayClient`, `SelfClient`, `BondsClient`, `JournalClient`, `TimingClient`, `StoryClient`, and `ReadingClient`. Those classes were already inert inside `.paper-shell`: rule 1 set `content: none` on `.starfield::before`, and rule 2 set `background: transparent !important` on `.bg-cosmic` and `[class*="bg-cosmic"]`. Deleting the classes keeps the paper the visitor already sees. `Screen` still supplies its own layout classes. `TodayClient` and `JournalClient` keep `mx-auto max-w-md`. The base `.starfield::before` rule earlier in `app/globals.css` stays, because `/onboarding` is outside the shell and still uses both classes on `<main>`. `app/onboarding/page.tsx` is unchanged. `tailwind.config.ts` `backgroundImage.cosmic` stays for that screen. No paper-shell screen still uses `bg-cosmic` or `starfield`. Rule 12 moved in batch J. Rules 13 and 14 moved in batch K. Rules 9–11 and 19–23 stay. Update this table again in the PR that deletes the next rule group. A batch that deletes no rule has not finished.

Batch J applied D2 to rule 12. The cream grid moved onto the base `.card-surface`, and the warm leftovers shifted onto brand tokens. The edge is `var(--line)`, the same token as `border-brand-line`. The fill is ivory at 78% (`color-mix` of `--ivory`), the weight the cream wash used. The grid lines and the shadow use `--ink` at the old 3.5% and 8% weights, in place of warm black `rgba(20,17,13,…)`. Radius stays `0.25rem`. `backdrop-filter` stays `none`. The 30 paper files keep the class `card-surface`. They sit inside `SeoShell`, so they no longer depend on `.paper-shell .card-surface`, which is deleted. No mounted screen used the indigo gradient. Unmounted `Brand`'s settings menu did: it is `card-surface-dark`, which keeps the indigo gradient, the bone hairline, the 18px radius, and the blur. Elements that already set `!border-brand-line` on `card-surface` keep that class. The utility is `border-color: var(--line) !important`, and the base shorthand sets the same color, so the edge stays the ink line. `tailwind.config.ts` is unchanged.

Batch K applied D2 to rule 13 and D5 to `PlayingCard`. `surface="paper"` sets the frame, not only the pips. The paper branch is `border-brand-line` and `bg-brand-ivory`. It does not carry `card-frame`, `from-haze`, or `to-cosmos`. The fill shifts from cream `rgba(244,240,231,.94)` to ivory. The edge shifts from warm `rgba(20,17,13,.25)` to `var(--line)`, the line batch G wrote and rule 13 had been beating. Paper-shell mounts (`TodayClient`, `DailyCard`, `SelfClient`, `CrownRow`, `BondsClient`, `PeriodRow`, `ArcRail`) pass `surface="paper"` and keep `frameBorder="border-brand-line"`. `HomepageCalculatorHero` already passed `surface="paper"` and no border; its default edge is now `border-brand-line`. The live homepage renders `LandingCalculator`, so that hero is not the public home. A paper halo uses `ring-brand-gold/60`. The inline glow stays `#d9b26a`; that shadow was never a shell rule. The dark branch keeps the class `card-frame` with `border-white/10`, `from-haze to-cosmos`, and `ring-gold/60`. `ProfileForm` on `/onboarding` does not pass `surface`, so that frame stays dark. There is no shell override. Bonds empty-state stand-ins were the same haze-to-cosmos gradient on a paper screen; they are `bg-brand-ivory` with the ink line they already had. Rule 14: the base `.foil-text` gradient is `var(--oxblood)` → `#c77e63` → `var(--gold)`, and `color: transparent !important` so rule 9 (`.paper-shell .eyebrow`) does not paint over the clip on `ComposingState`. The shell copy is deleted. Inside the shell the clip is the gradient visitors already saw (`--rust` was already `--oxblood`). Outside the shell, `CardBack`'s mark, dark court letters, and unmounted `Brand` move off the old gold foil onto that same gradient. Court letters on a paper face still skip `foil-text`. Decorative `bg-foil` on `FoilSheen` and `CardBack` stays. Rule 15 already dropped the ink flatten, so the gold gradient is the live sheen on both surfaces. Putting ink back would move paper off what batch E shipped. The card subtitle kept `.eyebrow` until batch L, which branches it: paper is `type-eyebrow`, dark keeps `.eyebrow`. `components/today/Skeleton.tsx` still uses `from-haze via-cosmos to-haze`. `AccessGate` and `CompatibilityCalculator` still use `ring-gold`. `ProfileForm` still uses `focus:ring-gold/40`. `tailwind.config.ts` is unchanged. Rules 9–11 and 19–23 stay. Update this table again in the PR that deletes the next rule group. A batch that deletes no rule has not finished.

Batch L applied D5 to eyebrows and deleted rules 9, 10, and 11. Paper callers of `Eyebrow` are `Kicker`. Raw paper labels are `type-eyebrow`. `ProfileForm` on `/onboarding` still mounts `Eyebrow`, and its Name and Birthdate labels still use the class `eyebrow`. `IntroSlide` keeps `.eyebrow`. Unmounted `Brand` and `YearPreview` keep `.eyebrow`. The base `.eyebrow` rule stays the dark gray (`#6b6a78`, weight 500). `AccessGate` is a paper-shell consumer, so it is `Kicker` with `!text-brand-bronze`. Labels that used `!text-brand-bronze` or `!text-brand-club` keep that important color. `.type-eyebrow` sets `color: var(--bronze)` after Tailwind, so a plain utility would lose, and club would turn bronze. `ObservationCard` accents are `type-eyebrow` plus `!text-brand-club` or `!text-brand-bronze`, with no ink-soft class beside them. Muted labels, the ones rule 9 painted ink-soft at weight 700, are `type-eyebrow !font-bold !text-brand-ink-soft`. The kicker's size and tracking (`0.75rem`, `0.16em`) are the paper primitive. The important utilities keep the ink-soft weight rule 9 forced. Inline colors on the card-of-the-day quick reads and the birth-card lenses stay inline. `type-eyebrow` does not set `!important`, so those colors still win. `ComposingState` is `type-eyebrow foil-text`. `foil-text` still sets `color: transparent !important`, so the batch K clip still shows. `PlayingCard` subtitles branch on `surface`: paper is the muted kicker, dark keeps `.eyebrow`. No paper-shell screen still uses the class `eyebrow`. Rule 10: the base `.prose-reading` rule is `color: var(--ink)` on the block, on `p` and `li`, and on `em` and `strong`. `em` stays italic. The gold `#d9b26a` on `em` is gone. The shell copy is deleted. The call sites keep the class. A `text-brand-ink-soft` on those blocks is still less specific than the base rule and still loses, which is what the shell override already did. Unmounted `YearPreview` is the only `.prose-reading` outside the shell. It now inherits ink instead of `#d8d6df`. No mounted screen outside the shell used the dark gray. Rule 11: paper hairlines are `border-brand-line`. `Divider` is paper-only, so it drops `.hairline`. `SelfClient`, `PeriodRow`, and `ArcRail` use `border-t border-brand-line`. No mounted screen still uses `.hairline`. The base rule stays the dark bone edge. Nothing calls it. `SectionTitle` and `PositionStack` were already on brand tokens. `tailwind.config.ts` is unchanged. Rules 19–23 stay. Batch M is not this change. Update this table again in the PR that deletes the next rule group. A batch that deletes no rule has not finished.

The dark palette in `tailwind.config.ts` (`ink`, `void`, `cosmos`, `haze`, `bone`, `mist`, `faint`, `gold`, `ember`, `sage`, `dusk`, plus suit aliases `hearts` / `diamonds` / `clubs` / `spades`) stays until the last consumer is gone. Suit aliases have zero class uses. `faint` stays in the config because onboarding, access, and unmounted files still use it. `sage` and `dusk` have no class uses after batch D; the keys stay until that final removal. `brand.club` is an addition, not a deletion of a dark key. Batch F changed `brand.ivory` from `var(--ivory)` to a `color-mix` that takes `<alpha-value>`. The hue is still `--ivory`. The issue's token list skipped `faint`.

## What renders

`.paper-shell` is applied in one place: `components/seo/SeoShell.tsx`. `AppFeaturePage` renders inside `SeoShell`, so `/today`, `/self`, `/bonds`, `/journal`, `/timing`, `/story`, and `/reading` are inside the shell too. Public SEO pages that use `SeoShell` are inside it.

These screens are outside the shell. Classes on them paint the Tailwind value. The `!important` rules do not apply.

| Screen | Root | Why it matters |
| --- | --- | --- |
| `app/layout.tsx` `<body className="bg-ink text-bone">` | ancestor of the shell | Dark canvas behind every page. `bg-ink` has no override. `text-bone` on `body` is not a descendant of `.paper-shell`, so the text-bone rule does not touch it. |
| `/` homepage, `/explore`, `/checkout/[offer]`, `/blueprint` | `bg-brand-paper` or `shell-paper` | Already on the paper tokens. They do not need the remap. |
| `/access`, `/onboarding` | body dark canvas | Real dark-palette screens. |
| `/ops/live` | its own dashboard | No palette classes found in the page module. |

`components/ui.tsx` exports both systems, so the file shows up in every context. The dark primitives do not all share that fate:

| Export | Who mounts it | Palette classes |
| --- | --- | --- |
| `Eyebrow` | `ProfileForm` on `/onboarding` (outside the shell). Paper callers moved to `Kicker` in batch L, including `AccessGate`. | `eyebrow`. The base rule is the dark gray. |
| `SectionTitle`, `Divider`, `PositionStack` | Paper-shell only (`TodayClient`, `JournalClient`, `self/Section`, `DailyCard`, `PeriodRow`, and the other app clients). Onboarding does not mount them. | `display text-brand-ink`, `border-brand-line`, `text-brand-club` / `text-brand-bronze`, `bg-brand-oxblood` / `bg-brand-club` / `bg-brand-bronze` |
| `Screen` | Paper-shell app clients and `/onboarding` | No palette class on `Screen` itself |
| `Kicker`, `LinkButton`, `SectionShell`, `Rule` | Paper marketing | Already on brand tokens |

`PlayingCard`, `CardFace`, `CardBack`, and `FoilSheen` mount inside paper-shell app cards and inside onboarding (`ProfileForm`). `surface="paper"` sets an ivory fill and an ink line, and recolors pips. The dark default keeps `card-frame`, `border-white/10`, `from-haze`, `to-cosmos`, and `ring-gold` for `ProfileForm`. Paper-shell mounts pass `surface="paper"` and `frameBorder="border-brand-line"`. `HomepageCalculatorHero` passes `surface="paper"` only. The card subtitle branches in batch L: paper is `type-eyebrow`, dark keeps `.eyebrow`. Decorative `bg-foil` stays on `FoilSheen` and `CardBack`. The live homepage does not mount `PlayingCard` (tests import `HomepageCalculatorHero`; `app/page.tsx` renders `LandingCalculator`).

Replacing `Eyebrow`'s class string, or `PlayingCard`'s frame classes, changes `/onboarding` in the same commit as the paper screens. `SectionTitle`, `Divider`, and `PositionStack` can move in a paper batch.

`components/year/YearBlueprintApp.tsx` uses `s.eyebrow` from `year.module.css`. That class is hashed. It is not a consumer of `.paper-shell .eyebrow`. `scripts/professional-reading/render.ts` emits its own PDF `.eyebrow`. Neither counts below.

Dead to the router today, still a grep dependency if a batch's exit check is "no matches left": `components/nav/BottomNav.tsx`, `components/nav/Brand.tsx`, `components/home/CompareBand.tsx`, `components/year/YearPreview.tsx`, `components/year/YearPreviewApp.tsx`.

## How the counts were taken

Source scan of `app/`, `components/`, and `scripts/` (tests that assert class names). A utility counts when it appears as a class token (`text-mist`, `hover:text-gold`, `border-white/10`, `placeholder:text-faint`). A semantic class (`display`, `eyebrow`, `card-surface`, …) counts only as a whitespace-separated token inside a string, so `s.eyebrow`, `display: "swap"`, and the English word "display" do not count. Comments are skipped. The override block itself (lines 585–747 at the inventory commit; 585–741 after batch A; 585–734 after batch B; 585–718 after batch C; 589–717 after batch D; 588–708 after batch E; 588–700 after batch F; 588–693 after batch G; 588–689 after batch H; 588–679 after batch I; 604–683 after batch J; 606–673 after batch K) and the base dark rules it replaces (`.card-surface-dark`, `.foil-text`, `.eyebrow`, `.display`, `.prose-reading`, `.hairline`, `.starfield` earlier in `app/globals.css`; `.card-surface` is the paper card after batch J; `.foil-text` is the oxblood-to-gold clip after batch K) are not counted as consumers.

CSS modules and the shorts studio stylesheet are excluded. They do not match `.paper-shell` selectors.

Issue round numbers were `text-bone` in 51 files, `text-mist` in 50, `card-surface` in 32. This pass: `text-bone` 195 exact uses in 52 files (plus 22 `hover:text-bone`, which the rule does not match), `text-mist` 328 uses in 49 files, `card-surface` 40 uses in 31 files. 63 files use a dark-palette utility. 86 files use a dark-palette utility or a semantic class the layer restyles.

## The layer, rule by rule

Line numbers are `app/globals.css` after batch K deleted rules 13 and 14. "Depends" means a descendant of `.paper-shell` whose class attribute matches the selector. Outside-shell files in the appendix use the same class names and do not depend on the rule; they block deleting the Tailwind color, not the rule.

Selector behavior that is easy to miss:

- Rule 1's `.starfield::before` selectors, rule 2's `.bg-cosmic` and `[class*="bg-cosmic"]` selectors, rule 8's exact `.text-ink` selector, rule 7's exact `.text-sage` and `.text-dusk` selectors, rule 16's `[class*="bg-gold"]` selector, rule 17's `[class*="border-white"]`, `[class*="border-bone"]`, `[class*="border-haze"]`, and `[class*="border-gold"]` selectors, and rule 18's `[class*="bg-void"]`, `[class*="bg-haze"]`, `[class*="bg-cosmos"]`, and `[class*="bg-white"]` selectors are deleted. `hover:text-bone` does not match `.text-bone`. `from-gold` and `to-gold` do not contain `bg-gold`. The base `.starfield::before` rule earlier in the file is not a paper-shell override and stays for `/onboarding`.
- `text-mist`, `text-faint`, `text-gold`, and `text-ember` used `[class*="…"]`. Those selectors are deleted. `bg-gold` used `[class*="bg-gold"]`, so variants and opacities matched; that selector is deleted in batch H.
- `border-t-gold` does not contain the substring `border-gold`. Rule 17 is deleted. Batch G kept side widths (`border-b`, `border-l-2`, and the rest) and moved only the color class. This pass found no side-specific palette borders such as `border-t-gold`.
- `from-haze`, `to-cosmos`, `via-cosmos`, `ring-gold`, `bg-ink`, `bg-ember`, `bg-bone`, `text-white` match no rule. Inside the shell they paint the dark palette on paper. `bg-sage` and `bg-dusk` left the paper screens in batch D. `bg-void`, `bg-haze`, and `bg-white` left the paper screens in batch F. `border-white`, `border-gold`, and `border-haze` left the paper screens in batch G. `border-bone` was never on a paper screen. `bg-gold` left the paper screens in batch H. `text-void` was only the journal Save label on that wash; it is `text-brand-ink`. `bg-cosmic` and `starfield` left the paper screens in batch I. `/onboarding` keeps both. Paper `PlayingCard` mounts left `from-haze`, `to-cosmos`, and `ring-gold` in batch K. The dark branch, `ProfileForm`, `Skeleton`, `AccessGate`, and `CompatibilityCalculator` still use those classes.

| # | Lines | Selector (abbreviated) | `!important` | What the visitor sees inside the shell | Delete with batch |
| --- | --- | --- | --- | --- | --- |
| 1 | — | `.starfield::before` | no | deleted in batch I; paper screens drop `starfield` | done |
| 2 | — | `.bg-cosmic`, `[class*="bg-cosmic"]` | yes | deleted in batch I; paper screens drop `bg-cosmic` | done |
| 3 | — | `.display`, `.text-bone`, `.font-serif.text-bone` | yes | deleted in batch A; paper screens use `text-brand-ink` | done |
| 4 | — | `[class*="text-mist"]`, `[class*="text-faint"]` | yes | deleted in batch B; paper screens use `text-brand-ink-soft` | done |
| 5 | — | `[class*="text-gold"]`, `[class*="text-ember"]` | yes | deleted in batch C; paper labels use `text-brand-bronze` | done |
| 6 | — | `a.text-gold`, `a[class*="text-gold"]` | yes | deleted in batch C; paper anchors use `text-brand-oxblood` | done |
| 7 | — | `.text-sage`, `.text-dusk` | yes | deleted in batch D; paper labels use `text-brand-club` (`#183f30`) | done |
| 8 | — | `.text-ink` | yes | deleted in batch E; paper buttons use `ink-button` or `accent-button` | done |
| 9 | — | `.eyebrow` | no | deleted in batch L; paper labels use `type-eyebrow` or `Kicker`. `ProfileForm` keeps `.eyebrow` | done |
| 10 | — | `.prose-reading` and `p` / `li` / `em` / `strong` | no | deleted in batch L; the base `.prose-reading` is `color: var(--ink)`, including `em` and `strong` | done |
| 11 | — | `.hairline` | no | deleted in batch L; paper rules use `border-brand-line`. The base `.hairline` stays dark and unused | done |
| 12 | — | `.card-surface` | no | deleted in batch J; the base `.card-surface` is the ivory grid, and `Brand` uses `card-surface-dark` | done |
| 13 | — | `.card-frame` | yes | deleted in batch K; paper `PlayingCard` uses `bg-brand-ivory` and `border-brand-line`. Dark keeps `card-frame` | done |
| 14 | — | `.foil-text` | yes | deleted in batch K; the base `.foil-text` is `var(--oxblood)` → `#c77e63` → `var(--gold)` | done |
| 15 | — | `.bg-foil` | yes | deleted in batch E; paper buttons use `ink-button`. Decorative foil on `FoilSheen` and `CardBack` stays the gold gradient | done |
| 16 | — | `[class*="bg-gold"]` | yes | deleted in batch H; paper washes use `bg-brand-gold-soft` | done |
| 17 | — | `[class*="border-white"]`, `border-bone`, `border-haze`, `border-gold` | yes | deleted in batch G; paper borders use `border-brand-line` | done |
| 18 | — | `[class*="bg-void"]`, `bg-haze`, `bg-cosmos`, `bg-white` | yes | deleted in batch F; paper fills use `bg-brand-ivory/70` | done |
| 19 | 617–623 | `input`, `textarea`, `select` | yes | cream field, ink text, warm border | M (keep or migrate; see below) |
| 20 | 625–628 | placeholders | yes | `rgba(20,17,13,.45)` | M |
| 21 | 630–636 | `.rounded-2xl` … `.rounded-t-3xl` | yes | radius `0.25rem` | M |
| 22 | 641–644 | `a.rounded-full`, `button.rounded-full` | yes | radius `0.25rem` | M |
| 23 | 646–660 | `.app-paper-stage` and descendants | no | inset shadow, `min-height: auto`, softer `.shadow-lg` | M |

Rules 19–23 are chrome. They are not dark-palette class names. Recommendation: leave them as the paper shell's intentional geometry, and track them separately from the 18 palette rules. Cass decides in the agreement step.

## Proposed mapping

Map to the color the visitor already sees inside `.paper-shell`, written as a brand utility a new page would use. Brand tokens are the cyanotype set in `:root` (`--ink` `#123a63`, `--ink-soft` `#3c6089`, `--ink-faint` `#4a6b8f`, `--bronze` `#735624`, `--oxblood` `#0c4275`, `--club` `#183f30`, `--paper` `#eef3f8`, `--on-dark` `#e8f1fa`, `--gold-soft` `rgba(184,137,61,.14)`, `--line` `rgba(18,58,99,.14)`).

Rules 3, 4, 5, 6, and 9 already point at those CSS variables. Swapping the class does not change the hue.

Rule 13's cream fill and warm edge moved onto the paper `PlayingCard` branch in batch K (`bg-brand-ivory`, `border-brand-line`). Rule 12's cream grid moved onto the base `.card-surface` in batch J, with the fill and edge shifted onto ivory and `--line`. Rules 16, 17, and 18 used to paint the old red wash, the warm border, and the cream fill. Pointing those at current brand tokens shifts the hue from warm black/cream toward ink blue, ivory, and the current gold wash. Pages that already use `border-brand-line` and `bg-brand-paper` are on the cyanotype side. Cass agreed that shift (D2). The alternative was new utilities that freeze the warm override colors, which keeps two papers alive.

| Legacy class inside `.paper-shell` | Sees today | Write instead | Hue |
| --- | --- | --- | --- |
| `text-bone`, `.display` | `var(--ink)` | `text-brand-ink`. `.display` stays as the type class; add `text-brand-ink` on the element (the base `.display` rule sets no color). | safe |
| `hover:text-bone` | does not match rule 3. On a node that also has `text-mist` or `text-gold`, those `!important` rules hold through hover, so the hover is inert inside the shell. 19 of 22 are links; 3 are not (`JournalClient`, `ProfileForm`, `ProfilePrompt`). | `hover:text-brand-ink` on mist chips; `hover:text-brand-oxblood` when the resting class is anchor `text-gold`. Leave `ProfileForm` (outside the shell) on the dark palette. | safe once the resting class moves |
| `text-mist`, `hover:text-mist`, `text-faint`, `placeholder:text-faint` | `var(--ink-soft)` | `text-brand-ink-soft`, `hover:text-brand-ink-soft`, `placeholder:text-brand-ink-soft`. `text-faint` maps to ink-soft, the same destination as mist. It does not map to `text-brand-ink-faint`. | safe |
| `text-gold`, `hover:text-gold`, `group-hover:text-gold`, `text-gold/80` and other opacities, on elements that are not anchors | `var(--bronze)` | `text-brand-bronze` (opacity modifiers dropped; bronze is already the tuned label color) | safe |
| `text-gold` on `<a>` / `<Link>` | `var(--oxblood)` via rule 6 | `text-brand-oxblood` | safe |
| `text-ember`, `hover:text-ember` | `var(--bronze)` | `text-brand-bronze` | safe |
| `.eyebrow` | ink-soft, weight 700 | Applied in batch L. Bronze and club labels keep `!text-brand-bronze` or `!text-brand-club` on `type-eyebrow`. Muted labels are `type-eyebrow !font-bold !text-brand-ink-soft`. Paper callers of `Eyebrow` are `Kicker`. `ProfileForm` keeps `Eyebrow`. | safe on paper; dark screens keep the base `.eyebrow` |
| `.prose-reading` | ink, including `em` / `strong` | Applied in batch L. The class stays. The base rule is `color: var(--ink)` on the block, `p`, `li`, `em`, and `strong`. The shell copy is deleted. Unmounted `YearPreview` is the only outside-shell use. | safe; the base moved with the override |
| `text-sage`, `text-dusk` | `#183f30` | `text-brand-club`. `ObservationCard` accents keep `!text-brand-club` on `type-eyebrow` after batch L, so club does not become the kicker's bronze. | safe |
| `text-ink` paired with `bg-foil` | light paper text on `var(--ink)` fill | `ink-button` (D3). The literal swap `bg-brand-ink text-brand-on-dark` was the hue; the agreed button class is what batch E wrote. | safe |
| `text-ink` paired with `bg-gold` (`what-is-cardology`, `cardology-for-beginners`, `destiny-cards`) | rule 8 paints paper-colored text and rule 16 paints a 12% warm-red wash. Light text on a light wash. | `accent-button`. These three are the single $13 conversion. Do not preserve `text-brand-paper` on `bg-brand-gold-soft`. | repairs a contrast failure |
| `bg-foil` on a button | `var(--ink)` | `ink-button` | safe |
| `bg-foil` on `FoilSheen` / `CardBack` | rule 15 forced `var(--ink)`; batch E deleted that flatten, so the utility is the gold foil gradient | kept in batch K. The gold gradient is the live sheen on paper and on the dark card back. | same as post-E |
| `bg-gold`, `hover:bg-gold`, `bg-gold/15` and other opacities | `rgba(158,61,36,.12)` | `bg-brand-gold-soft` (batch H). Opacities collapse to the plain class. The three D3 buttons are `accent-button` (batch E), not this wash. | shifts from old red wash to current gold wash |
| `border-white/*`, `border-bone/*`, `border-haze`, `border-gold/*`, `hover:border-gold`, `focus:border-gold` | `rgba(20,17,13,.16)` | `border-brand-line` (batch G). `card-surface` keeps `!border-brand-line`. After batch J the base edge is the same `var(--line)`. Form controls still take rule 19. The paper `PlayingCard` frame is `border-brand-line` (batch K). | shifts from warm black to ink-blue line |
| `bg-void`, `bg-haze`, `bg-cosmos`, `bg-white` and opacities | cream `rgba(244,240,231,.68)` | `bg-brand-ivory/70` (batch F). Form controls still take rule 19's cream field. | shifts from warm cream to ivory |
| `.card-surface` | cream grid, 1px ink-ish border, soft shadow | Kept one class (batch J). The base `.card-surface` is the ivory grid with `var(--line)`. Unmounted `Brand` uses `card-surface-dark` for the indigo gradient. | shifts from warm cream to ivory; the only dark caller is `Brand` |
| `.card-frame` | cream fill, warm border | Paper `PlayingCard` (`surface="paper"`) uses `bg-brand-ivory` and `border-brand-line` (batch K). Dark `PlayingCard` keeps `card-frame` with `from-haze to-cosmos` and `border-white/10`. No shell override. | shifts from warm cream to ivory; dark frame unchanged |
| `.foil-text` | oxblood-to-gold clip | Kept the class (batch K). The base gradient is `var(--oxblood)` → `#c77e63` → `var(--gold)`. The shell copy is deleted. | safe inside the shell; dark mounts move off the old gold foil |
| `.bg-cosmic`, `.starfield` | transparent / no stars | Delete the classes from paper screens (batch I). `/onboarding` keeps both. | safe |
| `.hairline` | `var(--line)` | Applied in batch L. Paper rules are `border-brand-line`. `Divider` dropped `.hairline`. No mounted caller remains. The base rule stays the dark bone edge. | safe on paper |
| `.app-paper-stage` | stage chrome | Leave the class and rule 23. Two call sites: `AppFeaturePage`, `app/52-day-period-meaning-tool/page.tsx`. | n/a if M stays |

### Classes with no override (they already leak the dark palette onto paper)

| Class | Uses | Where | Proposed write |
| --- | --- | --- | --- |
| `hover:text-bone` | 22 | mostly paper links, suppressed by rules 4 and 6; live on `ProfileForm` | see mapping row above |
| `text-white` | 7 | already on `bg-brand-oxblood` or `bg-brand-ink` (`playing-card-spreads`, `methodology`, `planetary-ruling-card`, `ConsultationRequestForm`, `FreeCourseCta`, `VideoEmbed`) | `text-brand-on-dark` in whatever batch touches that file. No shell rule to delete. |
| `ring-gold`, `focus:ring-gold/40` | 5 | `PlayingCard`, `ProfileForm`, and paper components | Paper `PlayingCard` halo is `ring-brand-gold` (batch K). `ProfileForm`, `AccessGate`, and `CompatibilityCalculator` stay on `ring-gold`. |
| `from-haze`, `to-haze`, `to-cosmos`, `via-cosmos` | 9 tokens | `PlayingCard`, `BondsClient`, `components/today/Skeleton.tsx` | Paper `PlayingCard` and the Bonds stand-ins left the dark gradient in batch K. `Skeleton` still uses `from-haze via-cosmos to-haze`. Dark `PlayingCard` keeps `from-haze to-cosmos`. |
| `bg-ember`, `border-ember/20` | 4 at inventory; dots moved in batch D | `SelfClient` wash remains (`bg-ember/5`, `border-ember/20`) | Position dots are `bg-brand-bronze`. `SelfClient`'s ember panel is a warning wash the shell does not recolor, and batch D left it. |
| `bg-sage`, `bg-dusk` | 2 each at inventory; none on paper after batch D | `PositionStack`, `ObservationCard` | Sage dots are `bg-brand-club`. Dusk dots are `bg-brand-oxblood`, so under / balanced / over stay three colors. |
| `bg-ink`, `bg-ink/80` | 2 | `body` in `app/layout.tsx`, unmounted `BottomNav` | keep until the dark canvas is retired |
| `bg-bone` | 1 | `ProfileForm` submit button, outside the shell | keep with onboarding |
| `text-void` | 1 at inventory; none on paper after batch H | `JournalClient` Save, which sat on `bg-gold/90`. Rule 16 turned that fill into a light wash; `text-void` had no override, so the label was near-black `#0a0b12` on the wash. | `text-brand-ink` (batch H, with the wash) |
| `from-gold/50`, `to-gold/10` | 1 line | `components/story/ArcRail.tsx` | `from-brand-gold/50 to-brand-gold/10` |
| `focus-visible:outline-gold` | 1 | `FreeCourseCta` | `focus-visible:outline-brand-oxblood` (matches the paper focus ring) |

`bg-cosmos` had zero consumers. Batch F deleted that selector with rule 18. `to-cosmos` does not match `[class*="bg-cosmos"]`. Paper `PlayingCard` and the Bonds stand-ins dropped it in batch K. `Skeleton` still uses `via-cosmos`. Dark `PlayingCard` still uses `to-cosmos`.

## Decisions to agree before pass 2

1. **D1 — sage / dusk / ember dots.** Agreed: option (a). Applied in batch D. Both labels are `text-brand-club` (`#183f30`). Dots stay three colors: balanced/sage `bg-brand-club`, over/ember `bg-brand-bronze`, under/dusk `bg-brand-oxblood`. Option (b) was to collapse labels to `text-brand-ink` and dots to `bg-brand-ink` / `bg-brand-bronze` / `bg-brand-oxblood`.

2. **D2 — warm washes vs cyanotype.** Agreed: accept the shift on rules 12, 13, 16, 17, and 18 (cream, warm border, old red `bg-gold`) onto `bg-brand-ivory`, `border-brand-line`, and `bg-brand-gold-soft`. Rule 18 is applied in batch F (`bg-brand-ivory/70`). Rule 17 is applied in batch G (`border-brand-line`). Rule 16 is applied in batch H (`bg-brand-gold-soft`). Rule 12 is applied in batch J (ivory grid on the base `.card-surface`, edge `var(--line)`). Rule 13 is applied in batch K (paper `PlayingCard` is `bg-brand-ivory` with `border-brand-line`).

3. **D3 — `bg-gold` + `text-ink` buttons.** Agreed and applied in batch E. `ink-button` where the shell's `bg-foil` sibling buttons are the pattern. `accent-button` only for the single conversion action: the three $13 links on `what-is-cardology`, `cardology-for-beginners`, and `destiny-cards`.

4. **D4 — geometry rules 19–23.** Recommendation: keep them. They are the paper shell, not the dark palette. Tracking for CAR-13 then closes when the 18 palette rules are gone; the 5 chrome rules stay and get a one-line note in this file.

5. **D5 — shared primitives.** Agreed and applied. `PlayingCard` paper surface is batch K: `surface="paper"` sets the ivory frame, and the dark frame stays for onboarding. Paper callers of `Eyebrow` are `Kicker` or `type-eyebrow` (batch L). `ProfileForm` keeps `Eyebrow`. `SectionTitle` and `PositionStack` were already on brand tokens. `Divider` is `border-brand-line`. `Eyebrow` inside `ui.tsx` was not rewritten, so onboarding does not change.

D1, D2, and D3 are agreed and applied. D5 is applied. D4 is agreed and not applied: rules 19–23 stay. Batch M is not this change.

## Batch plan

Each batch is one PR. It migrates only the files listed for that rule, screenshots every route those files mount, and deletes the rule in the same PR. Exit check: the selector's class no longer occurs on a paper-shell screen. Outside-shell and unmounted files may still contain the old class; they are called out so the rule is not kept "just in case," and so `tailwind.config.ts` is not edited yet.

Order is hue-safe text first, then the decisions, then shared components, then surfaces.

| Batch | Deletes | Scope | Notes |
| --- | --- | --- | --- |
| A | rule 3 (deleted) | Exact `text-bone` and `.display` on paper-shell files, including `SectionTitle` (paper-only). Add `text-brand-ink` next to `.display`. | Done. Left `Eyebrow` callers that pass through `ProfileForm`, `app/layout.tsx` `text-bone`, `app/access/page.tsx`, and the rest of onboarding. `PlayingCard` titles inherit instead of setting `text-bone`, so paper titles stay ink and onboarding titles stay bone. Inert `hover:text-bone` on paper links moved in the same PR. |
| B | rule 4 (deleted) | `text-mist`, `text-faint`, `placeholder:text-faint` on paper-shell-only files. | Done. Left `/onboarding`, `/access` (`AccessLink`), and unmounted `BottomNav`, `Brand`, and `YearPreview` on the dark palette. |
| C | rules 5 and 6 (deleted) | `text-gold` and `text-ember`. Split anchors (`text-brand-oxblood`) from labels (`text-brand-bronze`) in the same PR. | Done. Left `/onboarding` and unmounted `BottomNav`, `Brand`, and `YearPreview` on the dark palette. Sage/dusk labels and `bg-ember` dots stay for batch D. |
| D | rule 7 (deleted) | `text-sage`, `text-dusk`, plus the unmatched `bg-sage`, `bg-dusk`, `bg-ember` dots. | Done, D1 option (a). `PositionStack` and `components/bonds/ObservationCard.tsx`. Under dot is `bg-brand-oxblood`, balanced/sage dot is `bg-brand-club`, over/ember dot is `bg-brand-bronze`. `ObservationCard` complement was `bg-gold` until batch H. `SelfClient`'s ember wash stays. |
| E | rules 8 and 15 (deleted) | `text-ink` + `bg-foil` buttons, and the three `bg-gold text-ink` buttons. | Done, D3. Foil-pattern buttons are `ink-button`. The three $13 buttons are `accent-button`. `FreeCourseSignupForm` paper branch stayed `accent-button`; its shell branch is `ink-button`. `AccessGate` included. `AccessLink` and `ProfileForm` left outside the shell. `FoilSheen` and `CardBack` keep decorative `bg-foil`. Batch K left that gradient in place. |
| F | rule 18 (deleted) | `bg-void`, `bg-haze`, `bg-white` (and the dead `bg-cosmos` selector). | Done, D2. Paper fills are `bg-brand-ivory/70`. Left `ProfileForm`, `/onboarding`, and unmounted `Brand`, `CompareBand`, and `YearPreview`. Form controls still take rule 19's cream field. |
| G | rule 17 (deleted) | `border-white`, `border-gold`, `border-haze`, `border-bone`. | Done, D2. Paper borders are `border-brand-line`. `card-surface` edges use `!border-brand-line`. After batch J the base edge is the same `var(--line)`. Form controls still take rule 19. `PlayingCard` paper-shell mounts pass `border-brand-line`. Rule 13 painted the frame until batch K. Left onboarding, `HomepageCalculatorHero`, and unmounted `BottomNav`, `CompareBand`, and `YearPreview`. |
| H | rule 16 (deleted) | `bg-gold` washes that are not the D3 buttons. | Done, D2. Paper washes are `bg-brand-gold-soft`. Written opacities collapse to that class. Journal Save's `text-void` is `text-brand-ink`. Left `/onboarding` (`bg-gold`, `ProfileForm` `hover:bg-gold`) and unmounted `BottomNav`. The three D3 buttons stayed `accent-button` from batch E. |
| I | rules 1 and 2 (deleted) | `bg-cosmic`, `starfield` | Done. Paper screens drop both classes. Left `app/onboarding/page.tsx` outside the shell, so the base `.starfield` rule and `bg-cosmic` stay. |
| J | rule 12 (deleted) | `.card-surface` | Done, D2. The base `.card-surface` is the ivory grid with `var(--line)`. The 30 paper files keep that class. Unmounted `Brand` is `card-surface-dark` (indigo gradient). `!border-brand-line` on a card still paints the ink line. |
| K | rules 13 and 14 (deleted) | `PlayingCard`, `CardFace`, `CardBack`, `FoilSheen`, and the paper mounts | Done, D2 and D5. Paper frame is `bg-brand-ivory` and `border-brand-line`. Dark frame keeps `card-frame`. Base `.foil-text` is oxblood to gold. Decorative `bg-foil` stays. `Skeleton` and the non-card `ring-gold` call sites stay. |
| L | rules 9, 10, 11 (deleted) | `.eyebrow`, `.prose-reading`, `.hairline` | Done, D5. Paper `Eyebrow` callers are `Kicker` or `type-eyebrow`. `ProfileForm` keeps `Eyebrow`. Muted labels are ink-soft and bold. Bronze and club labels keep their important color. The base `.prose-reading` rule is ink, including `em` and `strong`. Paper hairlines are `border-brand-line`. |
| M | rules 19–23 only if D4 says migrate | radius utilities, form controls, `.app-paper-stage` | Recommendation is to keep these and close them out of CAR-13. |

Final PR, separate from the 18: remove dark palette keys from `tailwind.config.ts` when `app/` and `components/` no longer reference them. That includes `body`'s `bg-ink text-bone`, onboarding, access, and any dark `PlayingCard` frame that still wants haze/cosmos. Not this pass. Not any palette batch above.

Screenshot list for a batch is the routes that import its files. App clients (`TodayClient` and the rest) mean `/today`, `/self`, `/journal`, `/timing`, `/bonds`, `/story`, `/reading`. SEO pages mean their own `app/**/page.tsx` route.

Tests that quote old classes and will need a touch in the batch that renames them: `scripts/calculator-deep-dive.test.ts` (`bg-foil`). Batch A updated `scripts/card-meaning-depth.test.ts` and `scripts/card-reading-notes.test.ts` (`text-bone` → `text-brand-ink`). No test quoted `text-mist`, `text-faint`, `text-gold`, or `text-ember`.

## What the inventory pass did not do

This list describes the inventory commit only. Batch A renamed paper-shell `text-bone` and deleted rule 3. Batch B renamed paper-shell `text-mist` and `text-faint` and deleted rule 4. Batch C renamed paper-shell `text-gold` and `text-ember` and deleted rules 5 and 6. Batch D renamed paper-shell sage, dusk, and the position dots and deleted rule 7. Batch E moved paper-shell foil and gold text-ink buttons onto `ink-button` or `accent-button` and deleted rules 8 and 15. Batch F renamed paper-shell `bg-void`, `bg-haze`, and `bg-white` to `bg-brand-ivory/70` and deleted rule 18. Batch G renamed paper-shell `border-white`, `border-gold`, and `border-haze` to `border-brand-line` and deleted rule 17. Batch H renamed paper-shell `bg-gold` washes to `bg-brand-gold-soft` and deleted rule 16. Batch I removed paper-shell `bg-cosmic` and `starfield` and deleted rules 1 and 2. Batch J moved the cream grid onto the base `.card-surface` (ivory fill, `var(--line)` edge), gave unmounted `Brand` `card-surface-dark`, and deleted rule 12. Batch K gave paper `PlayingCard` an ivory frame, kept the dark `card-frame` for onboarding, pointed `.foil-text` at oxblood and gold, and deleted rules 13 and 14. Batch L moved paper eyebrows to `Kicker` or `type-eyebrow`, kept `ProfileForm` on `Eyebrow`, retargeted the base `.prose-reading` rule to ink, moved paper hairlines to `border-brand-line`, and deleted rules 9, 10, and 11.

- No component class was renamed.
- No override rule was deleted.
- `tailwind.config.ts` was not edited.
- No deploy.
- `~/cardblueprints-ops/QUEUE.md` is not on this machine, so no claim line was appended.
- `bun run test` was not run; the only change in that commit was this document.

## Appendix — file inventory

Use counts are class tokens in source, not mounted instances. One file can appear under several classes. Unmounted files (`BottomNav`, `Brand`, `CompareBand`, `YearPreview`, `YearPreviewApp`) and outside-shell files (`app/layout.tsx`, `app/access/page.tsx`, `app/onboarding/page.tsx`, `components/onboarding/*`, `components/gate/AccessLink.tsx`) are listed because a grep still finds them. They do not by themselves keep a `.paper-shell` rule alive.

### text-gold (394 uses in 51 files)

- `app/what-is-cardology/page.tsx` × 41
- `app/birth-card/[slug]/page.tsx` × 36
- `app/birth-card-calculator/page.tsx` × 33
- `app/destiny-cards/page.tsx` × 33
- `app/how-to-read-playing-cards/page.tsx` × 23
- `app/52-card-astrology-explained/page.tsx` × 17
- `app/birth-card/page.tsx` × 15
- `app/cardology-vs-tarot/page.tsx` × 15
- `app/playing-card-spreads/page.tsx` × 15
- `app/card-of-the-day/page.tsx` × 14
- `app/cardology-compatibility/page.tsx` × 13
- `app/cardology-for-beginners/page.tsx` × 13
- `app/cartomancy-vs-tarot/page.tsx` × 13
- `app/birth-card-compatibility-calculator/page.tsx` × 12
- `app/products/blueprint-report/page.tsx` × 9
- `app/products/one-question-reading/page.tsx` × 9
- `app/birth-card/joker/page.tsx` × 8
- `app/cardology-books/page.tsx` × 8
- `app/birth-card-vs-ruling-card/page.tsx` × 7
- `components/app/JournalClient.tsx` × 5
- `components/app/TodayClient.tsx` × 5
- `components/app/SelfClient.tsx` × 4
- `components/app/TimingClient.tsx` × 4
- `app/free-course/page.tsx` × 3
- `app/playing-card-tattoo-meaning/page.tsx` × 3
- `components/seo/ShadowLayer.tsx` × 3
- `app/free-course/watch/page.tsx` × 2
- `components/app/ReadingClient.tsx` × 2
- `components/app/StoryClient.tsx` × 2
- `components/free-course/FreeCourseSignupForm.tsx` × 2
- `components/nav/BottomNav.tsx` × 2
- `components/reflection/Prompts.tsx` × 2
- `components/seo/BirthdayChartTable.tsx` × 2
- `components/timing/PeriodRow.tsx` × 2
- `app/blog/[slug]/page.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/onboarding/ProfileForm.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/reading/StreamedMarkdown.tsx` × 1
- `components/self/TraitList.tsx` × 1
- `components/seo/FamousPeopleBlock.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/seo/TattooBlock.tsx` × 1
- `components/today/DailyCard.tsx` × 1
- `components/year/YearPreview.tsx` × 1

### text-mist (328 uses in 49 files)

- `app/birth-card-calculator/page.tsx` × 36
- `app/what-is-cardology/page.tsx` × 30
- `app/playing-card-spreads/page.tsx` × 27
- `app/destiny-cards/page.tsx` × 26
- `app/birth-card/[slug]/page.tsx` × 17
- `app/how-to-read-playing-cards/page.tsx` × 15
- `app/products/blueprint-report/page.tsx` × 14
- `app/cardology-for-beginners/page.tsx` × 13
- `app/cartomancy-vs-tarot/page.tsx` × 13
- `app/52-card-astrology-explained/page.tsx` × 11
- `app/cardology-vs-tarot/page.tsx` × 10
- `app/birth-card/joker/page.tsx` × 9
- `app/cardology-compatibility/page.tsx` × 9
- `app/products/one-question-reading/page.tsx` × 8
- `app/birth-card-compatibility-calculator/page.tsx` × 7
- `app/card-of-the-day/page.tsx` × 7
- `app/cardology-books/page.tsx` × 7
- `components/app/SelfClient.tsx` × 7
- `app/birth-card/page.tsx` × 6
- `app/birth-card-vs-ruling-card/page.tsx` × 5
- `components/app/JournalClient.tsx` × 5
- `components/seo/ShadowLayer.tsx` × 4
- `app/free-course/page.tsx` × 3
- `app/free-course/watch/page.tsx` × 3
- `app/playing-card-tattoo-meaning/page.tsx` × 3
- `components/year/YearPreview.tsx` × 3
- `components/app/BondsClient.tsx` × 2
- `components/app/TimingClient.tsx` × 2
- `components/gate/AccessLink.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/profile/ProfilePrompt.tsx` × 2
- `components/seo/BirthdayChartTable.tsx` × 2
- `components/seo/FamousPeopleBlock.tsx` × 2
- `app/onboarding/page.tsx` × 1
- `components/app/ReadingClient.tsx` × 1
- `components/app/StoryClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/onboarding/IntroSlide.tsx` × 1
- `components/reading/StreamedMarkdown.tsx` × 1
- `components/self/TraitList.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/seo/TattooBlock.tsx` × 1
- `components/today/DailyCard.tsx` × 1
- `components/ui.tsx` × 1

### prose-reading (233 uses in 38 files)

- `app/what-is-cardology/page.tsx` × 26
- `app/playing-card-spreads/page.tsx` × 21
- `app/birth-card-calculator/page.tsx` × 19
- `app/destiny-cards/page.tsx` × 18
- `app/how-to-read-playing-cards/page.tsx` × 16
- `app/cartomancy-vs-tarot/page.tsx` × 13
- `app/52-card-astrology-explained/page.tsx` × 10
- `app/cardology-compatibility/page.tsx` × 9
- `app/cardology-for-beginners/page.tsx` × 8
- `app/cardology-vs-tarot/page.tsx` × 8
- `app/birth-card/joker/page.tsx` × 7
- `app/card-of-the-day/page.tsx` × 7
- `app/products/one-question-reading/page.tsx` × 7
- `app/birth-card/page.tsx` × 6
- `components/app/SelfClient.tsx` × 6
- `app/birth-card-vs-ruling-card/page.tsx` × 5
- `app/birth-card/[slug]/page.tsx` × 5
- `app/products/blueprint-report/page.tsx` × 5
- `components/app/JournalClient.tsx` × 5
- `app/birth-card-compatibility-calculator/page.tsx` × 4
- `app/cardology-books/page.tsx` × 4
- `components/seo/ShadowLayer.tsx` × 4
- `components/app/BondsClient.tsx` × 3
- `app/playing-card-tattoo-meaning/page.tsx` × 2
- `components/app/TodayClient.tsx` × 2
- `app/free-course/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `components/app/ReadingClient.tsx` × 1
- `components/app/StoryClient.tsx` × 1
- `components/app/TimingClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/reading/StreamedMarkdown.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/seo/BirthdayChartTable.tsx` × 1
- `components/seo/FamousPeopleBlock.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/year/YearPreview.tsx` × 1

### text-bone (217 uses in 52 files)

- `app/birth-card-calculator/page.tsx` × 35
- `app/playing-card-spreads/page.tsx` × 21
- `app/birth-card/[slug]/page.tsx` × 17
- `app/destiny-cards/page.tsx` × 12
- `app/cardology-for-beginners/page.tsx` × 9
- `app/products/blueprint-report/page.tsx` × 8
- `app/what-is-cardology/page.tsx` × 7
- `app/cartomancy-vs-tarot/page.tsx` × 6
- `components/app/JournalClient.tsx` × 6
- `app/cardology-vs-tarot/page.tsx` × 5
- `app/birth-card-compatibility-calculator/page.tsx` × 4
- `app/birth-card/joker/page.tsx` × 4
- `app/birth-card/page.tsx` × 4
- `components/app/BondsClient.tsx` × 4
- `components/onboarding/ProfileForm.tsx` × 4
- `app/52-card-astrology-explained/page.tsx` × 3
- `app/free-course/page.tsx` × 3
- `app/free-course/watch/page.tsx` × 3
- `app/how-to-read-playing-cards/page.tsx` × 3
- `app/playing-card-tattoo-meaning/page.tsx` × 3
- `app/products/one-question-reading/page.tsx` × 3
- `components/app/ReadingClient.tsx` × 3
- `components/app/StoryClient.tsx` × 3
- `components/app/TodayClient.tsx` × 3
- `components/seo/ShadowLayer.tsx` × 3
- `components/timing/PeriodRow.tsx` × 3
- `app/birth-card-vs-ruling-card/page.tsx` × 2
- `app/card-of-the-day/page.tsx` × 2
- `app/cardology-books/page.tsx` × 2
- `app/cardology-compatibility/page.tsx` × 2
- `components/app/TimingClient.tsx` × 2
- `components/free-course/FreeCourseSignupForm.tsx` × 2
- `components/gate/AccessGate.tsx` × 2
- `components/profile/ProfilePrompt.tsx` × 2
- `components/reading/StreamedMarkdown.tsx` × 2
- `components/seo/PlayingCardsBirthdayChart.tsx` × 2
- `components/today/DailyCard.tsx` × 2
- `scripts/card-meaning-depth.test.ts` × 2
- `app/access/page.tsx` × 1
- `app/blog/[slug]/page.tsx` × 1
- `app/layout.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `components/app/SelfClient.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/onboarding/IntroSlide.tsx` × 1
- `components/PlayingCard.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/seo/FamousPeopleBlock.tsx` × 1
- `components/ui.tsx` × 1
- `components/year/YearPreview.tsx` × 1
- `scripts/card-reading-notes.test.ts` × 1

### eyebrow (178 uses in 45 files)

- `app/what-is-cardology/page.tsx` × 16
- `app/destiny-cards/page.tsx` × 14
- `app/birth-card-calculator/page.tsx` × 10
- `app/birth-card/[slug]/page.tsx` × 10
- `app/52-card-astrology-explained/page.tsx` × 9
- `app/card-of-the-day/page.tsx` × 9
- `app/cartomancy-vs-tarot/page.tsx` × 9
- `app/how-to-read-playing-cards/page.tsx` × 8
- `app/cardology-compatibility/page.tsx` × 7
- `app/cardology-vs-tarot/page.tsx` × 7
- `app/products/one-question-reading/page.tsx` × 7
- `app/cardology-for-beginners/page.tsx` × 6
- `app/products/blueprint-report/page.tsx` × 6
- `app/birth-card/joker/page.tsx` × 5
- `components/app/SelfClient.tsx` × 5
- `app/birth-card-compatibility-calculator/page.tsx` × 4
- `app/birth-card-vs-ruling-card/page.tsx` × 4
- `app/birth-card/page.tsx` × 4
- `app/cardology-books/page.tsx` × 3
- `app/playing-card-spreads/page.tsx` × 3
- `app/free-course/page.tsx` × 2
- `app/free-course/watch/page.tsx` × 2
- `app/playing-card-tattoo-meaning/page.tsx` × 2
- `components/app/TimingClient.tsx` × 2
- `components/nav/Brand.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/seo/ShadowLayer.tsx` × 2
- `components/app/BondsClient.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/app/ReadingClient.tsx` × 1
- `components/app/StoryClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/onboarding/IntroSlide.tsx` × 1
- `components/PlayingCard.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/reading/ComposingState.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/self/TraitList.tsx` × 1
- `components/seo/FamousPeopleBlock.tsx` × 1
- `components/story/ArcRail.tsx` × 1
- `components/ui.tsx` × 1
- `components/year/YearPreview.tsx` × 1

### border-white (138 uses in 39 files)

- `app/birth-card-calculator/page.tsx` × 22
- `app/playing-card-spreads/page.tsx` × 13
- `app/destiny-cards/page.tsx` × 11
- `app/birth-card/[slug]/page.tsx` × 9
- `app/cartomancy-vs-tarot/page.tsx` × 8
- `app/cardology-for-beginners/page.tsx` × 7
- `app/card-of-the-day/page.tsx` × 5
- `components/app/BondsClient.tsx` × 5
- `app/birth-card/joker/page.tsx` × 4
- `app/cardology-vs-tarot/page.tsx` × 4
- `app/products/blueprint-report/page.tsx` × 4
- `app/what-is-cardology/page.tsx` × 4
- `app/52-card-astrology-explained/page.tsx` × 3
- `app/birth-card-compatibility-calculator/page.tsx` × 3
- `app/birth-card/page.tsx` × 3
- `components/seo/ShadowLayer.tsx` × 3
- `app/cardology-books/page.tsx` × 2
- `app/cardology-compatibility/page.tsx` × 2
- `components/app/JournalClient.tsx` × 2
- `components/home/CompareBand.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/seo/VideoEmbed.tsx` × 2
- `components/timing/PeriodRow.tsx` × 2
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/how-to-read-playing-cards/page.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `app/playing-card-tattoo-meaning/page.tsx` × 1
- `app/products/one-question-reading/page.tsx` × 1
- `components/free-course/FreeCourseSignupForm.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/PlayingCard.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/seo/BirthdayChartTable.tsx` × 1
- `components/seo/FamousPeopleBlock.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/seo/TattooBlock.tsx` × 1
- `components/today/DailyCard.tsx` × 1
- `components/year/YearPreview.tsx` × 1

### text-faint (101 uses in 41 files)

- `app/birth-card/[slug]/page.tsx` × 12
- `app/cartomancy-vs-tarot/page.tsx` × 8
- `components/app/JournalClient.tsx` × 8
- `app/playing-card-spreads/page.tsx` × 5
- `app/birth-card/page.tsx` × 4
- `app/card-of-the-day/page.tsx` × 4
- `components/app/BondsClient.tsx` × 4
- `app/playing-card-tattoo-meaning/page.tsx` × 3
- `app/products/blueprint-report/page.tsx` × 3
- `components/app/SelfClient.tsx` × 3
- `components/app/TimingClient.tsx` × 3
- `components/seo/FamousPeopleBlock.tsx` × 3
- `app/how-to-read-playing-cards/page.tsx` × 2
- `components/app/ReadingClient.tsx` × 2
- `components/app/StoryClient.tsx` × 2
- `components/app/TodayClient.tsx` × 2
- `components/free-course/FreeCourseSignupForm.tsx` × 2
- `components/gate/AccessGate.tsx` × 2
- `components/nav/BottomNav.tsx` × 2
- `components/nav/Brand.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/seo/ShadowLayer.tsx` × 2
- `components/timing/PeriodRow.tsx` × 2
- `components/today/DailyCard.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/birth-card-calculator/page.tsx` × 1
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/blog/[slug]/page.tsx` × 1
- `app/cardology-books/page.tsx` × 1
- `app/cardology-compatibility/page.tsx` × 1
- `app/cardology-for-beginners/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/free-course/page.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `app/what-is-cardology/page.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/story/ArcRail.tsx` × 1

### border-gold (63 uses in 33 files)

- `app/playing-card-spreads/page.tsx` × 7
- `app/birth-card-calculator/page.tsx` × 5
- `app/birth-card/page.tsx` × 5
- `app/what-is-cardology/page.tsx` × 5
- `app/birth-card-compatibility-calculator/page.tsx` × 3
- `app/birth-card/[slug]/page.tsx` × 3
- `app/free-course/page.tsx` × 2
- `components/app/BondsClient.tsx` × 2
- `components/app/JournalClient.tsx` × 2
- `components/app/ReadingClient.tsx` × 2
- `components/app/StoryClient.tsx` × 2
- `components/app/TodayClient.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/timing/PeriodRow.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/card-of-the-day/page.tsx` × 1
- `app/cardology-for-beginners/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `app/products/blueprint-report/page.tsx` × 1
- `app/products/one-question-reading/page.tsx` × 1
- `components/app/TimingClient.tsx` × 1
- `components/cards/DeckMatrix.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/free-course/FreeCourseSignupForm.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/seo/PlayingCardsBirthdayChart.tsx` × 1
- `components/seo/ShadowLayer.tsx` × 1
- `components/year/YearPreview.tsx` × 1

### display (57 uses in 54 files)

- `app/birth-card/[slug]/page.tsx` × 2
- `app/cardology-books/page.tsx` × 2
- `components/app/BondsClient.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/52-day-period-meaning-tool/page.tsx` × 1
- `app/about/page.tsx` × 1
- `app/access/page.tsx` × 1
- `app/birth-card-calculator/page.tsx` × 1
- `app/birth-card-compatibility-calculator/page.tsx` × 1
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/birth-card/joker/page.tsx` × 1
- `app/birth-card/page.tsx` × 1
- `app/blog/[slug]/page.tsx` × 1
- `app/blog/page.tsx` × 1
- `app/blog/pillar/[slug]/page.tsx` × 1
- `app/card-of-the-day/page.tsx` × 1
- `app/cardology-compatibility/page.tsx` × 1
- `app/cardology-for-beginners/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/cartomancy-vs-tarot/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/editorial-policy/page.tsx` × 1
- `app/free-course/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/how-to-read-playing-cards/page.tsx` × 1
- `app/karma-cards/page.tsx` × 1
- `app/karma-reading/page.tsx` × 1
- `app/methodology/page.tsx` × 1
- `app/planetary-ruling-card/page.tsx` × 1
- `app/playing-card-spreads/page.tsx` × 1
- `app/playing-card-tattoo-meaning/page.tsx` × 1
- `app/privacy-policy/page.tsx` × 1
- `app/products/blueprint-report/page.tsx` × 1
- `app/products/one-question-reading/page.tsx` × 1
- `app/refund-policy/page.tsx` × 1
- `app/shadow-karma-guide/page.tsx` × 1
- `app/terms-of-service/page.tsx` × 1
- `app/videos/page.tsx` × 1
- `app/what-is-cardology/page.tsx` × 1
- `app/your-year/page.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/app/ReadingClient.tsx` × 1
- `components/app/SelfClient.tsx` × 1
- `components/app/StoryClient.tsx` × 1
- `components/app/TimingClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/onboarding/IntroSlide.tsx` × 1
- `components/onboarding/ProfileForm.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/reading/StreamedMarkdown.tsx` × 1
- `components/today/DailyCard.tsx` × 1
- `components/ui.tsx` × 1

### card-surface (40 uses in 31 files)

- `components/app/JournalClient.tsx` × 5
- `app/birth-card/[slug]/page.tsx` × 3
- `app/cardology-for-beginners/page.tsx` × 2
- `app/free-course/page.tsx` × 2
- `app/what-is-cardology/page.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/birth-card-calculator/page.tsx` × 1
- `app/birth-card-compatibility-calculator/page.tsx` × 1
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/birth-card/joker/page.tsx` × 1
- `app/birth-card/page.tsx` × 1
- `app/blog/[slug]/page.tsx` × 1
- `app/card-of-the-day/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/cartomancy-vs-tarot/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/how-to-read-playing-cards/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/app/SelfClient.tsx` × 1
- `components/app/TimingClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `components/reflection/Prompts.tsx` × 1
- `components/self/TraitList.tsx` × 1
- `components/story/ArcRail.tsx` × 1
- `components/today/DailyCard.tsx` × 1

### bg-cosmic (18 uses in 8 files)

- `components/app/SelfClient.tsx` × 4
- `components/app/TimingClient.tsx` × 4
- `components/app/ReadingClient.tsx` × 3
- `components/app/StoryClient.tsx` × 3
- `app/onboarding/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1

### starfield (18 uses in 8 files)

- `components/app/SelfClient.tsx` × 4
- `components/app/TimingClient.tsx` × 4
- `components/app/ReadingClient.tsx` × 3
- `components/app/StoryClient.tsx` × 3
- `app/onboarding/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1

### text-ink (17 uses in 16 files)

- `app/what-is-cardology/page.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/cardology-for-beginners/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/cartomancy-vs-tarot/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/how-to-read-playing-cards/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/free-course/FreeCourseSignupForm.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/gate/AccessLink.tsx` × 1
- `components/onboarding/ProfileForm.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1

### bg-foil (17 uses in 16 files)

- `components/cards/FoilSheen.tsx` × 2
- `app/52-card-astrology-explained/page.tsx` × 1
- `app/birth-card-vs-ruling-card/page.tsx` × 1
- `app/cardology-vs-tarot/page.tsx` × 1
- `app/cartomancy-vs-tarot/page.tsx` × 1
- `app/free-course/watch/page.tsx` × 1
- `app/how-to-read-playing-cards/page.tsx` × 1
- `app/what-is-cardology/page.tsx` × 1
- `components/app/BondsClient.tsx` × 1
- `components/cards/CardBack.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/free-course/FreeCourseSignupForm.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/gate/AccessLink.tsx` × 1
- `components/profile/ProfilePrompt.tsx` × 1
- `scripts/calculator-deep-dive.test.ts` × 1

### bg-gold (15 uses in 12 files)

- `components/timing/PeriodRow.tsx` × 3
- `app/what-is-cardology/page.tsx` × 2
- `app/cardology-for-beginners/page.tsx` × 1
- `app/destiny-cards/page.tsx` × 1
- `app/onboarding/page.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/app/ReadingClient.tsx` × 1
- `components/app/StoryClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/nav/BottomNav.tsx` × 1
- `components/onboarding/ProfileForm.tsx` × 1
- `components/reading/StreamedMarkdown.tsx` × 1

### text-ember (12 uses in 8 files)

- `components/app/JournalClient.tsx` × 3
- `components/app/SelfClient.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/app/TimingClient.tsx` × 1
- `components/app/TodayClient.tsx` × 1
- `components/bonds/ObservationCard.tsx` × 1
- `components/gate/AccessGate.tsx` × 1
- `components/ui.tsx` × 1

### bg-haze (10 uses in 6 files)

- `components/app/TimingClient.tsx` × 3
- `components/app/BondsClient.tsx` × 2
- `components/reading/ComposingState.tsx` × 2
- `components/app/SelfClient.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/timing/PeriodRow.tsx` × 1

### bg-void (8 uses in 4 files)

- `components/app/JournalClient.tsx` × 3
- `components/app/BondsClient.tsx` × 2
- `components/onboarding/ProfileForm.tsx` × 2
- `components/gate/AccessGate.tsx` × 1

### text-white (7 uses in 6 files)

- `app/playing-card-spreads/page.tsx` × 2
- `app/methodology/page.tsx` × 1
- `app/planetary-ruling-card/page.tsx` × 1
- `components/checkout/ConsultationRequestForm.tsx` × 1
- `components/free-course/FreeCourseCta.tsx` × 1
- `components/seo/VideoEmbed.tsx` × 1

### bg-white (7 uses in 5 files)

- `components/home/CompareBand.tsx` × 2
- `components/seo/PlanetaryRulingCardChart.tsx` × 2
- `app/onboarding/page.tsx` × 1
- `components/app/JournalClient.tsx` × 1
- `components/timing/PeriodRow.tsx` × 1

### ring-gold (5 uses in 4 files)

- `components/onboarding/ProfileForm.tsx` × 2
- `components/gate/AccessGate.tsx` × 1
- `components/PlayingCard.tsx` × 1
- `components/seo/CompatibilityCalculator.tsx` × 1

### from-haze (4 uses in 3 files)

- `components/app/BondsClient.tsx` × 2
- `components/PlayingCard.tsx` × 1
- `components/today/Skeleton.tsx` × 1

### border-haze (4 uses in 2 files)

- `components/app/ReadingClient.tsx` × 2
- `components/app/StoryClient.tsx` × 2

### bg-ember (4 uses in 3 files)

- `components/app/SelfClient.tsx` × 2
- `components/bonds/ObservationCard.tsx` × 1
- `components/ui.tsx` × 1

### hairline (4 uses in 4 files)

- `components/app/SelfClient.tsx` × 1
- `components/story/ArcRail.tsx` × 1
- `components/timing/PeriodRow.tsx` × 1
- `components/ui.tsx` × 1

### foil-text (4 uses in 4 files, plus one the scanner drops)

`components/cards/CardFace.tsx` sets `foil-text` inside a nested template (`paper ? "" : "foil-text"`). Count it in batch K.

- `components/app/TimingClient.tsx` × 1
- `components/cards/CardBack.tsx` × 1
- `components/nav/Brand.tsx` × 1
- `components/reading/ComposingState.tsx` × 1

### to-cosmos (3 uses in 2 files)

- `components/app/BondsClient.tsx` × 2
- `components/PlayingCard.tsx` × 1

### app-paper-stage (2 uses in 2 files)

- `app/52-day-period-meaning-tool/page.tsx` × 1
- `components/seo/AppFeaturePage.tsx` × 1

### bg-ink (2 uses in 2 files)

- `app/layout.tsx` × 1
- `components/nav/BottomNav.tsx` × 1

### border-ember (2 uses in 1 files)

- `components/app/SelfClient.tsx` × 2

### text-sage (2 uses in 2 files)

- `components/bonds/ObservationCard.tsx` × 1
- `components/ui.tsx` × 1

### text-dusk (2 uses in 2 files)

- `components/bonds/ObservationCard.tsx` × 1
- `components/ui.tsx` × 1

### bg-sage (2 uses in 2 files)

- `components/bonds/ObservationCard.tsx` × 1
- `components/ui.tsx` × 1

### bg-dusk (2 uses in 2 files)

- `components/bonds/ObservationCard.tsx` × 1
- `components/ui.tsx` × 1

### card-frame (1 uses in 1 files)

- `components/PlayingCard.tsx` × 1

### text-void (1 uses in 1 files)

- `components/app/JournalClient.tsx` × 1

### outline-gold (1 uses in 1 files)

- `components/free-course/FreeCourseCta.tsx` × 1

### border-bone (1 uses in 1 files)

- `components/nav/BottomNav.tsx` × 1

### bg-bone (1 uses in 1 files)

- `components/onboarding/ProfileForm.tsx` × 1

### from-gold (1 uses in 1 files)

- `components/story/ArcRail.tsx` × 1

### to-gold (1 uses in 1 files)

- `components/story/ArcRail.tsx` × 1

### via-cosmos (1 uses in 1 files)

- `components/today/Skeleton.tsx` × 1

### to-haze (1 uses in 1 files)

- `components/today/Skeleton.tsx` × 1
