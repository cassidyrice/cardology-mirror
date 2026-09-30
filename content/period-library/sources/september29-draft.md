# Card Blueprint App: the period reading app (spec, 2026-09-29)

Status: draft for Cass. Nothing here is built. Nothing deploys without Cass saying so.
Repo: `/Users/main/cardology-elroy-qa`. Worker: `/Users/main/cardblueprints-reading`. Voice files: `/Users/main/cardblueprints-ops/card-reading/`.
Every `path:line` below was read on 2026-09-29 against `main @ 3525978`.

## 1. Goal, and what changes from the $69 app

The app becomes one thing: your birth card, your seven 52-day periods this year, and a serious written reading for each period. Free visitors read the first two parts of every period. Paid members read all of it, at $10 a month, $97 a year, or $199 once.

The $69 app shipped in `c2d204e` off sale (`lib/products.ts:410` `CARD_APP_ON_SALE = false`). It has never sold. So there are no buyers to migrate and no old link format to keep.

Removed from the app:

- The ruling card stream. `lib/card-app.ts:557-562` picks the timed ruler, `:317` walks its nine cards, `:592` and `:363` attach it to periods and weeks, `:651` lists identities, `:684-686` builds its year. All gone. `identity.ruling`, `AppPeriod.ruling`, `AppWeek.ruling`, `AppDay.ruling`, `year.ruling`, `AppLifeYear.ruling` leave the model. The `POSITION_COPY.ruling` and `rulingSecond` lines (`:44-45`) go too.
- The karma tab. `MeScreen` (`components/card-app/CardApp.tsx:292-343`) shows karma cards and the Life Spread. Deleted. The two karma cards stay in the model (`lib/card-app.ts:571-574`) because `buildEvents` needs them for gift and challenge days (`:437, :439`) and the reading's brief uses them (see section 4). They are grounding, not a screen.
- Weekly. `buildWeeks` (`lib/card-app.ts:336-366`), `AppWeek` (`:93-104`), `CardApp.week` (`:179-182`), the call at `:598-605`. Deleted.
- Daily. `CardApp.day` (`:183-188`), `dayOn` and `next` (`:609-617`), `AppDay` (`:106-112`), `POSITION_COPY.daily` and `.weekly` (`:55-56`). Deleted. `dailyCard` (`:259-263`) stays because `buildEvents` (`:427`) uses it to find marked days.
- The life view. `CardApp.life` (`:190`), `AppLifeYear` (`:133-141`), the 90-row build at `:627-640`, and the table in `YearScreen` (`CardApp.tsx:215-247`). Deleted.
- People and compatibility. `PeopleScreen` (`CardApp.tsx:462-577`), `SamplePeopleScreen` (`:449-460`), `app/api/card-app/connection/route.ts`, `lib/card-app-connection.ts`. Deleted. The public compatibility calculator is not touched.
- Today. `TodayScreen` (`CardApp.tsx:63-132`) is a daily-card screen. Deleted.

Stays:

- `buildCardApp` (`lib/card-app.ts:544`) as the one model builder, the engine wrappers (`:238-263`), `yearFrame` (`:301-323`), the seven periods (`:577-594`), Long Range with its cycle strip (`:619-625, :675-682`), Pluto and Result (`:673-674`), Environment and Displacement (`:687-688`), `buildSignals` (`:453-524`), `buildEvents` (`:372-449`), `appDateParam` (`:533-538`).
- The token gate at `app/blueprint/page.tsx:37-38, :81-97` and the sign-in error page (`:40-70`).
- `CARD_APP_SLUG = "card-blueprint-app"` and the path `/products/card-blueprint-app` (`lib/card-app-slug.ts:2, :5`).
- `scripts/mint-card-app-link.ts` for preview links.
- The `$13 One Question Reading` stays on sale beside the app, unchanged.

## 2. Screens

Four screens, one bottom tab bar, mobile first. Same phone frame and CSS as today (`CardApp.tsx:651-661`). `ScreenId` (`CardApp.tsx:13`) becomes `"birth" | "year" | "period" | "days"`; `LABELS` and `TABS` (`:579-580`) follow.

### 2.1 Birth card

The birth card from `identity.birth` (`lib/card-app.ts:269-284`): title, core identity, sweet spot, shadow, cost, watch for, lens (balanced, under, over), life direction. This is the `IdentityBlock` already at `CardApp.tsx:261-290` minus the ruling loop. Same for free and paid.

### 2.2 This year

- Year window, `year.startLabel` to `year.endLabel`.
- Long Range with the cycle strip (`year.birth.longRange`, `cycle`, `yearInCycle`).
- Pluto and Result as one row: "What the year asks. What it pays."
- Environment and Displacement when present (fixed cards have none, `lib/card-app.ts:254-257`).
- `year.signals` as short lines.
- The seven periods on a timeline: planet, card, `startLabel` to `endLabel`, the current one marked with `state === "now"` (`:590`). This is `PeriodRow` (`CardApp.tsx:134-151`) minus the ruling line. Tapping a period opens the Period screen for that index.

Same for free and paid.

### 2.3 Period

One period at a time, default the current one, with prev and next controls across the seven. The screen shows the period reading (section 3). Free: line 1, line 2, Do, Don't, "These 52 days.", "How it lands on you.", then a paywall block in place of `(free preview ends here)` with the three prices and one line: "The rest of this period, and every period, for members." Paid: the whole text.

