---
description: SEO + conversion pass on one page (path as argument)
---
Page: `$ARGUMENTS` (a path like `/what-is-cardology`).
Checklist — fix what fails, leave what passes:
- Title ≤ 60 chars with the ranking query first; meta description ≤ 155 chars with a reason to click.
- One H1. One above-fold CTA to the $47 One Question Reading (or to the calculator if the page is informational). No retired products.
- OG + twitter image exists in `public/og/` (regenerate with `scripts/generate_page_og_images.py`).
- JSON-LD valid (`bun test scripts/structured-data.test.ts scripts/page-schema.test.ts`).
- Mobile at 390px: no horizontal overflow, CTA reachable within two screens of the H1 — verify with a Playwright screenshot (`bun scripts/seo-integrity-browser.ts` or a scratch probe).
- Internal links: to the calculator, to one card page, to one compatibility page.
Reply with one line per change made, then "(y/n)" to commit.
