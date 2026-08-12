# Worker CTR snippet brief (cardology-unlock)

Source of `/born-on/*` and `/compatibility/*` is the **cardology-unlock** Worker (not in cardology-mirror). Do not deploy recovered bundles without review.

## Why
GSC 28d zero-click / low-CTR examples at strong positions:
- `/born-on/may-2` — 0 clicks / 89 impr / pos ~4.9
- `/compatibility/6-of-diamonds-and-4-of-spades` — 0 / 106 / ~8.2
- `/compatibility/9-of-clubs-and-6-of-diamonds` — 2 / 77 / 2.6% / pos 2.3

Live titles lean poetic (`Resources Meet Rigor`) or nickname-forward (`Four of Spades — The Rigid Truth`). Queries are literal card/date strings.

## Proposed formulas
### born-on day pages
- Title: `{Month D} Birth Card Is the {Card Label} (Cardology)`
- Meta: `Born on {Month D}? Your Cardology birth card is the {Card}. Personality, ruling card, and timing — playing cards, not tarot. Free calculator.`
- Keep nickname in H1/subhead, not only in the `<title>`.

### compatibility pair pages
- Title: `{Card A} & {Card B} Compatibility (Cardology Birth Cards)`
- Meta: `{Card A} and {Card B} in Cardology: relationship pattern, Life Path links, and what the pairing needs — playing-card birth cards, not tarot.`
- Keep poetic line as on-page H2/eyebrow only.

### Deploy
Only from the real unlock source tree once located (historical path `/Users/clr/cardology-unlock`). Verify with curl on 3 URLs after deploy.
