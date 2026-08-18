# HANDOFF — ChatGPT SOL
## Reimagine cardblueprints.com as the 52-Day Season (keep SEO)

**From:** Cass (via Grok), 2026-08-18  
**To:** ChatGPT SOL — implement this. Do not reopen product strategy.  
**Status:** Locked. Build in slices. Do not deploy until Cass says so.

---

## 0. Your job in one paragraph

Rebuild **cardblueprints.com** so the public product is the Kimi **52-Day Season** experience (celestial dusk, birthday as the only door, seven dated planetary chapters). Port that experience into the **existing Next.js production app**. Do **not** deploy the Vite prototype as the site.

The only thing you are forbidden to lose is **SEO**: ranked URLs, titles, canonicals, sitemaps, unique ranking copy, internal links into the library, and the Worker-owned birthday/compatibility directories.

Everything else — gold-on-black, paper marketing chrome, $13 Blueprint as the header CTA, Elroy prominence, current `/today`/`/timing` app skin, “a mirror not a forecast” homepage — is replaceable.

---

## 1. Locked decisions (do not re-litigate)

| Decision | Choice |
|---|---|
| Goal | Reimagine the entire public site as the Season product |
| What to save | **SEO only** |
| What not to save | Current visual system, current flagship conversion, current app IA, current “mirror not forecast” homepage |
| Architecture | **New house, same addresses.** New look + new product. Every indexed URL keeps its path. No 301s of ranking pages onto prototype routes. |
| New routes | Additive only: `/season` (required), `/membership` (later). Do **not** create `/system` or `/cards` as replacements for `/methodology` or `/birth-card`. |
| Stack | Stay on Next.js 15 / React 19 / Bun / Cloudflare Pages. Do **not** replace the app with the Vite SPA. |
| Engine | Use the **production** engine in `lib/engine-core/` and `lib/birth-card-truth.ts`. Do **not** ship a second engine from the prototype. |
| Worker | Do **not** patch, reverse-engineer, or deploy the `cardology-unlock` Worker. Link to `/born-on/` and `/compatibility/` with plain `<a>` tags. |
| Checkout | Keep existing Stripe products working. Do **not** invent live Season Pass prices in Stripe this pass. Prototype $8 / $52 / $99 is **design fiction** until Cass prices it. |
| Deploy | Production deploys **only** from `~/cardology-elroy-qa` via `bun run pages:deploy`. Pushing to GitHub does not deploy. Do not deploy without an explicit Cass instruction. |
| Voice split | **New surfaces** (home, `/season`, new chrome) may use the prototype’s dated-destiny voice. **Ranking page body, H1, title, description** stay. Restyle those pages; do not rewrite them into horoscope copy. |

---

## 2. What “save SEO” means (the freeze line)

### 2.1 Never break

- **URL path** of every currently indexed page (list in §4).
- **`alternates.canonical`** on those pages.
- **`<title>` and meta description** on ranking pages **except homepage** (homepage is the one indexed URL you *may* rewrite — see §2.3).
- **H1 and unique body copy** on ranking pages. Restyle. Do not gut, merge, or “improve” into Season marketing.
- **`app/sitemap.ts`** coverage. Do not drop URLs. Do not blanket-bump `lastmod` on pages you did not change.
- **JSON-LD** that already exists (Organization, breadcrumbs, Article, etc.). Keep it valid.
- **Internal links** from chrome into the SEO library (calculator, 52 cards, period tool, compatibility, blog, `/born-on/`, `/compatibility/`).
- **Card slugs** (`/birth-card/ace-of-hearts`, …, `/birth-card/joker`).
- **Public-truth tests.** `bun run test` (especially `scripts/validate-public-truth.ts`) must stay green.
- **Claim labels.** Mechanics are verified; interpretation is interpretive; origin myths stay speculative. Do not turn methodology into “the universe scheduled your Saturn period.”
- **Calculator math.** Birth card, ruling card, leap-day, Dec 31 Joker, compatibility pair ordering — unchanged.
- **Worker contract.** `/born-on/{month}-{day}` and `/compatibility/{a}-and-{b}` stay the crawlable libraries.

