import { expect, test } from "bun:test";

import { generateMetadata } from "../app/birth-card/[slug]/page";
import { allCardSeo, cardBySlug, cardMeta } from "../lib/seo-cards";

const NINE_OF_HEARTS_TITLE = "9 of Hearts Meaning: Birth Card, Love & Cartomancy";
const NINE_OF_HEARTS_DESCRIPTION =
  "9 of Hearts meaning as a birth card and in a reading: compassionate idealist pattern, shadow, love/work, dates Aug 30–Dec 22. Playing cards, not tarot. Free calculator.";

test("9 of Hearts uses the approved GSC title and meta", () => {
  const card = cardBySlug("9-of-hearts");
  expect(card).not.toBeNull();
  expect(cardMeta(card!)).toEqual({
    title: NINE_OF_HEARTS_TITLE,
    description: NINE_OF_HEARTS_DESCRIPTION,
  });
});

test("/birth-card/9-of-hearts generateMetadata uses the GSC title", async () => {
  const meta = await generateMetadata({
    params: Promise.resolve({ slug: "9-of-hearts" }),
  });
  expect(meta.title).toBe(NINE_OF_HEARTS_TITLE);
  expect(meta.description).toBe(NINE_OF_HEARTS_DESCRIPTION);
});

test("all 52 birth-card pages share the meaning title pattern and no retired price", () => {
  const cards = allCardSeo();
  expect(cards).toHaveLength(52);

  for (const card of cards) {
    const { title, description } = cardMeta(card);
    expect(title).toBe(`${card.label} Meaning: Birth Card, Love & Cartomancy`);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description).not.toMatch(/\$19\b/);
    expect(description).not.toMatch(/\$9\b|\$13\b/);
    expect(description).not.toMatch(/Deep Dive|Personal Card Blueprint/i);
    expect(description).toMatch(/Playing cards, not tarot/);
    expect(description).toMatch(/free calculator/i);
  }
});