States: `ready` (text), `writing` (a plain line: "Your Saturn reading is being written. About a minute." and a poll every 5 seconds against `GET /api/card-app/period`), `review` (first 20 only, see 4.6: "This reading is being checked by hand. We email you when it is up.").

### 2.4 Marked days

`buildEvents` output (`lib/card-app.ts:372-449`), grouped by month like `DaysScreen` today (`CardApp.tsx:345-387`), filtered to the current year window, each row linking to its period's screen. Free and paid both see the dates and the one-line `detail` the engine already writes (`:434-441`). Only the paid Period screen gets the written "Marked days." part.

`buildEvents` today only looks forward from today for 365 days (`:370, :383-384`). Add a `window: { start: Date; end: Date }` argument, default today to today plus 364 days for this screen, and pass the period's own `start` and `end` when rendering a Period screen, so a period that has already begun still lists its whole run of marked days.

### 2.5 Free visitor versus paid

| | Free | Paid |
|---|---|---|
| Birth card | full | full |
| This year | full | full |
| Period | top plus first two parts | all seven parts |
| Marked days | engine dates and one-liners | same, plus the written part inside each period |
| How you get in | type a birthdate on the product page, get a 30-day free link | emailed link after checkout |

## 3. The period reading

### 3.1 What a period reading is

One piece of plain text for one person for one 52-day period. Two registers stacked: a Co-Star top (sharp, short, screenshot-able) over a The Pattern body (long, second person, psychological, specific to this exact person). Serious writing. A mirror, not a forecast. The reader finishes thinking "I already knew that" and then, over the next weeks, notices the exact things it told them to watch for.

### 3.2 Exact shape

Plain text, no markdown anywhere, label lines on their own line, paragraph starts on the next line.

Line 1: "Saturn period. Sep 13 to Nov 3. Jack of Spades."
Line 2: one sentence that holds the whole period. Screenshot-able. Under 18 words.
Then the label "Do." followed by three short lines (each under 10 words, one per line, no bullets, no dashes).
Then the label "Don't." followed by three short lines, same rules.

Then six labelled parts:

These 52 days.
The period card read through the planet. Number first (what a Jack does), then suit (Spades: work, health, the body, transformation), then Saturn as the lens (the bill chapter: structure, discipline, what you owe; it pulls the hard side of a card out). What these days keep putting in front of the person. 250 to 350 words.

How it lands on you.
The birth card meeting the period card. 8 of Diamonds (Eight: power, mastery, control. Diamonds: money, worth, what a thing is worth to you) under a Saturn Jack of Spades. Describe under and over as behavior a stranger could watch, each with its price. End with the check-in: which one has been in the room lately. 300 to 400 words.

(free preview ends here)
Put that exact line, on its own line, after "How it lands on you." Parts above it are the free version. Parts below are paid.

Where it sits in the year.
Long Range card (Queen of Spades, and it is an ECHO: also the card this person owes, so the lesson is not new). Pluto and Result read as one sentence: what the year asks (3 of Diamonds) and what it pays (King of Diamonds). Then how this specific Saturn period advances or tests that. 300 to 400 words.

The warning.
The one exact way this period goes wrong for an 8 of Diamonds under a Saturn Jack of Spades. A habit with a price, never a character defect. What Saturn collects on. Cautious, steady, no fear-mongering. 200 to 300 words.

Marked days.
Every engine-marked date inside the period that appears in the brief, in date order: the date, the card that day, what that day tends to bring for this person, what to do on it, and one signal they could tick off. Never invent a date. Never invent a card. 250 to 400 words.

Carry this.
One question to hold until the period ends, then one closing line short enough to screenshot. 40 to 90 words.

Total 1,500 to 2,100 words. The free part (top plus first two parts) about 600 to 800 words.

### 3.3 How the shape meets the cache (read this before section 4)

Line 1 carries dates. "Marked days." carries dates. Dates depend on the birthdate, not on the birth card. The reading is cached per birth card and age (section 4.1), so the stored text cannot hold a date.

So two parts are assembled at render time, not written by the model:

- Line 1 is built by the renderer from `AppPeriod.planet`, `startLabel`, `endLabel`, `birth.card.name` (`lib/card-app.ts:580-591`). The writer never writes it. The stored text starts at line 2.
- "Marked days." is written per kind, not per date. `buildEvents` has eight daily kinds (`lib/card-app.ts:434-441`: Result card day, Support card day, Jupiter card day, Gift card day, Ruling card day, Challenge card day, Saturn card day, Pluto card day) plus the period-start turn (`:399-408`) and the Jupiter window (`:409-419`). Ruling goes away with the ruling stream. For each remaining kind the card is a function of birth card and age (`f.birth9[i]`, `f.environment`, `lifetime.gift`, `lifetime.challenge`). The brief lists each kind with its card. The writer writes one block per kind: the card, what that day tends to bring for this person, what to do on it, one tickable signal. Under 60 words each. The renderer takes `buildEvents` for the period, sorts by date, and prints "Oct 4. Result card day, King of Diamonds." followed by the block for that kind. A kind with no date in this person's period is not printed. The lint checks the stored text carries no month name, no weekday, no four-digit year.

This is a deviation from the literal brief text ("Every engine-marked date inside the period that appears in the brief"). It follows from the cache decision in section 4. Cass decides in section 11, Q1.

### 3.4 Voice

`READING_VOICE.md` applies in full (`/Users/main/cardblueprints-ops/card-reading/READING_VOICE.md:107-152`). These are the parts people get wrong:

Second person, present tense. Sentences average 8 to 14 words; vary them. Plain words a seventh grader reads once. Name every card by number and suit and say what the number and suit mean the first time it appears. Tendencies, never predictions: "tends to", "keeps showing up as", "when it works", "when it slips". Never "you will" about an event. Never "expect". Clean mirror: observable behavior, then its cost. Make it their idea: describe the pattern so precisely they nod before you interpret it; stop one sentence early and ask the question with one obvious answer. "You already know" at most once in the whole piece.

No em dashes, no en dashes (the site copy quoted in the brief contains em dashes, `lib/year-copy.ts:24-49` for instance; do not copy them). No exclamation points. No bullets, headers, bold, asterisks. No disclaimers. No mystic words (universe, energy, vibration, manifest, destiny, fate, journey, sacred, divine, meant to be, alignment, cosmos). No textbook words (framework, deterministic, practitioner, reproducible). No filler (genuinely, honestly, truly, really, ultimately). No health diagnosis, legal or financial advice. Never predict a death, pregnancy or breakup.

AI slop to refuse: "It's not X, it's Y" constructions; reflexive triplets; a closing paragraph that summarizes; "embrace", "navigate", "landscape", "delve", "tapestry", "unlock", "harness", "step into", "lean into", "powerful", "profound", "resonate", "authentic", "intentional", "hold space", "show up" (more than once), "at the end of the day", "the truth is", "here's the thing". Every paragraph the same length. Abstract nouns where a concrete one exists: write invoices, a client text, a spreadsheet, a dentist appointment, a price on a page, a reply you drafted and deleted. Nothing that could be pasted into another person's reading unchanged.

### 3.5 The review gate

Section 4.6. Short version: the first 20 readings are read and approved by Cass before anyone but Cass sees the paid parts. After that, the lint is the gate.

## 4. Generation and caching

### 4.1 The key fact

A period reading depends on the birth card, the age, and the period index. Nothing else.

- Period cards: `walk(bc, mod90(age + 1), 9)` (`lib/card-app.ts:305, :316`).
- Long Range: `longRangeFor(bc, age)` (`:248-252`).
- Pluto and Result: `birth9[7]`, `birth9[8]` (`:673-674`).
- Environment and Displacement: `yearKarmaFor(bc, age)` (`:254-257`).
- Lifetime karma: `getEnvironmentDisplacement(bc, 1)` (`:573`).
- Echoes: `calculate_blueprint.py:334` compares those same cards.

Only the dates and the marked-day dates differ per birthdate (`yearFrame` at `:302-309`, `dailyCard` at `:259-263` from weeks lived). Those come from the engine at render time (section 3.3).

Cache key: `period:v1:<card>:<age>:<index>`, card in ASCII (`8D`, `QS`, `10H`), age as `mod90(age)` (`:238, :623`, ages 90 and up wrap like the rest of the app), index 0 to 6.

Space: 52 cards, 90 ages, 7 periods. 52 × 90 × 7 = 32,760 readings. Generated lazily on first request, never all at once.

### 4.2 Storage

The existing `READINGS` KV namespace, binding in `wrangler.toml:25-28` (id `468369b7e1ae4380a111efbe50dd253c`). Today the site only reads it, for readings saved before D1 (`lib/reading-service.ts:28-34`; the comment at `wrangler.toml:25` says read-only). Writing period readings to it under the new `period:` prefix does not touch the `reading:` keys (`reading-service.ts:27`).

Value: JSON `{ text, words, lint, model, status: "published" | "draft", createdAt, approvedAt? }`. No TTL. Once `status` is `published` the key is never regenerated. A `draft` is one that failed lint or is inside the first-20 gate.

Two viewers asking for the same missing key at the same second both call the Worker. KV cannot claim a key atomically. Both results pass the same lint; the last write wins. The cost is one wasted call, about ten cents. Accept it. If the growth report shows duplicates piling up, move the claim to D1 the way `lib/reading-fulfill.ts:38-52` does it. Not before.

### 4.3 Read path

`GET /api/card-app/period?token=<t>&index=<0..6>`. Verify the token (report token or membership token, section 5.4). Build `buildCardApp(payload.birthdate)` to get the card, the age, the period. Look up the key. Hit: return `{ status, text }` with `text` cut at `(free preview ends here)` for a free token. Miss: write `{ status: "writing" }` to the key, call the Worker in period mode, store the result, return it. The Worker takes up to 120 seconds (`lib/reading-writer.ts:33`), so the Period screen shows the `writing` state and polls. The `/blueprint` page itself (`app/blueprint/page.tsx:81-97`) never awaits the Worker; it renders the four screens and the Period screen fetches.

On purchase, the webhook (section 5.3) fetches the current period once before it sends the welcome email, the way it already awaits `deliverReading` for the $13 reading (`app/api/checkout/webhook/route.ts:136-141`). The buyer's first tap is a hit. The other six periods are lazy.

### 4.4 Pipeline: the Worker's period mode

`/Users/main/cardblueprints-reading/src/entry.py` takes `{ birthday, question, on? }` (`entry.py:3-5, :62-67`) and builds the one-question brief (`reading_brief.py:85`). Add `mode: "period"`:

Request: `{ mode: "period", birthday, on, passage }`. `on` is the period's start date, so `calculate_blueprint.active_period` (`calculate_blueprint.py:199`) lands on the right period. `passage` is the 364-library text for card × planet (4.5), sent by the site because the Worker does not hold the JSON.

