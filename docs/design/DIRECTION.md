# Direction: Blueprint, white (2026-11-13)

Owner decision, replacing the cyanotype palette below. The split-stage composition notes further down still describe older pages; anything new or rebuilt follows this section.

- **Ground:** white graph paper. A 24px minor grid and a 120px major grid on `body` (`--grid-minor`, `--grid-major`, app/bp.css). Pages leave their background transparent so the grid shows.
- **Ink:** black (`--ink #0e0e10`), two greys for secondary text. Hairlines are black, 1px.
- **Red:** one colour, `--red #b30d29`, used sparingly: the ruby suits, the current period, focus rings and at most one phrase per screen.
- **Suits:** cut as gems (components/bp/Gem.tsx). Hearts and diamonds are rubies, clubs and spades are onyx. Gems mark meaning (your suit, a card name); they are not scattered for decoration.
- **Planets:** stroke glyphs (components/bp/PlanetGlyph.tsx), never a symbol font or emoji.
- **Labels:** small mono capitals (`.bp-label`). Section heads are a label plus a ruler with 24px ticks (`.bp-rule-head`). Key boxes carry registration marks (`.bp-reg`).
- **Type:** Archivo stays for display and text.
- **Interaction:** one birthday per visit (`lib/use-birthday.ts`, tab-scoped, never in a URL). Every tool fills from it and answers as soon as a date is complete. No submit buttons on calculators, no scroll animations in front of an answer.

---

# Direction: the split stage

One direction for the whole site. Dealt by tasteskill v2 (`design-taste-frontend`), direction `split-stage`, seed 835131915, sector consumer-app, tone editorial, 2026-11-07. The sheet is saved at `.taste-skill/direction.json` (reprint with `node ~/.claude/skills/design-taste-frontend/scripts/draw.mjs --show`). Every screen built after this file obeys it; no second direction mid-build.

## The idea

> On this page, the one card your birthday pins to the drafting sheet becomes the half of the screen that never moves. Everything you read is the annotation beside it.

The competitor test: another cardology site also shows a card, but the drafting sheet is this brand's. The name is Blueprints, the tagline is "Cards are coordinates", the paper is cyanotype blue. A pinned drawing with its notes column beside it is a drafting convention, not a horoscope one.

**The live thing.** Type your birthday in the hero. The pinned card turns to face you, and the reading column lands the verdict. Thumb-sized on a phone, keyboard only in reading order, and with scripting off the same form submits to `/birth-card-calculator?birthdate=` which already reads that parameter.

## Why this direction and not the other two

- `pinned-poster` needs a stack of full-height photographs. The project owns one loop of film, one explainer, four product shots and 53 card faces. Not enough pictures, and the title holding still is not the subject's idea.
- `name-as-monument` makes the name the idea. The name is not the idea. The card is.
- `split-stage` says half the screen never moves. That is the product's claim in one composition: same date, same card, for life. The card stays. The reading scrolls past it.

## Composition

Desktop (≥ 1024px): a two-column page, 47/53. The left column is `position: sticky; top: 0; height: 100svh` and holds the stage: a flat `paper-deep` field (the drafting board) with one picture on it. The right column scrolls and holds everything you read in one measure (max 46ch for prose, wider for tables and the offer menu) with 48–72px of padding. The two grounds differ (board on the left, paper on the right) and meet at a clean vertical edge with no rule.

What the stage shows changes with the section beside it, by a 400ms crossfade and nothing else:

| Section in view | On the stage |
| --- | --- |
| Hero, before the birthday | The hero loop (`/video/hero-loop-9x16.mp4`, poster for reduced motion), the real deck face down on linen |
| Hero, after the birthday | Your card, turned to face you, on the same film dimmed to 35% |
| How a reading happens | The hero loop, still |
| Personal readings | The product shot of the offer nearest the middle of the screen (`/brand/mockups/*.webp`) |

