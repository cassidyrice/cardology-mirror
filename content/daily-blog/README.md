# Daily Cardology Blog Guardrails

The scheduled generator appends one SEO-safe article to `lib/generated-blog-posts.json`.

## Pillar rotation

The generator alternates between two lanes, keyed deterministically on the UTC day
index of the post date (`floor(Date.parse(POST_DATE) / 86400000)`):

- **Even day index** — public-figure birth-card profile (`birth-card-meanings`),
  drawn from `topics.json` plus `trending-queue.json`. These remain the proven
  traffic angle, so they keep roughly every other slot.
- **Odd day index** — definitional post from `definitional-queue.json`, cycling
  one pillar per definitional slot in this fixed order:
  `cardology-foundations` → `timing-and-spreads` → `relationships-and-practice`
  (pillar = `PILLAR_ROTATION[floor(dayIndex / 2) % 3]`). Each thin pillar
  receives a post every six days.

If the scheduled lane has no eligible topic left (slug already published, or a
keyword set too close to an existing post), the other lane fills the day, and
within the definitional lane the rotation advances to the next pillar with
eligible topics. The rule uses no randomness: the same `POST_DATE` always
selects the same topic.

To preview a day without writing anything:

```sh
DRY_RUN=1 POST_DATE=2026-07-13 bun run generate:daily-blog
```

## Rules for public-figure profiles

- Use only public figures with a verified public birth date.
- Use actual people as teaching examples. The point is to make cards recognizable in public behavior, relationship dynamics, creative choices, leadership patterns, audience bonds, and repeated social roles.
- Write with confidence about visible patterns. Keep the limits quiet and precise: do not reduce a whole person to one card, claim secret motives, or present the card as the only cause of an event.
- Do not claim a card alone caused a person to act, win, lose, marry, separate, endorse, or commit a public act.
- Avoid medical, mental-health, legal, criminal, sexual, or family claims.
- Discuss public roles, public-facing creative/career patterns, known collaborations, visible conflicts, and relational dynamics that are already part of the public record.
- Keep political figures neutral: no endorsement, no attack, no certainty about character.
- Link back to the calculator, the matching birth-card page, and the readings product ladder.
- Do not publish duplicate slugs, duplicate figure names, or near-identical keyword sets.

## Rules for definitional posts

- Strictly definitional: explain what a term, structure, or practice means in
  Cardology. No medical, mental-health, legal, financial, or person-specific
  claims.
- Timing language is a mirror, not a forecast: name themes and questions, never
  scheduled events.
- Hedge interpretation honestly ("is often read as", "the tradition treats"),
  and keep the calculation layer stated as fixed math.
- Link back to the calculator, the relevant tool or guide page, and related
  core posts.
- Keywords must not overlap an existing post by two or more phrases, or the
  duplicate check will block the topic permanently.

Definitional topics live in `content/daily-blog/definitional-queue.json` as
`{ "topics": [...] }`. Each entry carries the full editorial payload the
generator publishes verbatim (dates are stamped at generation time):

```jsonc
{
  "slug": "kebab-case-slug",
  "pillar": "cardology-foundations | timing-and-spreads | relationships-and-practice",
  "title": "...",
  "seoTitle": "...",            // optional
  "description": "...",         // meta description
  "dek": "...",                 // one-line subhead
  "readTime": "5 min read",
  "keywords": ["..."],
  "answer": "...",              // direct-answer paragraph
  "sections": [{ "heading": "...", "body": ["..."], "links": [{ "label": "...", "href": "/..." }] }],
  "faqs": [{ "q": "...", "a": "..." }],
  "related": ["existing-post-slug"],
  "coreLinks": [{ "label": "...", "href": "/..." }]
}
```

## Manual controls

To force a specific topic (public figure or definitional) manually, run:

```sh
DAILY_BLOG_TOPIC_SLUG=taylor-swift-birth-card-profile bun run generate:daily-blog
```

To add a currently trending public figure without editing the main seed list, create
`content/daily-blog/trending-queue.json` with the same object shape used in
`content/daily-blog/topics.json`.