Brief: `build_period_brief(month, day, year, on, passage)` in `reading_brief.py`, reusing `_card_block` (`:65-82`) for the birth card, the period card, Long Range with its ECHO line (`:117-126`), Pluto and Result (`:129-141`), the two karma cards (`:144-160`), plus:

- The period: planet, index, card, and `PLANET_SLOT[planet]` (`:40-48`) as the lens. No dates. Say "day 1 to day 52", never the calendar.
- The passage, labelled "Grounding for These 52 days. Use its reading of the card through the planet; do not copy its sentences."
- Marked-day kinds (section 3.3): for each of the seven kinds, the card and its one-line meaning taken from the strings at `lib/card-app.ts:434-441`. Environment, gift and challenge kinds are omitted for fixed cards.
- The shape from 3.2 verbatim, with the instruction that line 1 is not written and that no date, month, weekday or year appears anywhere.

Strip from the period brief: the year window line (`reading_brief.py:96`), the period date lists (`:170-172`). Both leak dates.

Voice: `VOICE` (`voice_text.py`, generated from `READING_VOICE.md`) as the system prompt, followed by a period section. Add `READING_VOICE_PERIOD.md` beside `READING_VOICE.md` in `card-reading/`, containing 3.1, 3.2 and 3.4 of this spec, and generate `voice_period_text.py` from it the same way. `WRITE_NOW` (`entry.py:25`) gets a period variant: "Write the period reading now. 1,500 to 2,100 words. Start at line 2."

Model: `DEFAULT_MODEL` (`entry.py:23`) stays `anthropic/claude-sonnet-4.5` for the first sample. If the sample reads flat, try the next Sonnet or Opus through the same `READING_MODEL` override and let Cass pick by reading, not by price. `max_tokens` 1800 (`entry.py:37`) is too small for 2,100 words; period mode uses 4000.

Lint: `lint_period(text)` in `lint_reading.py` (the ops copy and the Worker copy are identical today; keep them identical). It runs `lint()` minus the 450 to 750 length check (`lint_reading.py:29-30`), then:

- Line 1 of the stored text is under 18 words and ends in a period.
- "Do." then exactly three lines under 10 words, "Don't." then exactly three, none starting with a bullet or dash.
- The six labels present, once each, in order: "These 52 days.", "How it lands on you.", "Where it sits in the year.", "The warning.", "Marked days.", "Carry this."
- "(free preview ends here)" present exactly once, on its own line, between the second and third part.
- Per-part word counts inside the ranges in 3.2 (Marked days is checked per block, under 60 each, and the part total 250 to 400).
- Total 1,500 to 2,100 words.
- No month name, no weekday name, no `\b(19|20)\d\d\b`.
- The slop list from 3.4 as banned phrases; "show up" more than once and "you already know" more than once are hard failures here, not warnings.
- Every card named in the brief's period, Long Range, Pluto, Result and karma slots is named at least once by full name ("Jack of Spades"). A card name not in the brief is a hard failure (never invent a card).

One correction pass, exactly as `entry.py:76-80` does it. If the second draft still fails a hard rule, the Worker returns `clean: false` and the site stores it as `draft` and emails Cass (4.6).

### 4.5 The 364-passage library

`lib/year-copy.ts` holds one light, shadow and dare line per card (`:53`, 52 entries) and one frame and pressure line per planet (`:22-51`). `lib/period-meanings.ts` holds seven planet filters (`:61`) and a template that pastes a card's sweet spot into a planet sentence (`:174-200`). Neither has a hand-written card × planet layer. The period reading needs one: 52 × 7 = 364 short passages, one per card through one planet, each 120 to 180 words, the traditional reading in the house voice.

Build: `scripts/generate-period-passages.ts` calls the Worker in a third mode, `passage`, with `{ mode: "passage", card, planet }`. The Worker builds a brief from `_card_block(card)` and `PLANET_SLOT[planet]`, writes 120 to 180 words, lints with `lint()` minus length. The script writes `lib/period-passages.json`: `{ "8D|Saturn": { "text": "...", "approved": false }, ... }`. Cass edits the JSON by hand and flips `approved`. `scripts/period-passages.test.ts` pins: 364 keys, every card, every planet, every text lints clean, every `approved` true before `CARD_APP_ON_SALE` can be true.

Cost: 364 × about 1,500 input tokens × $3 per million plus 250 output tokens × $15 per million is about $0.01 each, under $5 for the set. Regenerating a single passage is `bun scripts/generate-period-passages.ts 8D Saturn`.

### 4.6 Review gate

Pages env `PERIOD_AUTO_PUBLISH`, set with `npx wrangler pages secret put PERIOD_AUTO_PUBLISH --project-name cardology-mirror`, value `0` at launch.

While `0`: every new reading is stored as `draft`. The site emails `INTAKE_EMAIL` the full text with the key, the lint output and a paste-ready line: `bun scripts/publish-period-reading.ts period:v1:8D:37:4`. That script flips `status` to `published` through `npx wrangler kv key put --namespace-id 468369b7e1ae4380a111efbe50dd253c`. The buyer's Period screen shows the `review` state until then. Cass reads the first 20 this way.

After Cass flips `PERIOD_AUTO_PUBLISH` to `1`: a clean lint publishes at once. A hard lint failure after the correction pass, or a missing part, stores `draft`, emails Cass the same message, and the buyer sees `review`. Nothing with a lint failure is ever shown.

### 4.7 Cost