### 2.2 You may change

- Visual system (palette, type, motion, header, footer, buttons).
- Homepage layout, hero, primary CTA, and (carefully) homepage title/description.
- Product story: Season is the front door. Blueprint / Analog Algorithm become library + upsells, not the homepage headline.
- In-app noindex routes (`/today`, `/self`, `/timing`, `/bonds`, `/reading`, `/story`, `/journal`, `/onboarding`). These are **not** SEO. `/season` can replace `/timing` as the personalized year view.
- Elroy launcher treatment (do not delete the widget/API; you may visually recede it so it does not cover conversion on mobile).
- Marketing chrome labels (nav can become Season / Cards / System / About) **as long as** footer still exposes the full ranking library.

### 2.3 Homepage SEO exception

Homepage **is** indexed (`priority: 1`, `changeFrequency: daily`). You will reimagine it. Rules:

- Keep **Card Blueprints** as the brand name (not “CardBlueprints” as one word in titles).
- Title/description must still contain the ranking language the domain already owns: **birth card**, **calculator**, **cardology**.
- Body must still link, above the fold or in the first screen-and-a-half, to:
  - `/birth-card-calculator`
  - `/birth-card`
  - `/52-day-period-meaning-tool`
  - `/birth-card-compatibility-calculator`
- Do not orphan the paid URLs: `/products/personal-card-blueprint` and `/products/analog-algorithm` stay linked from footer.

Suggested homepage title shape (do not exceed ~60 characters):

`Card Blueprints | Birth Cards, 52-Day Season & Calculator`

---

## 3. Source materials (read these first)

### Production (the thing you edit)

| Path | Role |
|---|---|
| `~/cardology-elroy-qa` | **Canonical production tree.** Only this directory may deploy. |
| `~/cardology-ccb-launch` | Sibling worktree of the same GitHub repo (`cassidyrice/cardology-mirror`). Fine for reading. Do not deploy from here. |
| `https://cardblueprints.com` | Live site. Cloudflare Pages project `cardology-mirror`. |

Key production files:

- `app/page.tsx` — homepage
- `app/layout.tsx` — root metadata, JSON-LD, Elroy
- `app/globals.css` + `tailwind.config.ts` — current tokens
- `components/seo/SiteHeader.tsx` + `SiteFooter.tsx` — chrome every ranking page uses
- `components/seo/SeoShell.tsx` — wrapper for most SEO pages
- `lib/site.ts` — `MARKETING_PATHS`, `APP_PATHS`, Worker directory constants
- `lib/engine-core/engine.js` + `engine_data.js` — real engine
- `lib/birth-card-truth.ts` — public birth-card formula
- `lib/engine.ts` / `lib/period-meanings.ts` — period copy
- `lib/products.ts` — live SKUs ($13 Blueprint, $17 Analog Algorithm; voice readings retired from public catalog)
- `app/sitemap.ts` — do not drop URLs
- `scripts/validate-public-truth.ts` — SEO/engine contract tests
- `DEPLOY.md` — deploy guards

### Prototype (the thing you port visually / as product UX)

```
/Users/main/Downloads/Kimi_Agent_CardBlueprint 52-Day Forecast/
```

| Path | Role |
|---|---|
| `plan.md` + `info.md` | Intent |
| `cardology_52day_prediction_report.md` | Product/content system (Rank × Suit × Planet) |
| `app/` | Vite + React prototype (do **not** deploy this) |
| `app/src/pages/Season.tsx` | The product to port |
| `app/src/components/home/*` | Homepage sections to port |
| `app/src/components/BirthdateGateway.tsx` | Birthday CTA |
| `app/src/index.css` + `app/tailwind.config.js` | Visual tokens |
| `app/src/lib/engine.ts` | Reference only — **do not copy into production as a second engine** |
| `app/scripts/engine-check.mjs` | What the prototype verified. Re-verify against production engine. |
| `qa/screenshots/` | Visual target. Note: System/About/Membership shots are weak (empty space, faint type, off-brand phone mock). **Season timeline is the quality bar.** Do not cargo-cult the empty pages. |