Phone (< 1024px): the stage becomes a 58svh picture at the top, inset 12px, sticky behind the first screen of text, then it releases. The split ends after the readings menu; the three sections after it run full width on every screen.

The card pages, the calculator, card of the day, the born-on and compatibility shells all carry the same stage: the page's card (or two cards) pinned in a rail beside the reading. The homepage is the only page where the stage changes picture.

## Type: Archivo

One family for display and text, loaded once through `next/font/google` (self-hosted at build, latin subset, weights 400 and 600). Archivo is a sturdy grotesque that stays composed at 160px; it is the register of the voice this site already speaks in.

- Display: Archivo 400, tracking −0.02em (−0.03em above 96px), leading 1.0, sentence case, never bold, never italic, never one coloured word.
- Text: Archivo 400 at 17–19px, leading 1.5, tracking 0. 600 for buttons and short emphasis only.
- Figures: tabular wherever numbers align (prices, dates, the slip).
- Five steps and no sixth:

```css
--step-small:   clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);  /* 13–14px: notes, captions, the quiet line */
--step-body:    clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);   /* 17–19px: everything you read */
--step-lead:    clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);     /* 20–26px: the one supporting sentence, statements */
--step-head:    clamp(2rem, 1.3rem + 3.2vw, 4rem);            /* 32–64px: section heads, page titles */
--step-display: clamp(4.5rem, 9vw, 11rem);                    /* the name along the bottom of the first screen, and in the footer */
```

Retired: the Iowan Old Style serif stack, the system sans, the Montserrat logo face (the lockup is an SVG with outlined text and never used it), monospace labels, tracked capitals, eyebrows.

## Colour: sheet and biro, in the subject's own colours

The sheet dealt white, black, one grey and biro blue. The subject has unmistakable colours of its own (the cyanotype paper the brand is named for, the gold edge of its real cards), so the dealt proportions stay and the colours come from the subject. Recorded here as a palette adjustment, not a redraw.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Ground | `--paper` | `#eef3f8` | the page |
| Ground step | `--paper-deep` | `#e2eaf3` | the stage, inputs, filled bars, the secondary action cell |
| Slip | `--ivory` | `#f8fbfd` | the itinerary slip only |
| Ink | `--ink` | `#123a63` | all running text, headings, the inverted footer ground |
| Soft ink | `--ink-soft` | `#3c6089` | secondary notes only, never a paragraph |
| Accent | `--accent` | `#0c4275` | text links and the one filled button, nothing else |
| On ink | `--on-dark` | `#e8f1fa` | text on `--ink` |
| Suits | `--suit-red`, `--suit-black` | `#8e321f`, `#14110d` | card glyphs only, as a real deck prints them |

Gold leaves the interface. It stays in the card art and the film. Contrast: ink on paper 10.4:1, soft ink on paper 5.8:1, accent on paper 7.9:1, on-dark on ink 9.6:1, on-dark on accent 8.9:1. Surfaces separate by a tone step, never by a line or a shadow at rest.

## Radius, buttons, rules, shadows

- One radius per nesting level: 0 on every interface element; 4.5% of width on a playing card, because a real card is cut that way.
- One filled primary button (accent fill, on-dark text, 48px tall, square, 600). The secondary action is a filled `paper-deep` cell with ink text, the sheet's own action cell. Links are underlined accent text. No outline buttons, no pills.
- No hairlines, no 1px boxes, no grid lines. Tables and form fields keep their own lines. The old 5px ink bar on the header goes; the header is a plain bar.
- No shadow on anything at rest. The readings menu panel floats and may cast one. The card casts one only while it is turning.
- No gradients anywhere, the old foil text included. The one exception the house rules allow, a neutral scrim under text on a photograph, is not used.

## Section blueprints, as built

Homepage, in reading order. Geometry from the sheet, content from the page that exists; every fact, price, link, id and analytics hook carried over.