Per reading, at Sonnet rates ($3 per million in, $15 per million out): brief about 3,000 tokens, voice about 3,000, period voice about 1,500, passage 250, total about 7,800 in, about $0.023. Output 2,100 words, about 2,900 tokens, about $0.044. One pass about $0.07. With the correction pass about $0.14.

Worst cases:

- Every key ever generated: 32,760 × $0.14 = about $4,600, spread over years, most of it never reached (ages 0 to 12 and 80 to 89 almost never ask).
- One year of a busy site: a member triggers at most 7 new keys a year; 1,000 members with spread-out birthdays touch at most 52 cards × about 45 common ages × 7 = 16,380 keys, but shared, so the real count is far lower. Budget $2,300 as the ceiling for year one, $200 as the likely figure.
- Free visitors trigger the same generation (the free part is the first 600 to 800 words of the same text). Rate-limit the free token route (section 5.5) with `rateLimit` (`lib/rate-limit.ts:36`) and cap generation at 200 new keys a day with a KV counter key `period:budget:<YYYY-MM-DD>`. Past the cap the Period screen says "Being written. Check back tomorrow." and Cass gets one email.

## 5. Pricing and access

### 5.1 Prices

$10 a month, $97 a year, $199 lifetime. Stripe account Card Blueprint (`acct_1U1a1dChx1yAVyrs`) only. Three new Stripe prices on one Stripe product "Card Blueprint App".

Pages secrets, each set only with `npx wrangler pages secret put NAME --project-name cardology-mirror`, one at a time, then redeploy:

- `STRIPE_PRICE_CARD_APP_MONTHLY`
- `STRIPE_PRICE_CARD_APP_YEARLY`
- `STRIPE_PRICE_CARD_BLUEPRINT_APP` (exists already in the union at `lib/products.ts:35` and on the product record at `:418`; it may hold a $69 price id; re-put it with the $199 lifetime price id)

Add the two new names to `StripePriceEnv` (`lib/products.ts:23-35`).

### 5.2 Product records

Three records, one `reportSlug`, `CARD_APP_SLUG` for all three, so one token gate serves all three:

- `card-blueprint-app` (lifetime): the existing `CARD_APP_PRODUCT` (`lib/products.ts:415-445`), `kind: "instant_report"`, price 199, `priceLabel: "$199"`, `linkDays: LIFETIME_LINK_DAYS` (`:413`), new copy (section 6).
- `card-blueprint-app-monthly`: `kind: "membership"`, `billingPeriod: "month"`, price 10, `priceLabel: "$10/mo"`.
- `card-blueprint-app-yearly`: `kind: "membership"`, `billingPeriod: "year"`, price 97, `priceLabel: "$97/yr"`. Widen `MembershipOffer.billingPeriod` (`:82`) to `"month" | "year"`.

All three in `ALL_PRODUCTS` (`:447-454`). `checkoutProductBySlug` (`:492-498`) returns any of the three only when `CARD_APP_ON_SALE` is true. `PUBLIC_PRODUCTS` (`:461-464`) stays as is until the flag flips; when it flips, the three join it and `scripts/validate-public-truth.ts:169-177` pins the new list. `instantReportFacts` (`:525-547`) gets a yearly branch for the Renewal line: "Renews yearly. Cancel anytime from the link in any email from us."

### 5.3 Checkout

`app/checkout/[offer]/session/route.ts` already opens subscription mode for `isMembership(product)` (`:241, :247-266`) and payment mode otherwise (`:267-288`). Metadata already carries `report_slug` and `birthdate` for both kinds (`:213-215, :222-224`) and copies them onto the subscription (`:253`). So:

- Monthly and yearly: subscription mode, no route change.
- Lifetime: payment mode, no route change.
- One change: the future-date and Joker checks at `:167` and `:172` test `isInstantReport(product)` only. Make them test `(isInstantReport(product) || isMembership(product)) && product.reportSlug === CARD_APP_SLUG` so a December 31 birthday is refused before a subscription starts too. `DATE_CHECKED_REPORTS` (`:39`) stays.
- The review page `app/checkout/[offer]/page.tsx:53-54` already treats membership like a report (`needsBirthdate` at `:193`). `isApp` at `:54` widens the same way so the copy says app, not report.
- The product page gets three buttons, one per slug, through `ReportCheckoutButton` (`components/checkout/ReportCheckoutButton.tsx:23-49`, it already takes `slug`).

### 5.4 Access

Lifetime: the webhook's instant-report branch (`app/api/checkout/webhook/route.ts:426-525`) already mints a report token with `product.linkDays` (`:436-442`) and emails `/blueprint?token=` (`:443, :461-468`). No change beyond copy.

Monthly and yearly: the membership branch (`:355-424`) mints a membership token (`:368-373`) and emails `/membership?token=` (`:374`). There is no `/membership` route in `app/`. Change:

- URL: when `product.reportSlug === CARD_APP_SLUG`, the link is `${SITE_URL}/blueprint?token=`.
- TTL: `mintMembershipToken` defaults to 35 days (`lib/membership-token.ts:9, :36`). Pass 35 for monthly and 400 for yearly.
- `app/blueprint/page.tsx:38` verifies report tokens only. Make it `const payload = (await verifyReportToken(token)) ?? (await verifyMembershipToken(token));`. Both payloads carry `slug` and `birthdate` (`lib/report-token.ts:20-27`, `lib/membership-token.ts:22-29`). The CardApp branch at `:81` then serves both. `GET /api/card-app/period` does the same.
- Renewal: `invoice.paid` (`webhook/route.ts:600-638`) re-mints on `billing_reason === "subscription_cycle"` (`:607`) using `meta.report_slug` (`:612`). Pass the TTL by plan (read `invoice.lines.data[0].price.recurring.interval`, `month` or `year`) and switch the URL on `reportSlug === CARD_APP_SLUG` the same way. Subject: "Your Card Blueprint App renewed."
- Add `customer.subscription.deleted`: no re-mint. Email the buyer: "Your membership ended. Your link works until <exp of last token>, then the free version keeps working at the product page." Email Cass one line.
- Add `invoice.payment_failed`: email the buyer with the portal link (5.5) and "Update your card to keep the full readings. Your current link works until <date>." Do not re-mint.
- The live Stripe endpoint `we_1UCItcChx1yAVyrs9UZVthQj` sends exactly `checkout.session.completed` and `checkout.session.async_payment_succeeded` today (`~/cardblueprints-ops/STATE.md`, Fulfillment cleanup release). `invoice.paid`, `customer.subscription.deleted` and `invoice.payment_failed` must be added to `enabled_events` on that endpoint, in the Stripe dashboard or API, on the Card Blueprint account. Cass does this, or approves the API call. The `invoice.paid` handler at `:600` has never received a live event.

### 5.5 Cancel: the portal link

No code in the repo calls the Stripe customer portal today. Add `GET /api/billing-portal?token=<membership token>`: verify with `verifyMembershipToken`, `getStripe().subscriptions.retrieve(payload.subscriptionId)` for the `customer` id, `getStripe().billingPortal.sessions.create({ customer, return_url: SITE_URL + CARD_APP_PRODUCT_PATH })`, 303 to `session.url`. Portal sessions expire in minutes, so the email carries the site route, not a portal URL. Every subscriber email (welcome, renewal, payment failed) ends with: "Cancel or change your plan any time: <SITE_URL>/api/billing-portal?token=<token>". The portal itself is switched on once in the Stripe dashboard (Settings, Billing, Customer portal) on the Card Blueprint account. That is a Stripe setting, not a Pages environment variable, so the dashboard rule in CLAUDE.md does not apply. The portal must allow cancel and payment-method update and nothing else.

### 5.6 Free tier

No login, no account. The product page has a birthdate field (`<input type="date">`, the one already in `components/checkout/CheckoutContinueForm.tsx:131`) that posts to `POST /api/card-app/free`. The route sanitizes the date (`sanitizeBirthdateISO`), refuses December 31 and future dates, rate-limits with `rateLimit(rateLimitKey(req, "card-app-free"), { limit: 10, windowMs: 600_000 })`, mints `mintReportToken("free@cardblueprints.com", "card-blueprint-app-free", "free", birthdate, 30)` and 303s to `/blueprint?token=`. The birthdate never sits in a URL.

`app/blueprint/page.tsx` treats slug `card-blueprint-app-free` like `CARD_APP_SLUG` with `tier: "free"`. `CardAppView` takes `tier` and cuts the Period screen at the preview line. The token lasts 30 days; the page tells them to add it to the home screen and that a paid plan gives them a permanent link. `scripts/mint-card-app-link.ts:16` keeps minting the paid slug for previews.

### 5.7 Emails

- Lifetime buyer: "Your Card Blueprint App is ready" (existing subject at `webhook/route.ts:457`), the `/blueprint` link, "yours for life", my-purchases link (`:464`).
- Monthly and yearly buyer: "Your Card Blueprint App is active", the link, "we send you a fresh link each time the plan renews; keep the latest", the portal line.
- Renewal: "Your Card Blueprint App renewed", fresh link, portal line.
- Payment failed: as in 5.4.
- Ended: as in 5.4.
- Cass, every sale: the existing intake email (`:494-519` for lifetime, `:404-418` for membership) with `Type: card app (lifetime | monthly | yearly)` and the key of the first reading generated.

## 6. Public copy and SEO surfaces

Keep `/products/card-blueprint-app` (`lib/card-app-slug.ts:5`). No slug change, so no new 301. The old `$69` copy has never been indexed (`robots: { index: false }` while off sale, `app/products/card-blueprint-app/page.tsx:34`).

Change:

- `lib/products.ts:415-445`: name stays "Card Blueprint App". `oneLine`: "Your birth card, your seven 52-day periods this year, and a serious written reading for each one." `includes`: the four screens, the free part, the paid part, the three plans. Drop the daily, weekly, karma, compatibility and ages 0 to 89 lines (`:431-437`). `cta` per plan. `checkoutNote` per plan.
- `app/products/card-blueprint-app/page.tsx`: `TITLE` (`:24`) "Card Blueprint App: your 52-day periods, read", under 60 characters; `DESCRIPTION` (`:25-26`) under 155; hero (`:118-130`); the three buy buttons in `BuyBlock` (`:217-235`); the sample (`:140`) shows the free tier for the made-up birthday `1988-07-14` (`:21`) with the Period screen open on the current period; "Where the cards come from" (`:162-181`) loses the compatibility sentence; "What it is not" (`:183-190`) stays.
- FAQ (`:51-84`): rewrite Q1 "Is it a subscription?" (monthly and yearly renew, lifetime does not, cancel from the link in any email); Q2 "Do I need an account?" (no, a link); Q3 change cadence (seven readings a year, a new set every birthday); drop Q4 (People); Q5 "Is any of it written by AI?" must now say yes: "The cards are fixed math, the same as the free calculator. The readings are written by a model from those cards in our house voice, checked by a lint on every line, and the first ones were read by hand. The same birth card at the same age gets the same reading." Q6 mirror stays; Q7 Joker stays; Q8 versus the $13 reading: "The $13 reading answers one question you type. The app reads every 52-day period of your year, and keeps going."
- OG image: `public/og/products/card-blueprint-app.png` was committed as a binary in `c2d204e`; `scripts/generate_page_og_images.py:202-231` has no entry for it. Add the entry so it regenerates with the new subtitle, and run the generator.
- `public/llms.txt:3, :7, :12` and `public/.well-known/agent-card.json:4, :32, :44` say the only paid product is the $13 reading and "no subscription". When the flag flips, add the app as a second paid product with its three prices and keep the $13 reading as the next step after the calculator. `scripts/agent-card.test.ts:101` still passes.
- `scripts/validate-public-truth.ts:169-177` pins `PUBLIC_PRODUCTS`; add the three slugs when the flag flips. `:178-180` (retired `cardology-membership` must not open checkout) stays true.
- `app/faq/page.tsx` (listed in `validate-public-truth.ts:213`): one entry for the app.
- `.claude/commands/polish.md` still says "$47 One Question Reading"; fix to $13 while in there.

