# Card Blueprints: optimization list (Search Console + Cloudflare)

Date: October 14, 2026. Proposal only. No site changes were made.

Data used:
- Google Search Console export, July 12 to October 11, 2026 (~/Downloads/cardblueprints.com-Performance-on-Search-2026-10-14.zip)
- Cloudflare funnel and conversion-path exports (~/Downloads/export*.csv)
- Jev triage of the 95 pages with 40 or more impressions: audit/2026-10-14/jev-page-triage.json
  Results: 54 weak snippet, 22 almost page one, 7 buried, 12 healthy. Total Jev cost: $0.002.

Ranked by expected impact.

## 1. Fix the funnel after the calculator (biggest revenue lever)
Cloudflare, last 30 days: 1,260 calculator completions, 30 offer-click sessions, 5 checkout starts and 3 purchases.
Search traffic already reaches the calculator (2,132 of ~3,070 clicks). The leak is between the result and the offer.
- Test one offer card directly under the result instead of several competing offers.
- The `birth-card-calculator-app` placement produces the most offer clicks. Make it the default and drop weaker placements.

## 2. /born-on/* pages: rank top 6 but get almost no clicks
Examples: /born-on/may-2 had 0 clicks from 233 impressions at position 4.2. /born-on/august-29 had 2 from 197 at 5.8. /born-on/august-2 had 0 from 151 at 5.6. Jev flags most of the 289 birthday pages the same way.
The current title, "May 2 Birth Card: Four of Spades", answers the question in the search result, so people don't click.
- Rewrite the title and description to promise something beyond the card name, for example
  "May 2 Birthday Meaning: Personality, Love & Your Birth Card".
- Note: the live pages are served by the Worker (`WORKER_SLASH_PREFIXES` in middleware.ts). The live description ("ruled by the ...") does not match `dateMeta()` in lib/seo-cards.ts:247. Fix it in the Worker template, then keep `dateMeta` in sync.

## 3. Compatibility pair pages: top-10 positions, very low CTR
/compatibility/6-of-diamonds-and-4-of-spades had 0 clicks from 280 impressions at position 7.3.
/compatibility/9-of-clubs-and-6-of-diamonds had 2 from 186 at position 2.2.
The title, "6 of Diamonds + 4 of Spades Compatibility | Cardology", is generic.
- Use a title that matches the search intent and has a hook, for example
  "6 of Diamonds & 4 of Spades: Love Compatibility (Strengths, Friction)".
- These pages are served by the Worker, not app/.

## 4. Individual birth-card pages: stuck on page 2-3
/birth-card/5-of-diamonds is at position 25 (449 impressions).
/birth-card/ace-of-spades is at position 28 (334 impressions). It also produced a checkout and 3 offer clicks, so it is worth protecting.
/birth-card/ace-of-hearts is at position 44. 9-of-hearts, 5-of-spades, 6-of-clubs and jack-of-diamonds are all at 12-17.
Titles were already changed in September (lib/seo-cards.ts:190), so this is a ranking problem, not a snippet problem.
- Add depth that searchers of "{card} meaning" want: upright vs. reading meaning, love, career, famous people.
- Link each card page from its 7 or so /born-on dates and its compatibility pages. Those pages rank better and can pass authority.

## 5. Hubs ranking 13-16: /birth-card and /what-is-cardology
/birth-card: 36 clicks from 915 impressions at position 13.6.
/what-is-cardology: 19 clicks from 779 impressions at position 16.4.
- Point more internal links from the calculator result and the blog at these hubs, using the anchor text "cardology card meanings" and "what is cardology".
- /what-is-cardology probably competes with /blog/what-cardology-is-and-is-not (position 16.7). Merge them or give each a clearly different angle.

## 6. Desktop underperforms
Mobile: position 5.4, CTR 11.0%. Desktop: position 13.6, CTR 3.9%, but 8,530 impressions.
- Check Core Web Vitals and layout on desktop for the calculator and the hubs. A gap this large usually means a desktop experience or speed problem.

## 7. Smaller fixes
- /destiny-cards: 248 impressions at position 10 with 2% CTR. It converts (4 offer clicks). Tighten the title around "destiny cards calculator".
- /52-day-period-meaning-tool: position 6.5 with 2.5% CTR. The title is plain. Add "free" and "what your current period means".
- /card-of-the-day: position 23. The title changes daily, so Google has no stable target. Keep a fixed "Cardology Card of the Day" prefix.
- /about: position 3.6, 0 clicks. Low priority, but it did produce a checkout.
- "cardology calendar" query: 159 impressions at position 5.6 with 1.9% CTR. Consider a dedicated calendar page.

## Already known (see docs/site-cleanup-plan-2026-10-14.md)
CTR fell from about 11.5% to 8.5% over the last 28 days while impressions rose. Items 2 and 3 are the most likely contributors.