Local preview of the prototype (if still running): `http://127.0.0.1:4173/`

### Related specs (honor these unless this handoff overrides)

- `docs/superpowers/specs/2026-08-16-keyword-strategy-seo-integrity-design.md` — sitemap honesty, calculator→Worker links, do not touch Worker
- `docs/superpowers/specs/2026-08-12-dry-mirror-voice-design.md` — dry-mirror voice on **meanings / Blueprint report / Elroy**. Do not rewrite those into roast or into woo. New Season *marketing* can be destiny-flavored; **card meaning lines stay dry-mirror**.

---

## 4. URL inventory

### 4.1 Indexed marketing paths (keep every path)

From `lib/site.ts` `MARKETING_PATHS`:

```
/  /about  /videos  /blog
/birth-card  /birth-card-calculator  /card-of-the-day
/52-day-period-meaning-tool
/birth-card-compatibility-calculator  /cardology-compatibility
/products/personal-card-blueprint  /products/analog-algorithm
/free-course
/what-is-cardology  /cardology-for-beginners  /cardology-vs-tarot
/destiny-cards  /cartomancy-vs-tarot
/how-to-read-playing-cards
/playing-card-spreads  /playing-card-spreads/three-card
/playing-card-spreads/love  /playing-card-spreads/yes-or-no
/52-card-astrology-explained
/birth-card-vs-ruling-card  /planetary-ruling-card
/methodology  /editorial-policy  /contact  /shadow-karma-guide
/privacy-policy  /refund-policy  /terms-of-service
```

Plus:

- `/birth-card/{slug}` × 52 (ace-of-hearts … king-of-spades)
- `/birth-card/joker`
- `/blog/{slug}` and `/blog/pillar/{slug}`
- Worker (not in Next sitemap, still ranked): `/born-on/`, `/born-on/{month}-{day}` × 366, `/compatibility/`, pair pages

### 4.2 Noindex app paths (not SEO; fair game)

```
/today  /self  /timing  /bonds  /reading  /story  /journal
/onboarding  /access  /free-course/watch  /blueprint  /checkout/*
```

`/timing` is the closest existing “year of periods” view. `/season` should become the personalized year. Keep `/timing` as a **200 + redirect or restyle**, not a 404. Prefer: `/timing` renders the new Season (or 308 to `/season` **only if** `/timing` is confirmed noindex in production robots and you add a sitemap check). Safer: keep `/timing` working and visually alias it to Season.

### 4.3 Prototype → production mapping

| Prototype | Production | Rule |
|---|---|---|
| `/` | `/` | Reimagine. Keep keyword coverage + library links. |
| `/season` | **New** `/season` | Personalized year. Also restyle `/timing` so it does not 404. |
| `/system` | **Do not add** as a ranking replacement | Fold visuals into `/methodology` and `/what-is-cardology` / `/52-card-astrology-explained` without changing their H1/intent. |
| `/cards` | `/birth-card` | Restyle the hub + keep 52 slug pages. |
| `/membership` | New `/membership` **later** (slice 4) | Do not 301 `/products/*` here. Product URLs stay. |
| `/about` | `/about` | Restyle. Keep any unique about/E-E-A-T facts (Cass, methodology links). |

---

## 5. Visual system to port

Kill gold-on-black **and** the cream/paper marketing theme. One site, one night sky.

### Tokens (from prototype `tailwind.config.js` / `index.css`)

