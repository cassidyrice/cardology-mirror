# Card Blueprints period writing completion

This library completes the August 18 writing commission for the dedicated local app. Its language follows the newer reading voice guidance. Cardology supplies symbolic meanings and calculated card assignments. It does not establish scientific predictions about a person's future.

## Deliverable checklist

- [ ] 364 individually written readings: 52 cards times Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune.
- [ ] Each reading has stable ID, card code, planet, title, omen line, substantial long reading, shadow watch, practical action, reflection question, yearly context, court-card person or posture clause, significance and source references.
- [ ] Long reading alone meets the original depth: A, 6, 9 are 400 to 600 words; 2, 4, 10 are 250 to 350 words; 3, 5, 7, 8, J, Q, K are 150 to 250 words. These groups contain 84, 84 and 196 entries respectively. The report's 156 Tier 1 count was an arithmetic error.
- [ ] Five yearly-position sets for all 52 cards, with explicit runtime eligibility for Environment and Displacement. No guessed user-specific cards or dates.
- [ ] Seven chapter introductions and closing reflections; notification copy for seven planets, four moments and two voices; onboarding, integrity and share copy.
- [ ] Style guide, JSON schema, content validator, independent editorial review and readable complete manuscript.
- [ ] Local app uses the static library with original access, calculations and original app preserved.
- [ ] Exact coverage, fields, lengths, unique prose, prohibited claims and every suit and planet reviewed. Local tests, typecheck, build and browser validation documented accurately.
- [ ] Editable document rendering and native Library upload if supported; report actual runtime limits.

## Source order

1. Current `lib/card-bible.json`: meaning, behavior, gifts, shadow and cost. Preserve its authored good material and observable detail.
2. Current `lib/period-meanings.ts` and `lib/year-copy.ts`: planetary lens, practice and existing reviewed phrases.
3. Preserved August 18 report and prototype: useful titles, imagery, rank emphasis and anatomy. Rewrite promised events, health claims, fate, certainty, invented dates and derogatory judgments.
4. Preserved newer READING_VOICE and READING_RUBRIC: plain close second-person prose, observable behavior and cost, agency, no verdicts. Their one-question layout and 500 to 700 word rule belong to that product, not this library.

## Reading record

Each suit file is a JSON array. No wrappers, markdown fences, text generators or fill-in permutations.

```
{
  "id": "ace-of-hearts.mercury",
  "cardCode": "A♥",
  "planet": "Mercury",
  "title": "The Feeling Before the Reply",
  "omenLine": "One evocative sentence naming a reflective tension, never a promised event.",
  "longReading": ["Individually written paragraph", "Further paragraphs"],
  "shadowWatch": "One or two sentences naming observable behavior and its cost.",
  "practice": "A concrete small action with a finish condition.",
  "reflection": "One real question about a choice.",
  "yearlyContext": "A useful way to compare this theme with the actual Long Range, Pluto or Result shown in the app. Never invent their identities or imply outcomes are guaranteed.",
  "personOrPosture": null,
  "significance": "threshold",
  "sourceReferences": ["card-bible:A♥", "period-filter:Mercury", "august-report:3.2-aces"]
}
```

`personOrPosture` is a meaningful individually written sentence for J, Q and K, otherwise null. Court figures are roles people of any gender and age can inhabit, not forecasts that a man or woman will appear. `significance`: A threshold; 6 or 9 karmic; 2, 4, 10 structural; other ranks standard. Karmic names a traditional emphasis, not deserved punishment or a measurable force. IDs use the current card bible slug, dot, lowercase planet.

## Voice and meaning

Keep the original emotional specificity and warm directness. The reader should recognize a small actual scene: an unanswered message, a draft waiting for approval, a favor that becomes an obligation, a meeting where nobody names the choice. Explain how this particular card and planet change that scene. Vary scenes, openings, paragraph shapes and actions. Do not write the same essay with swapped nouns. Do not impose a personal history, relationship status, job or resources. Offer examples as possibilities and leave room for the reading not to fit.

Use short plain sentences and connected paragraphs. No mockery, diagnosis, coercion, fear-based upsell, horoscope clichés, mystic explanation, forced rhetorical formulas or repeated closing slogans. No em dashes, exclamation points, markdown inside record strings, `you will`, `expect`, fate, destiny, manifestation, universe, vibration, sacred, divine or journey. Do not smuggle deterministic claims in through `this period brings`.

Ranks: Ace desire and beginning; Two partnership and choice; Three creativity and indecision; Four stability that can become confinement; Five change and restlessness; Six peace, responsibility, reciprocity and repetition; Seven faith versus fear and truth testing; Eight mastery versus control; Nine completion, release and giving; Ten groups, abundance and visible capacity; Jack experiment and divided roles; Queen service and stewardship; King authority and responsibility. Use the card bible's actual specific meaning for each rank and suit.

Planets: Mercury words and decisions; Venus desire, value and reciprocity; Mars action and boundaries; Jupiter proportion in growth; Saturn structure and follow-through; Uranus freedom and experimentation; Neptune imagination, clarity and letting go. A planet colors a reading; it causes no verified event.

No health or death predictions, bodily warnings, treatment advice, financial guarantees or buy/sell advice. Spades can address work, ordinary limits, effort, habits and rest without presenting the body as an oracle. No invented fixed calendar dates or day 52 deadlines. Runtime computes the real start and end; Neptune can be longer than 52 days. Never invent yearly cards, echo flags, activation windows, karmic eligibility or biographical facts. End hard readings with a usable choice, not doom.

## Worker ownership

Suit authors own only `hearts.json`, `diamonds.json`, `clubs.json` or `spades.json` and a corresponding author note under `qa/`. Supporting author owns `yearly-artifacts.json`, `supporting-copy.json`, `STYLE-GUIDE.md` and `qa/supporting-author.md`. Authors read sources and reuse useful material selectively. Root owns merge, validation, manuscript, integration and commits. Reviewers are read-only until a concrete revision is assigned. No worker touches git configuration, canonical files, payments, credentials, deployments or live services.
