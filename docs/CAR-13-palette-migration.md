# CAR-13 — Legacy dark palette off the paper-shell layer

Pass 1 inventoried the layer and proposed the mapping. Cass agreed that mapping, including D1 option (a). Batches A, B, C, and D are the deletions so far.

Status: batch D landed. Rule 3 (batch A), rule 4 (batch B), rules 5–6 (batch C: `.paper-shell [class*="text-gold"]`, `[class*="text-ember"]`, and the anchor override `a[class*="text-gold"]`), and rule 7 (batch D: `.paper-shell .text-sage`, `.text-dusk`) are deleted. Rules 1–2 and 8–23 stay. `tailwind.config.ts` dark palette keys stay. `:root` gained `--club: #183f30` and Tailwind gained `brand.club`.

`docs/SITE-RECORD.md` is not in this repository (`docs/SECURITY.md` already records that). This file is the §1.1 tracking note until that record exists.

## Tracking

The inventory was counted on `main` at `f040184` (the paper-shell remap block was lines 585–747). A deletion of the blueprint-ambient rules earlier in that file had moved this block up from the 739–901 range named in the issue. Batch A removed rule 3. Batch B removed rule 4. Batch C removed rules 5 and 6. Batch D removed rule 7 and added `--club` on `:root`, which shifted the block, so it now ends at line 717. Appendix counts below are the pre-batch-A inventory.

| Slice | Rule groups | Remaining |
| --- | ---: | --- |
| Palette and surface remaps (the layer CAR-13 exists to remove) | 18 | 13 (72%) |
| Geometry and form chrome (radius, inputs, `.app-paper-stage`) | 5 | 5 (100%) |
| Whole `.paper-shell` compatibility block | 23 | 18 (78%) |

Batch A migrated exact `text-bone` on paper-shell screens to `text-brand-ink`, and added `text-brand-ink` beside `.display` (the type class stays). Inert `hover:text-bone` on those screens moved in the same change: `hover:text-brand-ink` on mist chips, `hover:text-brand-oxblood` on the gold anchor chips in `app/birth-card/page.tsx`. Still on the dark palette for bone: `app/layout.tsx` body, `app/access/page.tsx`, onboarding (`app/onboarding/page.tsx`, `ProfileForm`, `IntroSlide`), and unmounted `Brand` and `YearPreview`. `PlayingCard` titles no longer set `text-bone`; they inherit, so a paper-shell title stays ink and an onboarding title stays bone. The dark card frame stays for batch K. `ProfileForm`'s `hover:text-bone` stays.

Batch B migrated `text-mist`, `hover:text-mist`, `text-faint`, and `placeholder:text-faint` on paper-shell screens to `text-brand-ink-soft`, `hover:text-brand-ink-soft`, and `placeholder:text-brand-ink-soft`. `text-faint` maps to ink-soft, the same destination as mist. It does not map to `text-brand-ink-faint`. Resting body copy stays `--ink-soft`. Mist chips whose hover was moved to `hover:text-brand-ink` in batch A were inert under rule 4; that hover now darkens to ink. Inputs that carried `placeholder:text-faint` already set `text-brand-ink`. Rule 4's attribute selector was winning that element's own color over rule 19, so typed text moves from `--ink-soft` to `--ink`. Placeholder color was already rule 20 and stays there. Still on the dark palette for mist and faint: `/onboarding` (`app/onboarding/page.tsx`, `ProfileForm`, `IntroSlide`), `/access` (`AccessLink`), and unmounted `BottomNav`, `Brand`, and `YearPreview`.