## 7. Rules this changes in CLAUDE.md

All on `CLAUDE.md:9`. Each quoted line, then the replacement.

Quoted: "**One product for sale: the $13 One Question Reading**"
Replace: "**Two products for sale: the $13 One Question Reading and the Card Blueprint App ($10/month, $97/year, $199 lifetime; period readings, spec `~/cardblueprints-ops/plans/period-reading-app-2026-09-29.md`).** The reading is the next step after the calculator. The app is the second offer, never the first CTA on an informational page."

Quoted: "no login, no PDFs, no video"
Replace: "no login, no PDFs, no video for the reading; the app is a signed link too, no account, no password."

Quoted: "Do not resurrect $9/$17/$19/$27/$47/membership CTAs."
Replace: "Do not resurrect $9/$17/$19/$27/$47/$69 CTAs or the retired `cardology-membership`. The only recurring offers are the app's monthly and yearly plans."

Quoted: "nothing is generated on the site."
Replace: "the $13 reading is written by the `cardology-reading` Worker on `checkout.session.completed` (see STATE.md 2026-09-19), and the app's period readings are written by the same Worker in period mode, cached per birth card, age and period, linted, and never regenerated once published. No other copy on the site is generated." (The quoted line is already stale: the 2026-09-19 release moved the reading to the Worker and changed "2 business days" to "about a minute" across the site. Fix "emailed within 2 business days" in the same edit.)

Unchanged and said plainly: the $13 One Question Reading stays on sale beside the app. Past buyers' fulfilment stays intact: the $19 52xSeven year app at `/blueprint?token=` (`app/blueprint/page.tsx:100-116`), the legacy Personal Card Blueprint (`:118-144`), the retired `cardology-membership` record (`lib/products.ts:372-401`) and the PDFs.

## 8. Tests

Unit (`bun test`):

- Cache key: `periodKey("8♦", 37, 4) === "period:v1:8D:37:4"`; ages 90 and 127 map to the same key as 0 and 37; `10♥` becomes `10H`.
- Same reading for two birthdates with the same card and age: `buildCardApp("1988-07-14")` and a second July 14 birthday one 90-year cycle apart, plus a different date that maps to the same birth card at the same age, produce the same key for the same period and different line 1.
- Free and paid split: `splitPeriodText(text)` returns the top and the first two parts for free, the whole for paid; a text without the marker throws.
- Per-part lint: a fixture reading passes `lint_period`; fixtures that break each rule in 4.4 fail with the named rule (run with `python3` from `scripts/period-lint.test.ts` the way `bun run test:fulfillment` shells out today).
- Dates injection: `renderPeriod(app, index, stored)` produces line 1 from the engine, prints marked-day blocks in date order for the kinds that occur, prints none for a kind absent from the period, and the stored text contains no month, weekday or year.
- Token gating: report token with `CARD_APP_SLUG` gets paid; membership token with `CARD_APP_SLUG` gets paid; report token with `card-blueprint-app-free` gets free; expired membership token gets the sign-in error; a `blueprint-report` token gets neither.
- Webhook: `checkout.session.completed` for each of the three slugs mints the right token kind and TTL (35, 400, lifetime) and links `/blueprint`; `invoice.paid` with `subscription_cycle` re-mints by interval; `customer.subscription.deleted` sends the ended email and mints nothing; `invoice.payment_failed` sends the portal email and mints nothing. Build these beside the existing webhook tests in `bun run test:fulfillment`.
- Products: `checkoutProductBySlug` returns none of the three while the flag is off; `CARD_APP_PRODUCT.price === 199`; monthly 10; yearly 97; all three `reportSlug === CARD_APP_SLUG`.
- Passages: `scripts/period-passages.test.ts` as in 4.5.

`scripts/card-app.test.ts` changes:

- Delete `ruling card equal to the birth card` (`:69-97`), `compatibility` (`:291-306`), `POST /api/card-app/connection` (`:331-360`), `the seven weekly sub-periods tile` (`:183-195`), `every year of life is present` (`:210-218`), `the Today screen's 'Coming up' tile` (`:167-180`).
- `daily card follows getWeekly` (`:119-145`) reads `data.day`; rewrite it against `buildEvents` output so the engine parity check survives the model cut.
- `product` (`:308-327`) becomes the three-plan test above.
- `product page` (`:362-401`): drop `"Your card today"` (`:369`) and the compatibility link (`:371`); add: the free sample shows `(free preview ends here)` rendered as a paywall block, and three price labels appear when `CARD_APP_ON_SALE`.
- Keep `parity with the shipped reading` (`:26`), `parity with the 52xSeven year model` (`:99`), `good days` (`:147-165`), `fixed cards carry no karma cards` (`:220`), `lifetime buyers past 89` (`:234`), `Environment = Displacement is one seat` (`:244`), `Long Range strip` (`:271`), the Joker and before-birth refusals (`:282-289`).

