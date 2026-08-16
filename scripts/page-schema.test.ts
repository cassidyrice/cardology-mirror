import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import PlayingCardSpreads, {
  metadata as spreadsMetadata,
} from "@/app/playing-card-spreads/page";
import HowToReadPlayingCards, {
  metadata as howToMetadata,
} from "@/app/how-to-read-playing-cards/page";
import CardAstrology, {
  metadata as astrologyMetadata,
} from "@/app/52-card-astrology-explained/page";
import { SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";
import { SITE_URL } from "@/lib/site";

type JsonLd = Record<string, unknown>;

function jsonLdGraphs(markup: string): JsonLd[] {
  return Array.from(
    markup.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g,
    ),
    (match) => JSON.parse(match[1]!) as JsonLd | JsonLd[],
  ).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

test("spreads hub exposes its three visible spokes as an ItemList", () => {
  const markup = renderToStaticMarkup(createElement(PlayingCardSpreads));
  const graphs = jsonLdGraphs(markup);
  const collections = graphs.filter(
    (graph) => graph["@type"] === "CollectionPage",
  );
  const collection = collections[0];

  expect(collections).toHaveLength(1);
  expect(collection).toEqual({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Playing Card Spreads",
    description: spreadsMetadata.description,
    url: `${SITE_URL}${SPREADS_HUB_PATH}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: SPREADS.length,
      itemListElement: SPREADS.map((spread, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: spread.name,
        url: `${SITE_URL}${spread.path}`,
      })),
    },
  });
  expect(graphs.some((graph) => graph["@type"] === "FAQPage")).toBeTrue();

  for (const spread of SPREADS) {
    expect(markup).toContain(`href="${spread.path}"`);
    expect(markup).toContain(`>${spread.name}</p>`);
  }
});

test("how-to guide has visible authorship and matching Article schema", () => {
  const markup = renderToStaticMarkup(createElement(HowToReadPlayingCards));
  const graphs = jsonLdGraphs(markup);
  const articles = graphs.filter((graph) => graph["@type"] === "Article");
  const article = articles[0];
  const pageUrl = `${SITE_URL}/how-to-read-playing-cards`;

  expect(articles).toHaveLength(1);
  expect(article).toEqual({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Read Playing Cards",
    description: howToMetadata.description,
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    datePublished: "2026-07-12",
    dateModified: "2026-08-16",
    author: {
      "@type": "Person",
      name: "Cassidy Rice",
      url: `${SITE_URL}/about`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  });
  expect(graphs.some((graph) => graph["@type"] === "FAQPage")).toBeTrue();
  expect(markup).toContain(">How to Read Playing Cards</h1>");
  expect(markup).toMatch(/href="\/about"[^>]*>Cassidy Rice<\/a>/);
  expect(markup).toContain("Updated August 16, 2026");
  expect(markup).toMatch(/href="\/methodology"[^>]*>Methodology<\/a>/);
});

test("52-card explainer has matching Article schema and update text", () => {
  const markup = renderToStaticMarkup(createElement(CardAstrology));
  const graphs = jsonLdGraphs(markup);
  const articles = graphs.filter((graph) => graph["@type"] === "Article");
  const article = articles[0];
  const pageUrl = `${SITE_URL}/52-card-astrology-explained`;

  expect(articles).toHaveLength(1);
  expect(article).toEqual({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Playing Cards Birthday Chart & 52-Card Astrology",
    description: astrologyMetadata.description,
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    datePublished: "2026-06-05",
    dateModified: "2026-08-16",
    author: {
      "@type": "Person",
      name: "Cassidy Rice",
      url: `${SITE_URL}/about`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  });
  expect(graphs.some((graph) => graph["@type"] === "FAQPage")).toBeTrue();
  expect(markup).toContain(
    ">Playing Cards Birthday Chart &amp; 52-Card Astrology</h1>",
  );
  expect(markup).toContain("By Cassidy Rice · Updated August 16, 2026 ·");
});