Batch C migrated `text-gold` and `text-ember` on paper-shell screens in the same change, because rule 6 only exists to beat rule 5 on anchors. Labels are `text-brand-bronze`. Anchors (`<a>` and `<Link>` with the class on that element) are `text-brand-oxblood`. Eyebrows use `!text-brand-bronze`: rule 9 (`.paper-shell .eyebrow`) is more specific than a utility and is emitted after Tailwind, so a plain bronze class would paint ink-soft. Rule 5's `!important` was what kept those labels bronze. A gold class on a child inside a link stays bronze; rule 6 never painted the child. `hover:`, `group-hover:`, and opacity modifiers (`text-gold/80`, `text-gold/90`, `text-gold/50`) collapse to the plain brand class. The attribute selector forced full bronze or oxblood at rest, so those prefixes were already inert. Where `text-brand-ink` or `text-brand-ink-soft` sat on the same element, that resting class is removed, because the override had already beaten it. `text-ember` is bronze even on an anchor; rule 6 did not match it, and no paper anchor used it. `FreeCourseSignupForm`'s ink branch renders inside `/free-course`, so its asterisk is bronze and its privacy link is oxblood. The paper branch already used those tokens. `PositionStack`'s Over label is bronze; its `bg-ember` dot and the sage/dusk rows stay for batch D. `ObservationCard` complement and tension labels are both bronze (rule 5 already painted both that way); sage/dusk labels and the dots stay for batch D. `ReportCheckoutButton variant="link"` renders a button, so it is bronze. Still on the dark palette for gold and ember: `/onboarding` (`app/onboarding/page.tsx` `hover:text-gold`, `ProfileForm` `text-gold` and `text-ember`) and unmounted `BottomNav`, `Brand` (`active:text-gold`), and `YearPreview`.

Batch D applied D1 option (a). `:root` defines `--club: #183f30` (the value rule 7 forced, and the value `.landing-oracle` already set locally). `brand.club` maps to that variable. `text-sage` and `text-dusk` on `PositionStack` and `ObservationCard` are `text-brand-club`. ObservationCard labels sit on `.eyebrow`. Rule 9 is more specific than a utility and is emitted after Tailwind, so those labels use `!text-brand-club` or rule 9 paints ink-soft. Complement and tension were `text-brand-bronze` without `!` after batch C, which let the same rule paint them ink-soft; this batch adds `!text-brand-bronze` so they stay the bronze rule 5 forced. PositionStack labels are not eyebrows, so a plain `text-brand-club` holds. Dots stay three distinct colors: sage (`bg-sage`, the balanced position) is `bg-brand-club`; ember (`bg-ember`, the over position) is `bg-brand-bronze`; dusk (`bg-dusk`, the under position) is `bg-brand-oxblood`. Mapping sage and dusk dots both to club would collapse under and balanced. Option (a) names club and bronze-for-ember and requires three dots; oxblood is the remaining color named in option (b) and in the agreed note. `ObservationCard`'s complement dot stays `bg-gold` for batch H (rule 16). `SelfClient`'s `bg-ember/5` and `border-ember/20` warning wash is not a position dot and stays. No paper-shell screen still uses `text-sage`, `text-dusk`, `bg-sage`, or `bg-dusk`. Dark palette keys, including unused `sage` and `dusk`, stay until the last consumer of the set is gone. `ember` still has the SelfClient wash. Update this table again in the PR that deletes the next rule group. A batch that deletes no rule has not finished.

The dark palette in `tailwind.config.ts` (`ink`, `void`, `cosmos`, `haze`, `bone`, `mist`, `faint`, `gold`, `ember`, `sage`, `dusk`, plus suit aliases `hearts` / `diamonds` / `clubs` / `spades`) stays until the last consumer is gone. Suit aliases have zero class uses. `faint` stays in the config because onboarding, access, and unmounted files still use it. `sage` and `dusk` have no class uses after batch D; the keys stay until that final removal. `brand.club` is an addition, not a deletion of a dark key. The issue's token list skipped `faint`.

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
| `Eyebrow` | Paper-shell app pages, and `ProfileForm` on `/onboarding` (outside the shell). `AccessGate` is mounted from `ReadingClient` and `StoryClient`, which sit inside `SeoShell`, so that gate is a paper-shell consumer. | `eyebrow` plus whatever `className` the caller adds (`text-gold`, `text-ember`, `text-mist`) |
| `SectionTitle`, `Divider`, `PositionStack` | Paper-shell only (`TodayClient`, `JournalClient`, `self/Section`, `DailyCard`, `PeriodRow`, and the other app clients). Onboarding does not mount them. | `display text-bone`, `hairline`, `text-dusk` / `text-sage` / `text-ember`, `bg-dusk` / `bg-sage` / `bg-ember`, `text-mist` |
| `Screen` | Paper-shell app clients and `/onboarding` | No palette class on `Screen` itself |
| `Kicker`, `LinkButton`, `SectionShell`, `Rule` | Paper marketing | Already on brand tokens |