1. **Hero (split).** Header stays (every page shares it). Right column at 44% of the first screen: the h1 (two lines), one sentence, the birthday form as the primary action, the privacy line. Along the bottom of the first screen the name in lowercase at `--step-display`, starting over the stage's lower-right corner and ending flush with the right margin, `aria-hidden` because the header already names the site. After submit the form leaves and the verdict lands in the same place: the card's name at `--step-head`, two statements, the current 52-day line, then the actions and the Chemistry Check offer.
2. **How a reading happens: itinerary on a slip.** Head at `--step-head` and a 30ch paragraph (the existing "How do I find my birth card?" copy), then the slip on an ink band: stages grouped under "Now" and "If you order a reading", each row a stage on the left and its value on the right with round dot leaders, the last row inverted and stating what you hold at the end. Values are facts the site already states: free, from $13, within 24 hours, seven days of follow-up.
3. **Personal readings: prices like a menu.** Head "Where do you start? Be honest." in the column, then the offers as a menu in two groups ("Just you", "You and them"): name left as the order link, price right on the same baseline in tabular figures, description beneath, what it includes as one line in the soft ink, the sample link where one exists. No leaders, no lines. The stage shows the matching product shot. The follow-up and support lines close the section.
4. **The sample: square plate, spare text (full width, ≥ 88svh).** Left half: the Eight of Diamonds on a square board. Right half: three real tabs (When it works, Pushed too far, Your homework), the title "Something you'll recognize. Something you'll argue with.", the description, and two action cells for the two sample PDFs.
5. **Free: giant word, filled bar rows (full width).** One word, "free", filling a 560px column edge to edge, then filled bars that open in place: the 52 cards, compare two cards, your 52-day period, today's card, birthdays by date, three articles, how Cardology works. Every link from the old "Follow the itch" and "From the journal" sections lives here.
6. **Follow the itch: last picture, text beside (full width).** Left half: the explainer film with its poster, controls and captions. Right half on ink: "Follow the itch.", the paragraph, one paper-filled button back to the birthday field. Adjusted from the sheet's full-bleed photograph because the project's last picture is a film with controls and cannot sit under text.
7. **Footer (shared).** The name returns at full width on ink, then the link groups the site depends on (Free tools, Read, Get, About) in the body face, then the sheet's single quiet line: what this is, the legal links, the year. Adjusted from "no footer block at all" because 25 routes, three tests and the crawl depend on these links.

Other screens take the same parts: the stage with the page's card, the title block (h1 at `--step-head`, one sentence), sections separated by space and tone, the menu of readings where an offer is sold, the quiet line at the end.

## Redraws and adjustments, on the record

- Palette colours taken from the subject (above). Proportions kept.
- Hero: no `mix-blend-mode: difference` on the name (the sheet's own adjustment); solid ink. The sheet's 12px radius becomes 0 (one radius).
- Hero: the header stays above the split. The sheet has none; the site's navigation, skip link and readings menu are shared by 80 routes and three tests.
- Showcase: inactive tabs are `--ink-soft` at full strength, not faded (the sheet's own adjustment).
- List: the giant word is lowercase Archivo, not condensed capitals (the sheet's own adjustment).
- CTA: film in the left half rather than a full-bleed photograph (reason above).
- Footer: link groups kept above the quiet line (reason above).
- Photographs: none of the dealt "Animals" set is used. Every picture is the project's own: the film, the explainer, four product shots, the card faces, the sample report pages.

## Things that never change

- Voice stays anxiety style. Copy changed only where a gate named it; every changed line is listed in the PR.
- The five offers in `lib/readings-nav.ts` and their Stan links, ids and `data-order-reading` hooks. (`main` added the $39 Collector Pack on 2026-11-04 after the brief was written; the retired-offers test pins five, so five stay.)
- No invented metrics, testimonials or counts. The one customer quote the calculator already shows is the owner's material and stays as found.
- Branch and PR only. Nothing here touches Cloudflare, secrets or `main`.