```
void     #07060E
deep     #0D0B1E
nebula   #171333
iris     #7C5CFF
aurora   #3EE6C4
flare    #FF5C8A
sol      #FFC45C
ink      #F2F0FF
mist     #9B94C4
faint    #4A4376
```

Type: **Fraunces** (display/serif) + **Inter** (body). Prototype also uses Unbounded / Space Grotesk — optional for numerals and UI chrome. Load via `next/font`. Do not use the prototype’s Google Fonts `<link>` soup if Next already has a font pipeline.

Motion: spring / `cubic-bezier(0.22, 1, 0.36, 1)`. Tight, not floaty. No 2s fades.

Glass: `rgba(34, 29, 71, 0.55)` + blur 18px + iris 18% border.

Suits: keep production semantic suit colors if they already appear in card pages; do not break contrast on `/birth-card/[slug]`.

### Chrome

Replace `SiteHeader` / `SiteFooter` so **every SEO page inherits the new look in slice 1**.

Suggested primary nav (max 5):

1. Your Season → `/season`
2. Calculator → `/birth-card-calculator`
3. The Cards → `/birth-card`
4. The System → `/what-is-cardology` (or `/methodology` — pick one and footer-link the other)
5. About → `/about`

Header CTA: **Reveal My Cards** → homepage birthday field or `/season` (not “Get My Blueprint — $13”).

Footer **must** still list the full free-tool + learn + legal library from current `SiteFooter.tsx`. This is how long-tail URLs stay discoverable after the header shrinks.

`SeoShell` must switch to the new tokens so restyling chrome actually restyles ranking pages, not just home.

---

## 6. Product experience to port (the Season)

### 6.1 Entry

One CTA: **birthday**. MM / DD / YYYY. On valid date, compute birth card with **production** `publicBirthCardCode` / engine, then go to `/season?m=&d=&y=` or a local profile (see existing onboarding/profile store — reuse if it already persists DOB).

Demo date in the prototype is July 17, 1995 → **J♣**, solar value 24. Use that as a visual empty-state only; do not hardcode it as every visitor’s year.

### 6.2 `/season` (the product)

Port from `app/src/pages/Season.tsx` and `components/season/*`:

1. Birth-card reveal (name, archetype title from `card-descriptions.json`)
2. Planetary ruling card + season premiere date (= last birthday)
3. **Seven-chapter timeline** — Mercury 1–52, Venus 53–104, Mars 105–156, Jupiter 157–208, Saturn 209–260, Uranus 261–312, Neptune 313–366
4. Current period spotlight (progress, days remaining, next premiere)
5. Episode artifact: Rank × Suit × Planet (compose from existing `period-meanings.ts` + card meanings — do not invent a second meaning database)
6. Yearly spine: Long Range, Pluto, Result, Environment, Displacement
7. Significance badges: A / 6 / 9 = high-signal; 2 / 4 / 10 = structural
8. Joker (Dec 31): special empty state, no fake spread

Quality bar = `qa/screenshots/season-1-timeline.png`.

### 6.3 Engine rules (already true in production — verify, don’t reimplement)

```
sv = 55 - (2*month + day); while sv <= 0: sv += 52
Dec 31 → Joker (public truth). Do not “fix” this.
YEAR_0 7×7 + crown [K♠, Q♠, J♠]
P has order 90
Period cards: walk backward 7 from the card in this year’s spread; 8th Pluto; 9th Result
Long Range: cycle = floor(age/7); card = extract 7 from spread(cycle+1)[age % 7]
Environment / Displacement: null for fixed cards 8♣, J♥, K♠
```

If prototype `engine.ts` and production `engine.js` disagree, **production wins**. There is already `scripts/validate-engine.mjs` / public-truth coverage.

### 6.4 Homepage sections to port (from `components/home/*`)

Port the *structure*, not every AI-generated asset:

- Hero: “Your year has seven chapters.” + birthday gateway + card fan
- Season arc (Mercury → Neptune)
- Episode preview
- The machine (computed, not drawn)
- Dated destiny (premiere cadence)
- Final CTA = birthday again