`PlayingCard`, `CardFace`, `CardBack`, and `FoilSheen` mount inside paper-shell app cards and inside onboarding (`ProfileForm`). `surface="paper"` only recolors pips. The frame classes stay the dark set: `card-frame`, `border-white/10`, `from-haze`, `to-cosmos`, `text-bone`, `eyebrow`, `ring-gold`, `foil-text`, `bg-foil`. The live homepage does not mount `PlayingCard` (tests import `HomepageCalculatorHero`; `app/page.tsx` renders `LandingCalculator`).

Replacing `Eyebrow`'s class string, or `PlayingCard`'s frame classes, changes `/onboarding` in the same commit as the paper screens. `SectionTitle`, `Divider`, and `PositionStack` can move in a paper batch.

`components/year/YearBlueprintApp.tsx` uses `s.eyebrow` from `year.module.css`. That class is hashed. It is not a consumer of `.paper-shell .eyebrow`. `scripts/professional-reading/render.ts` emits its own PDF `.eyebrow`. Neither counts below.

Dead to the router today, still a grep dependency if a batch's exit check is "no matches left": `components/nav/BottomNav.tsx`, `components/nav/Brand.tsx`, `components/home/CompareBand.tsx`, `components/year/YearPreview.tsx`, `components/year/YearPreviewApp.tsx`.

## How the counts were taken

Source scan of `app/`, `components/`, and `scripts/` (tests that assert class names). A utility counts when it appears as a class token (`text-mist`, `hover:text-gold`, `border-white/10`, `placeholder:text-faint`). A semantic class (`display`, `eyebrow`, `card-surface`, …) counts only as a whitespace-separated token inside a string, so `s.eyebrow`, `display: "swap"`, and the English word "display" do not count. Comments are skipped. The override block itself (lines 585–747 at the inventory commit; 585–741 after batch A; 585–734 after batch B; 585–718 after batch C; 589–717 after batch D) and the base dark rules it replaces (`.card-surface`, `.foil-text`, `.eyebrow`, `.display`, `.prose-reading`, `.hairline`, `.starfield` earlier in `app/globals.css`) are not counted as consumers.

CSS modules and the shorts studio stylesheet are excluded. They do not match `.paper-shell` selectors.

Issue round numbers were `text-bone` in 51 files, `text-mist` in 50, `card-surface` in 32. This pass: `text-bone` 195 exact uses in 52 files (plus 22 `hover:text-bone`, which the rule does not match), `text-mist` 328 uses in 49 files, `card-surface` 40 uses in 31 files. 63 files use a dark-palette utility. 86 files use a dark-palette utility or a semantic class the layer restyles.

## The layer, rule by rule

Line numbers are `app/globals.css` after batch D deleted rule 7. "Depends" means a descendant of `.paper-shell` whose class attribute matches the selector. Outside-shell files in the appendix use the same class names and do not depend on the rule; they block deleting the Tailwind color, not the rule.

Selector behavior that is easy to miss:

- `text-ink` matches the exact class only. Rule 7's exact `.text-sage` and `.text-dusk` selectors are deleted. `hover:text-bone` does not match `.text-bone`.
- `text-mist`, `text-faint`, `text-gold`, `text-ember`, `bg-gold`, `bg-void`, `bg-haze`, `bg-cosmos`, `bg-white`, `border-white`, `border-bone`, `border-haze`, and `border-gold` use `[class*="…"]`, so variants and opacities match.
- `border-t-gold` does not contain the substring `border-gold`, so side-specific borders do not match. This pass found no side-specific palette borders.
- `from-haze`, `to-cosmos`, `via-cosmos`, `ring-gold`, `bg-ink`, `bg-ember`, `bg-bone`, `text-void`, `text-white` match no rule. Inside the shell they paint the dark palette on paper. `bg-sage` and `bg-dusk` left the paper screens in batch D.

