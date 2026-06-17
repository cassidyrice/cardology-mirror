# Daily Cardology Blog Guardrails

The scheduled generator appends one SEO-safe article to `lib/generated-blog-posts.json`.

Rules for public-figure profiles:

- Use only public figures with a verified public birth date.
- Frame every profile as symbolic pattern language, not diagnosis, prediction, or private motive.
- Do not claim a card caused a person to act, win, lose, marry, separate, endorse, or commit a public act.
- Avoid medical, mental-health, legal, criminal, sexual, or family claims.
- Discuss public roles and public-facing creative/career patterns only.
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