Do **not** depend on unlicensed or one-off prototype PNGs if they are huge or off-brand. Prefer CSS/SVG (`logo-seal.svg`, `suit-glyph-set.svg`, `planet-seals.svg`). If you copy images, put them in `public/brand/season/` and keep them small.

The membership-page phone mock (`notification-mock.png`) is off-brand. **Do not use it.**

---

## 7. Implementation slices (this is the work order)

Do these in order. Each slice must be shippable alone. Do not start slice N+1 until slice N meets its done list.

### Slice 1 — Design system + chrome (no URL changes)

**Goal:** The whole site looks like the new house. Ranking pages still say the same thing.

- Add season tokens to `tailwind.config.ts` and `app/globals.css`. Keep old `brand.*` tokens as aliases for one slice if needed so you don’t break every class at once — but visually, paper/gold should be gone from header/footer/body backgrounds.
- Load Fraunces + Inter via `next/font` in `app/layout.tsx`.
- Rewrite `SiteHeader` + `SiteFooter` as specified in §5.
- Point `SeoShell` at the new background/type so `/what-is-cardology`, `/birth-card`, blog, etc. inherit the night sky **without copy edits**.
- Update `viewport.themeColor` to `#07060E`.
- Keep Elroy mounted; restyle the launcher so it does not cover mobile CTAs (existing SEO-integrity requirement).
- Keep footer newsletter + full library links.

**Done when:**

- `bun run test` green
- Spot-check 5 ranking URLs locally: same title, same H1, new chrome
- Header no longer says “Get My Blueprint — $13”
- Footer still links calculator, 52 cards, period tool, compatibility, `/born-on/`, `/compatibility/`, Blueprint, Analog Algorithm, legal

### Slice 2 — Homepage + `/season`

**Goal:** The new product exists. SEO library still reachable from home.

- Replace `app/page.tsx` with the Season landing (port home sections).
- Add `app/season/page.tsx` + client components. Use production engine for all numbers.
- Persist DOB (local profile / search params). Reuse existing profile helpers if present (`lib/profile.ts`, onboarding).
- Restyle `/timing` to the same Season view (or render `<SeasonClient />` from both routes). **No 404.**
- Homepage metadata: keep birth card / calculator / cardology in title + description.
- Homepage still links the four library tools in §2.3.
- Do not add a fake Stripe Season Pass.

**Done when:**

- Enter July 17, 1995 → J♣, seven dated periods, current chapter highlighted
- Enter Dec 31 → Joker state, no crash
- Enter Feb 29 → production leap-day rule, not a new rule
- `/`, `/season`, `/timing` all 200
- `bun run test` + existing homepage hero tests updated to the new hero (do not delete the tests; retarget them)
- Mobile + desktop: birthday field works (tap, type, submit)

### Slice 3 — Restyle ranking templates (copy freeze)

**Goal:** Library looks like the same site. Google still sees the same pages.

Restyle, do **not** rewrite H1/title/unique body:

- `app/birth-card/page.tsx` + `app/birth-card/[slug]/page.tsx` + joker
- `components/seo/BirthCardCalculator.tsx`
- `components/seo/PeriodMeaningTool.tsx`
- `components/seo/CompatibilityCalculator.tsx`
- `app/blog/*` listing + post template
- `app/methodology/page.tsx`, `app/what-is-cardology/page.tsx`, other `SeoShell` pages
- Product pages (`/products/*`) — new chrome, **same offer, same price, same checkout URL**

**Done when:**

- Diff of ranking pages is mostly className / layout, not paragraph text
- Titles, descriptions, canonicals unchanged (except homepage)
- Sitemap URL set unchanged
- Calculator still emits crawlable `/born-on/...` and `/compatibility/...` anchors after a result
- `bun run test` green, including any `*-h1.test.ts` / card-meaning / destiny-hub / calc-chart tests