| # | Lines | Selector (abbreviated) | `!important` | What the visitor sees inside the shell | Delete with batch |
| --- | --- | --- | --- | --- | --- |
| 1 | 589–592 | `.starfield::before` | no | starfield removed | I |
| 2 | 594–597 | `.bg-cosmic`, `[class*="bg-cosmic"]` | yes | background transparent | I |
| 3 | — | `.display`, `.text-bone`, `.font-serif.text-bone` | yes | deleted in batch A; paper screens use `text-brand-ink` | done |
| 4 | — | `[class*="text-mist"]`, `[class*="text-faint"]` | yes | deleted in batch B; paper screens use `text-brand-ink-soft` | done |
| 5 | — | `[class*="text-gold"]`, `[class*="text-ember"]` | yes | deleted in batch C; paper labels use `text-brand-bronze` | done |
| 6 | — | `a.text-gold`, `a[class*="text-gold"]` | yes | deleted in batch C; paper anchors use `text-brand-oxblood` | done |
| 7 | — | `.text-sage`, `.text-dusk` | yes | deleted in batch D; paper labels use `text-brand-club` (`#183f30`) | done |
| 8 | 599–601 | `.text-ink` | yes | `color: var(--paper)` | E |
| 9 | 603–607 | `.eyebrow` | no | `var(--ink-soft)`, weight 700 | L |
| 10 | 609–621 | `.prose-reading` and `p` / `li` / `em` / `strong` | no | `color: var(--ink)` (base rule paints `em` gold `#d9b26a`; the override flattens that to ink) | L |
| 11 | 623–625 | `.hairline` | no | `border-color: var(--line)` | L |
| 12 | 627–637 | `.card-surface` | no | cream grid card; replaces the dark gradient in the base rule | J |
| 13 | 639–642 | `.card-frame` | yes | border `rgba(20,17,13,.25)`, fill `rgba(244,240,231,.94)` | K |
| 14 | 644–649 | `.foil-text` | yes | clipped gradient `var(--rust)` → `#c77e63` → `var(--gold)`; shell sets `--rust` to `var(--oxblood)` | K |
| 15 | 651–653 | `.bg-foil` | yes | `background: var(--ink)` | E |
| 16 | 655–657 | `[class*="bg-gold"]` | yes | `background-color: rgba(158,61,36,.12)` (old warm red at 12%) | H |
| 17 | 659–664 | `[class*="border-white"]`, `border-bone`, `border-haze`, `border-gold` | yes | `border-color: rgba(20,17,13,.16)` | G |
| 18 | 666–672 | `[class*="bg-void"]`, `bg-haze`, `bg-cosmos`, `bg-white` | yes | fill `rgba(244,240,231,.68)`, image cleared | F |
| 19 | 674–680 | `input`, `textarea`, `select` | yes | cream field, ink text, warm border | M (keep or migrate; see below) |
| 20 | 682–685 | placeholders | yes | `rgba(20,17,13,.45)` | M |
| 21 | 687–693 | `.rounded-2xl` … `.rounded-t-3xl` | yes | radius `0.25rem` | M |
| 22 | 698–701 | `a.rounded-full`, `button.rounded-full` | yes | radius `0.25rem` | M |
| 23 | 703–717 | `.app-paper-stage` and descendants | no | inset shadow, `min-height: auto`, softer `.shadow-lg` | M |

Rules 19–23 are chrome. They are not dark-palette class names. Recommendation: leave them as the paper shell's intentional geometry, and track them separately from the 18 palette rules. Cass decides in the agreement step.

## Proposed mapping

