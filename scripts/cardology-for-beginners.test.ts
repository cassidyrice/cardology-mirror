import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import CardologyForBeginners, {
  metadata,
} from "@/app/cardology-for-beginners/page";
import {
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
  DEEP_DIVE_PRODUCT_PATH,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

type JsonLd = Record<string, unknown>;

function jsonLdGraphs(markup: string): JsonLd[] {
  return Array.from(
    markup.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g,
    ),
    (match) => JSON.parse(match[1]!) as JsonLd | JsonLd[],
  ).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function articleHtml(markup: string): string {
  const start = markup.indexOf("<article");
  const end = markup.indexOf("</article>");
  return markup.slice(start, end);
}

test("beginners page reviewed date is the September 22 offer refresh", () => {
  expect(PAGE_UPDATED_DATES["/cardology-for-beginners"]).toBe("2026-09-22");
  const markup = renderToStaticMarkup(createElement(CardologyForBeginners));
  expect(markup).toContain(`Updated ${updatedLabel("2026-09-22")}`);
  expect(markup).not.toContain("August 7, 2026");
});

test("beginners page sells the $13 One Question Reading after the free calculator", () => {
  const markup = renderToStaticMarkup(createElement(CardologyForBeginners));
  const offer = `${DEEP_DIVE_PRODUCT_NAME} · ${DEEP_DIVE_PRICE_LABEL}`;
  const freeAt = markup.indexOf('href="/birth-card-calculator"');
  const paidAt = markup.indexOf(`href="${DEEP_DIVE_PRODUCT_PATH}"`);

  expect(metadata.description).toBe(
    `Cardology for beginners: what the 52-card system is, how to find your birth card with playing cards, birth vs ruling card, compatibility, and the ${DEEP_DIVE_PRICE_LABEL} ${DEEP_DIVE_PRODUCT_NAME}.`,
  );
  expect(markup).toContain("Find your birth card free");
  expect(markup).toContain(offer);
  expect(markup).toContain("A mirror, not a forecast");
  expect(markup).toContain(ONE_QUESTION_TURNAROUND);
  expect(markup).toContain('href="/faq"');
  expect(freeAt).toBeGreaterThan(-1);
  expect(paidAt).toBeGreaterThan(freeAt);

  const article = articleHtml(markup).replaceAll("Card Blueprints", "");
  expect(article).not.toMatch(/Blueprint|Deep Dive/);
  expect(article).not.toContain("2 business days");
  expect(article).not.toMatch(/\$19|\$47|\$9\b/);
});

test("beginners FAQ and HowTo schema match the visible answers", () => {
  const markup = renderToStaticMarkup(createElement(CardologyForBeginners));
  const graphs = jsonLdGraphs(markup);
  const faq = graphs.find((graph) => graph["@type"] === "FAQPage") as {
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };
  const howTo = graphs.find((graph) => graph["@type"] === "HowTo") as {
    description: string;
    step: { name: string; text: string; url: string }[];
  };

  expect(faq.mainEntity).toHaveLength(4);
  for (const question of faq.mainEntity) {
    expect(markup).toContain(question.name);
    expect(markup).toContain(question.acceptedAnswer.text);
    expect(question.acceptedAnswer.text).not.toMatch(/Blueprint|Deep Dive/);
  }
  expect(faq.mainEntity.map((question) => question.name)).toContain(
    "What should I do after I know my birth card?",
  );
  const afterCard = faq.mainEntity.find(
    (question) => question.name === "What should I do after I know my birth card?",
  );
  expect(afterCard?.acceptedAnswer.text).toContain(DEEP_DIVE_PRODUCT_NAME);
  expect(afterCard?.acceptedAnswer.text).toContain(DEEP_DIVE_PRICE_LABEL);
  expect(afterCard?.acceptedAnswer.text).toContain("mirror, not a forecast");
  expect(afterCard?.acceptedAnswer.text).toContain(ONE_QUESTION_TURNAROUND);

  expect(howTo.description).toBe(metadata.description);
  expect(howTo.step).toHaveLength(6);
  expect(howTo.step[1]?.url).toBe("https://cardblueprints.com/birth-card-calculator");
  expect(howTo.step[5]?.url).toBe(`https://cardblueprints.com${DEEP_DIVE_PRODUCT_PATH}`);
  expect(howTo.step[5]?.text).toContain("A mirror, not a forecast");
  expect(howTo.step[5]?.text).toContain(ONE_QUESTION_TURNAROUND);
});