### Slice 4 — Membership (do not start until Cass prices it)

Prototype tiers (Free / $8 mo / $52 yr / $99 founding) are **not live**. When Cass prices:

- Add `/membership` as a **new** URL
- Do not 301 `/products/personal-card-blueprint` or `/products/analog-algorithm`
- Wire real Stripe through existing `app/checkout/[offer]` patterns
- Keep `/products/*` indexed

Until then: Season CTAs can say “Read your season” (free) and footer can still sell Blueprint + ebook.

---

## 8. Explicitly out of scope

- Deploying the Vite `app/` directory, or replacing Next with Vite
- 301ing `/birth-card` → `/cards` or `/methodology` → `/system`
- Editing or deploying the unlock Worker
- Changing engine formulas, leap-day, or Joker
- Rewriting blog posts, Analog Algorithm PDF, or the 52 card meaning essays
- New Stripe prices / subscriptions
- Pushing to GitHub or running `pages:deploy` without Cass
- Touching `~/cardology-mirror` or `~/cardology-blog-cron` as a deploy source
- Using prototype `notification-mock.png` or empty System/About layouts as a quality target
- Medical / financial / legal claims around Ace / Spade “health” themes (prototype report §7). Soften any Ace-health language.

---

## 9. Tests and verification

After every slice:

```bash
cd ~/cardology-elroy-qa   # or the worktree you are editing
bun run test
```

Update, do not delete, tests that snapshot the old gold/paper header or homepage hero.

Before calling a slice done:

1. `bun run dev` (port **3577**)
2. Click through: home → birthday → season → one card meaning page → calculator → period tool
3. View-source or document title on `/birth-card/ace-of-hearts`, `/what-is-cardology`, `/52-day-period-meaning-tool` — titles unchanged
4. Confirm footer links to `/born-on/` and `/compatibility/` are **plain anchors**, not Next `<Link>` (Worker routes)
5. Mobile width: Elroy does not cover the birthday CTA

If you have browser tools, use them. A screenshot of the hero is not verification.

---

## 10. Deploy (later, only if Cass asks)

```bash
cd ~/cardology-elroy-qa
# clean tree, allowed branch (main / release/* / hotfix/*)
bun run pages:deploy
```

Guards in `scripts/deploy-production.sh`:

- Must run from a directory named `cardology-elroy-qa`
- Clean git tree
- Build + smoke (Elroy API, homepage title, sitemap products, HSTS)

Do **not** use `ALLOW_DIRTY` / `SKIP_SMOKE` unless Cass is standing there.

---

## 11. Voice cheat sheet

| Surface | Voice |
|---|---|
| Homepage, `/season`, new chrome | Prototype: dated, cinematic, “seven chapters,” “premiere.” Destiny-flavored but grounded. No medical claims. |
| `/birth-card/*` meaning lines, Blueprint report, Elroy | Dry-mirror spec (2026-08-12): second person, present, pattern + cost. No roast, no woo, no prophesy. |
| Methodology, editorial, calculators | Existing claim labels. Math is math. Interpretation is labeled. |

Do not let Season marketing leak into card-meaning JSON.

---

## 12. Suggested first commit message (slice 1)

```
feat(season): dusk chrome without changing ranking copy

Replace paper/gold SiteHeader, SiteFooter, and SeoShell with the
52-day Season tokens. Nav points at Season + library. Footer keeps
every indexed tool and product URL.
```

---

## 13. If you are confused, do this — not something else

1. Open the prototype Season page. That is the product.
2. Open production `/birth-card/ace-of-hearts`. That copy is frozen.
3. Put (1)’s look around (2)’s words.
4. Put (1)’s birthday → year flow at `/` and `/season`.
5. Stop. Do not redesign the cardology system, the Worker, or Stripe.

Cass’s words: **reimagine the entire thing, without losing SEO. Only SEO is what we care about saving.**

Start at **Slice 1**.