Map to the color the visitor already sees inside `.paper-shell`, written as a brand utility a new page would use. Brand tokens are the cyanotype set in `:root` (`--ink` `#123a63`, `--ink-soft` `#3c6089`, `--ink-faint` `#4a6b8f`, `--bronze` `#735624`, `--oxblood` `#0c4275`, `--club` `#183f30`, `--paper` `#eef3f8`, `--on-dark` `#e8f1fa`, `--gold-soft` `rgba(184,137,61,.14)`, `--line` `rgba(18,58,99,.14)`).

Rules 3, 4, 5, 6, and 9 already point at those CSS variables. Swapping the class does not change the hue.

Rules 16, 17, 18, 12, and 13 still paint warm leftovers (cream `rgba(244,240,231,…)`, warm black `rgba(20,17,13,…)`, old red `rgba(158,61,36,.12)`). Pointing those at current brand tokens shifts the hue from warm black/cream toward ink blue and ivory. Pages that already use `border-brand-line` and `bg-brand-paper` are on the cyanotype side. Recommendation: accept that shift so one system remains. The alternative is new utilities that freeze the warm override colors, which keeps two papers alive.

| Legacy class inside `.paper-shell` | Sees today | Write instead | Hue |
| --- | --- | --- | --- |
| `text-bone`, `.display` | `var(--ink)` | `text-brand-ink`. `.display` stays as the type class; add `text-brand-ink` on the element (the base `.display` rule sets no color). | safe |
| `hover:text-bone` | does not match rule 3. On a node that also has `text-mist` or `text-gold`, those `!important` rules hold through hover, so the hover is inert inside the shell. 19 of 22 are links; 3 are not (`JournalClient`, `ProfileForm`, `ProfilePrompt`). | `hover:text-brand-ink` on mist chips; `hover:text-brand-oxblood` when the resting class is anchor `text-gold`. Leave `ProfileForm` (outside the shell) on the dark palette. | safe once the resting class moves |
| `text-mist`, `hover:text-mist`, `text-faint`, `placeholder:text-faint` | `var(--ink-soft)` | `text-brand-ink-soft`, `hover:text-brand-ink-soft`, `placeholder:text-brand-ink-soft`. `text-faint` maps to ink-soft, the same destination as mist. It does not map to `text-brand-ink-faint`. | safe |
| `text-gold`, `hover:text-gold`, `group-hover:text-gold`, `text-gold/80` and other opacities, on elements that are not anchors | `var(--bronze)` | `text-brand-bronze` (opacity modifiers dropped; bronze is already the tuned label color) | safe |
| `text-gold` on `<a>` / `<Link>` | `var(--oxblood)` via rule 6 | `text-brand-oxblood` | safe |
| `text-ember`, `hover:text-ember` | `var(--bronze)` | `text-brand-bronze` | safe |
| `.eyebrow` | ink-soft, weight 700 | `type-eyebrow` for marketing labels (already bronze). For the muted shell treatment, `text-brand-ink-soft font-bold`. Paper callers of `Eyebrow` switch to `Kicker` or `type-eyebrow`. Dark callers keep `Eyebrow`. | safe on paper; dark screens keep the base `.eyebrow` |
| `.prose-reading` | ink, including `em` / `strong` | Keep the class. Retarget the base rule to `color: var(--ink)` and drop the shell override in batch L, after confirming no outside-shell screen still wants the dark gray `#d8d6df` / gold `em`. | safe if base moves with the override |
| `text-sage`, `text-dusk` | `#183f30` | `text-brand-club`. Eyebrows use `!text-brand-club` so rule 9 does not paint ink-soft. | safe |
| `text-ink` paired with `bg-foil` | light paper text on `var(--ink)` fill | `bg-brand-ink text-brand-on-dark` | safe (on-dark `#e8f1fa` is the button label; paper `#eef3f8` is a hair lighter) |
| `text-ink` paired with `bg-gold` (`what-is-cardology`, `cardology-for-beginners`, `destiny-cards`) | rule 8 paints paper-colored text and rule 16 paints a 12% warm-red wash. Light text on a light wash. | Replace the pair with `accent-button` or `ink-button`. Do not preserve `text-brand-paper` on `bg-brand-gold-soft`. | repairs a contrast failure |
| `bg-foil` | `var(--ink)` | `bg-brand-ink` | safe |
| `bg-gold`, `hover:bg-gold`, `bg-gold/15` and other opacities | `rgba(158,61,36,.12)` | `bg-brand-gold-soft` | shifts from old red wash to current gold wash |
| `border-white/*`, `border-bone/*`, `border-haze`, `border-gold/*`, `hover:border-gold`, `focus:border-gold` | `rgba(20,17,13,.16)` | `border-brand-line` | shifts from warm black to ink-blue line |
| `bg-void`, `bg-haze`, `bg-cosmos`, `bg-white` and opacities | cream `rgba(244,240,231,.68)` | `bg-brand-ivory/70` | shifts from warm cream to ivory |
| `.card-surface` | cream grid, 1px ink-ish border, soft shadow | Keep one class. Move the shell rule's declarations onto the base `.card-surface` when no dark screen still needs the indigo gradient. Dark screens that still need the gradient get an explicit `card-surface-dark`. | shifts if any dark caller remains |
| `.card-frame` | cream fill, warm border | Paper `PlayingCard` (`surface="paper"`) gets explicit paper frame classes. Dark `PlayingCard` keeps a dark frame class with no shell override. | dual component; do not global-replace |
| `.foil-text` | oxblood-to-gold clip | Keep the class; point the base gradient at `var(--oxblood)` / `var(--gold)` and delete the shell copy in batch K. | small |
| `.bg-cosmic`, `.starfield` | transparent / no stars | Delete the classes from paper screens. | safe |
| `.hairline` | `var(--line)` | `border-brand-line` on paper. Dark `Divider` keeps `.hairline` until those callers are gone. | safe on paper |
| `.app-paper-stage` | stage chrome | Leave the class and rule 23. Two call sites: `AppFeaturePage`, `app/52-day-period-meaning-tool/page.tsx`. | n/a if M stays |

