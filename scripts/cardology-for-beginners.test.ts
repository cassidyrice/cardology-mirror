import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import CardologyForBeginners, {
  metadata,
} from "@/app/cardology-for-beginners/page";
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

test("beginners page offers the $39 Chemistry Check after the free calculator", () => {
  const markup = renderToStaticMarkup(createElement(CardologyForBeginners));
  const freeAt = markup.indexOf('href="/birth-card-calculator"');
  const paidAt = markup.indexOf('href="/#chemistry-check"');

  expect(metadata.description).toBe(
    "Cardology for beginners: the 52-card system, finding your birth card, birth vs ruling card, compatibility, and the $39 Chemistry Check.",
  );
  expect(markup).toContain("Find your birth card free");
  expect(markup).toContain("The Chemistry Check · $39");
  expect(markup).toContain("A mirror, not a forecast");
  expect(markup).toContain('href="/faq"');
  expect(freeAt).toBeGreaterThan(-1);
  expect(paidAt).toBeGreaterThan(freeAt);

  const article = articleHtml(markup).replaceAll("Card Blueprints", "");
  expect(article).not.toMatch(/Blueprint|Deep Dive|One Question/);
  expect(article).not.toMatch(/\$13|\$19|\$47|\$9\b/);
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
  expect(afterCard?.acceptedAnswer.text).toContain("Chemistry Check ($39)");
  expect(afterCard?.acceptedAnswer.text).toContain("mirror, not a forecast");

  expect(howTo.description).toBe(metadata.description);
  expect(howTo.step).toHaveLength(6);
  expect(howTo.step[1]?.url).toBe("https://cardblueprints.com/birth-card-calculator");
  expect(howTo.step[5]?.url).toBe("https://cardblueprints.com/#chemistry-check");
  expect(howTo.step[5]?.text).toContain("A mirror, not a forecast");
});