Playwright (`bun run test:seo:browser` pattern, `scripts/seo-integrity-browser.ts`, new `scripts/card-app-paywall-browser.ts`):

- At 390px on `/products/card-blueprint-app`: one H1, the birthdate form, three prices when on sale, "Opening soon" when off.
- Submit the sample birthdate, land on `/blueprint?token=`, tap Period: the text ends at the paywall block and the paid labels ("Where it sits in the year.") are absent from the DOM, not hidden.
- With a minted paid link (`scripts/mint-card-app-link.ts`): the six labels present, "Marked days." lines carry dates that match the Marked days screen.
- No horizontal overflow on any of the four screens.

Existing gates before "done": `bun run test`, `bun run test:seo:browser`, `/checkout-check` for all three slugs.

## 9. Rollout order

Each step ends with Cass saying yes. Nothing deploys without Cass saying so.

1. Spec approved. Cass answers section 11. Gate: "y" on this file.
2. Sample reading approved. Hand-run the period brief and voice through `card-reading/` for one card, age and period (the 8 of Diamonds, Saturn, from the shape above, plus one Hearts card in Venus). Cass reads both. Gate: Cass approves the voice, or edits `READING_VOICE_PERIOD.md` and we rerun.
3. 364 library. Run `generate-period-passages.ts`, Cass edits, `approved` flips. Gate: `period-passages.test.ts` green and Cass says the set is his.
4. Worker period mode. `entry.py`, `reading_brief.py`, `lint_reading.py`, `voice_period_text.py`. Deploy the Worker (`npx wrangler deploy` from `~/cardblueprints-reading`, its own version and rollback recorded in STATE.md). Smoke: one live period call, clean lint. Gate: Cass says deploy the Worker.
5. App UI and read path behind `CARD_APP_ON_SALE = false`. Model cut, four screens, `/api/card-app/period`, `/api/card-app/free`, KV writes, review-gate email, `PERIOD_AUTO_PUBLISH=0`. Deploy the site. The product page still says "Opening soon"; the free sample works. Gate: `bun run test` green, Playwright green, Cass says ship.
6. Stripe prices and secrets. Three prices on the Card Blueprint account, three `wrangler pages secret put`, webhook `enabled_events` extended, portal switched on. Redeploy. Gate: Cass does or approves each Stripe change.
7. `/checkout-check` for the three slugs with the flag still off (sessions open through `checkoutProductBySlug` only when on; test with a temporary local override, never in production). Then the first 20 readings hand-approved through the review gate using preview links. Gate: 20 published.
8. Flag flip. `CARD_APP_ON_SALE = true`, `PUBLIC_PRODUCTS`, `validate-public-truth.ts`, `llms.txt`, `agent-card.json`, FAQ, robots, JSON-LD, OG. One commit. Deploy. `bash scripts/record-deploy.sh`. Gate: Cass says "ship". After launch, `PERIOD_AUTO_PUBLISH=1` is a separate yes.

## 10. What is not changing

- The $13 One Question Reading: product, price, path, checkout, Worker mode, D1 fulfilment, emails.
- Stripe account, webhook endpoint URL, `STRIPE_PRICE_BLUEPRINT_BREAKDOWN`.
- The engine (`lib/engine-core/engine.js`), the spread conventions in `lib/card-app.ts:7-12`, `card-bible.json`, `year-copy.ts`, `period-meanings.ts` (they stay as grounding and for the retired year app).
- The free calculator, the compatibility calculator, `/born-on`, `/compatibility`, the blog, the Worker for those.
- Past buyers: 52xSeven links, Personal Card Blueprint links, Blueprint Report, PDFs, the retired membership record.
- `READING_VOICE.md` and `lint_reading.py` for the one-question reading. Period mode adds beside them, changes nothing in them.
- The deploy rules: `bun run pages:deploy` from a clean `main`, `record-deploy.sh`, never `ALLOW_DIRTY=1`, never the dashboard for Pages variables.

## 11. Open questions for Cass

1. Marked days: write per kind and stamp dates at render (3.3), or drop the cache and write per person at about $1 a member a year? Default: per kind, cached.
2. Reuse `STRIPE_PRICE_CARD_BLUEPRINT_APP` for the $199 lifetime id, or a fresh `STRIPE_PRICE_CARD_APP_LIFETIME`? Default: reuse.
3. Free link life: 30 days, then type the birthdate again? Default: 30 days.
4. Daily generation cap for free visitors: 200 new readings a day? Default: 200, raise after the first growth report.
5. Model for the first sample: stay on `anthropic/claude-sonnet-4.5`, or compare two models on the same brief and pick by reading? Default: compare two, Cass picks blind.
6. Should the paid Period screen offer a plain-text copy button so the reading can be shared as text? Default: yes, paid only.
7. Yearly plan token: one 400-day link, or a fresh link every 35 days like monthly? Default: one 400-day link.
8. Portal scope: cancel and update card only, or also allow switching monthly to yearly? Default: cancel and update card only.