### Classes with no override (they already leak the dark palette onto paper)

| Class | Uses | Where | Proposed write |
| --- | --- | --- | --- |
| `hover:text-bone` | 22 | mostly paper links, suppressed by rules 4 and 6; live on `ProfileForm` | see mapping row above |
| `text-white` | 7 | already on `bg-brand-oxblood` or `bg-brand-ink` (`playing-card-spreads`, `methodology`, `planetary-ruling-card`, `ConsultationRequestForm`, `FreeCourseCta`, `VideoEmbed`) | `text-brand-on-dark` in whatever batch touches that file. No shell rule to delete. |
| `ring-gold`, `focus:ring-gold/40` | 5 | `PlayingCard`, `ProfileForm`, and paper components | `ring-brand-gold` on paper; leave dark screens |
| `from-haze`, `to-haze`, `to-cosmos`, `via-cosmos` | 9 tokens | `PlayingCard`, `BondsClient`, `components/today/Skeleton.tsx` | paper skeleton → `bg-brand-paper-deep`; card gradient handled with `PlayingCard` in batch K |
| `bg-ember`, `border-ember/20` | 4 at inventory; dots moved in batch D | `SelfClient` wash remains (`bg-ember/5`, `border-ember/20`) | Position dots are `bg-brand-bronze`. `SelfClient`'s ember panel is a warning wash the shell does not recolor, and batch D left it. |
| `bg-sage`, `bg-dusk` | 2 each at inventory; none on paper after batch D | `PositionStack`, `ObservationCard` | Sage dots are `bg-brand-club`. Dusk dots are `bg-brand-oxblood`, so under / balanced / over stay three colors. |
| `bg-ink`, `bg-ink/80` | 2 | `body` in `app/layout.tsx`, unmounted `BottomNav` | keep until the dark canvas is retired |
| `bg-bone` | 1 | `ProfileForm` submit button, outside the shell | keep with onboarding |
| `text-void` | 1 | `JournalClient` on `bg-gold/90`. Rule 16 turns that fill into a light wash; `text-void` has no override, so the label stays near-black `#0a0b12` on the wash. | `text-brand-ink` |
| `from-gold/50`, `to-gold/10` | 1 line | `components/story/ArcRail.tsx` | `from-brand-gold/50 to-brand-gold/10` |
| `focus-visible:outline-gold` | 1 | `FreeCourseCta` | `focus-visible:outline-brand-oxblood` (matches the paper focus ring) |

