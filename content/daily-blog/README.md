# Daily Cardology Blog Guardrails

The scheduled generator appends one SEO-safe article to `lib/generated-blog-posts.json`.

Rules for public-figure profiles:

- Use only public figures with a verified public birth date.
- Use actual people as teaching examples. The point is to make cards recognizable in public behavior, relationship dynamics, creative choices, leadership patterns, audience bonds, and repeated social roles.
- Write with confidence about visible patterns. Keep the limits quiet and precise: do not reduce a whole person to one card, claim secret motives, or present the card as the only cause of an event.
- Do not claim a card alone caused a person to act, win, lose, marry, separate, endorse, or commit a public act.
- Avoid medical, mental-health, legal, criminal, sexual, or family claims.
- Discuss public roles, public-facing creative/career patterns, known collaborations, visible conflicts, and relational dynamics that are already part of the public record.
- Keep political figures neutral: no endorsement, no attack, no certainty about character.
- Link back to the calculator, the matching birth-card page, and the readings product ladder.
- Do not publish duplicate slugs, duplicate figure names, or near-identical keyword sets.

To force a specific topic manually, run:

```sh
DAILY_BLOG_TOPIC_SLUG=taylor-swift-birth-card-profile bun run generate:daily-blog
```

To add a currently trending public figure without editing the main seed list, create
`content/daily-blog/trending-queue.json` with the same object shape used in
`content/daily-blog/topics.json`.