`bg-cosmos` appears in rule 18 and has zero `bg-cosmos` consumers. `to-cosmos` does not match `[class*="bg-cosmos"]`.

## Decisions to agree before pass 2

1. **D1 — sage / dusk / ember dots.** Agreed: option (a). Applied in batch D. Both labels are `text-brand-club` (`#183f30`). Dots stay three colors: balanced/sage `bg-brand-club`, over/ember `bg-brand-bronze`, under/dusk `bg-brand-oxblood`. Option (b) was to collapse labels to `text-brand-ink` and dots to `bg-brand-ink` / `bg-brand-bronze` / `bg-brand-oxblood`.

2. **D2 — warm washes vs cyanotype.** Agree the shift on rules 12, 13, 16, 17, 18 (cream, warm border, old red `bg-gold`) onto `bg-brand-ivory`, `border-brand-line`, and `bg-brand-gold-soft`. Recommendation: accept the shift.

3. **D3 — `bg-gold` + `text-ink` buttons.** Agree they become `accent-button` or `ink-button` rather than a literal token swap. Recommendation: `ink-button` where the shell's `bg-foil` sibling buttons are the pattern; `accent-button` only where the control is the single conversion action.

4. **D4 — geometry rules 19–23.** Recommendation: keep them. They are the paper shell, not the dark palette. Tracking for CAR-13 then closes when the 18 palette rules are gone; the 5 chrome rules stay and get a one-line note in this file.

5. **D5 — shared primitives.** Recommendation: paper callers of `Eyebrow` switch to `Kicker` or `type-eyebrow`; `ProfileForm` keeps `Eyebrow`. `SectionTitle`, `Divider`, and `PositionStack` are paper-shell-only and can take brand classes in batches A, D, and L. `PlayingCard` grows real paper-surface classes (`surface="paper"` today only recolors pips) and keeps a dark frame for onboarding. No blind replace across `ui.tsx`.

D1 is agreed and applied. D2–D5 are still open. Later batches stay blocked on the decision named in the batch plan until that decision is agreed.

## Batch plan

Each batch is one PR. It migrates only the files listed for that rule, screenshots every route those files mount, and deletes the rule in the same PR. Exit check: the selector's class no longer occurs on a paper-shell screen. Outside-shell and unmounted files may still contain the old class; they are called out so the rule is not kept "just in case," and so `tailwind.config.ts` is not edited yet.

Order is hue-safe text first, then the decisions, then shared components, then surfaces.

| Batch | Deletes | Scope | Notes |
| --- | --- | --- | --- |
| A | rule 3 (deleted) | Exact `text-bone` and `.display` on paper-shell files, including `SectionTitle` (paper-only). Add `text-brand-ink` next to `.display`. | Done. Left `Eyebrow` callers that pass through `ProfileForm`, `app/layout.tsx` `text-bone`, `app/access/page.tsx`, and the rest of onboarding. `PlayingCard` titles inherit instead of setting `text-bone`, so paper titles stay ink and onboarding titles stay bone. Inert `hover:text-bone` on paper links moved in the same PR. |
| B | rule 4 (deleted) | `text-mist`, `text-faint`, `placeholder:text-faint` on paper-shell-only files. | Done. Left `/onboarding`, `/access` (`AccessLink`), and unmounted `BottomNav`, `Brand`, and `YearPreview` on the dark palette. |
| C | rules 5 and 6 (deleted) | `text-gold` and `text-ember`. Split anchors (`text-brand-oxblood`) from labels (`text-brand-bronze`) in the same PR. | Done. Left `/onboarding` and unmounted `BottomNav`, `Brand`, and `YearPreview` on the dark palette. Sage/dusk labels and `bg-ember` dots stay for batch D. |
| D | rule 7 (deleted) | `text-sage`, `text-dusk`, plus the unmatched `bg-sage`, `bg-dusk`, `bg-ember` dots. | Done, D1 option (a). `PositionStack` and `components/bonds/ObservationCard.tsx`. Under dot is `bg-brand-oxblood`, balanced/sage dot is `bg-brand-club`, over/ember dot is `bg-brand-bronze`. `ObservationCard` complement `bg-gold` stays for batch H. `SelfClient`'s ember wash stays. |
| E | rules 8 and 15 | `text-ink` + `bg-foil` buttons, and the three `bg-gold text-ink` buttons. | Blocked on D3. `FreeCourseSignupForm` has both a paper field style and a `bg-foil text-ink` branch; read both before editing. `AccessGate` is inside the shell (mounted from `ReadingClient` and `StoryClient`). `AccessLink` and `ProfileForm` are outside; leave those two. |
| F | rule 18 | `bg-void`, `bg-haze`, `bg-white` (and the dead `bg-cosmos` selector). | Blocked on D2. `bg-void` also appears on `ProfileForm`; leave that file. |
| G | rule 17 | `border-white`, `border-gold`, `border-haze`, `border-bone`. | Blocked on D2. Biggest visual sweep after text. `border-bone/10` is only unmounted `BottomNav`. |
| H | rule 16 | `bg-gold` washes that are not the D3 buttons. | Blocked on D2. Do after E so the button pairs are already gone. |
| I | rules 1 and 2 | `bg-cosmic`, `starfield` | Small. `app/onboarding/page.tsx` uses both outside the shell; leave it, and the rules can still die because they only match inside the shell. |
| J | rule 12 | `.card-surface` | 31 files, all paper or unmounted (`Brand`). Move the cream card onto the base class, or replace with `border border-brand-line bg-brand-ivory`. Do this only after D2. |
| K | rules 13 and 14 | `PlayingCard`, `CardFace`, `CardBack`, `FoilSheen` | Blocked on D5. One file owns `card-frame`. Foil gradient base rule gets the shell colors, then the shell copy goes. |
| L | rules 9, 10, 11 | `.eyebrow`, `.prose-reading`, `.hairline` | After paper callers of `Eyebrow` have moved and `ProfileForm` is the remaining `.eyebrow` mount (D5). `Divider` is paper-only and can move here. Retarget the base `.prose-reading` rule, then delete the shell copy. That class is 233 uses in 38 files, almost all paper articles; the work is the base rule, not 233 renames. |
| M | rules 19–23 only if D4 says migrate | radius utilities, form controls, `.app-paper-stage` | Recommendation is to keep these and close them out of CAR-13. |

Final PR, separate from the 18: remove dark palette keys from `tailwind.config.ts` when `app/` and `components/` no longer reference them. That includes `body`'s `bg-ink text-bone`, onboarding, access, and any dark `PlayingCard` frame that still wants haze/cosmos. Not this pass. Not any palette batch above.

Screenshot list for a batch is the routes that import its files. App clients (`TodayClient` and the rest) mean `/today`, `/self`, `/journal`, `/timing`, `/bonds`, `/story`, `/reading`. SEO pages mean their own `app/**/page.tsx` route.

Tests that quote old classes and will need a touch in the batch that renames them: `scripts/calculator-deep-dive.test.ts` (`bg-foil`). Batch A updated `scripts/card-meaning-depth.test.ts` and `scripts/card-reading-notes.test.ts` (`text-bone` → `text-brand-ink`). No test quoted `text-mist`, `text-faint`, `text-gold`, or `text-ember`.

## What the inventory pass did not do

This list describes the inventory commit only. Batch A renamed paper-shell `text-bone` and deleted rule 3. Batch B renamed paper-shell `text-mist` and `text-faint` and deleted rule 4. Batch C renamed paper-shell `text-gold` and `text-ember` and deleted rules 5 and 6.

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
