import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import YearAheadPage, { metadata as yearMeta } from "@/app/products/year-ahead/page";
import CheckoutReviewPage from "@/app/checkout/[offer]/page";
import { renderApplicationSitemapXml } from "@/lib/application-sitemap";
import { CARD_APP_SLUG } from "@/lib/card-app-slug";
import { buildProductJsonLd } from "@/lib/product-schema";
import {
  CARD_APP_PRODUCT,
  checkoutProductBySlug,
  isYearAhead,
  productBySlug,
  YEAR_AHEAD_PRODUCT,
} from "@/lib/products";
import { MARKETING_PATHS, SITE_URL } from "@/lib/site";
import {
  YEAR_AHEAD_PRICE_ENV,
  YEAR_AHEAD_PREVIEW_TAG,
  YEAR_AHEAD_PRODUCT_PATH,
  YEAR_AHEAD_REPORT_SLUG,
  YEAR_AHEAD_REVIEW_PATH,
  YEAR_AHEAD_SLUG,
  withCardArticle,
  yearAheadHeading,
} from "@/lib/year-ahead";
import { YEAR_AHEAD_SAMPLE } from "@/lib/year-ahead-sample";
import { buildYearBlueprint } from "@/lib/year-blueprint";

const read = (path: string) => readFileSync(path, "utf8");
const savedPrice = process.env[YEAR_AHEAD_PRICE_ENV];

afterEach(() => {
  if (savedPrice === undefined) delete process.env[YEAR_AHEAD_PRICE_ENV];
  else process.env[YEAR_AHEAD_PRICE_ENV] = savedPrice;
});

test("Your Year Ahead is a $19 instant report sold through the generic checkout", () => {
  const product = checkoutProductBySlug(YEAR_AHEAD_SLUG);
  expect(product).toBe(YEAR_AHEAD_PRODUCT);
  expect(productBySlug(YEAR_AHEAD_SLUG)).toBe(YEAR_AHEAD_PRODUCT);
  expect(isYearAhead(YEAR_AHEAD_PRODUCT)).toBe(true);
  expect(YEAR_AHEAD_PRODUCT.kind).toBe("instant_report");
  expect(YEAR_AHEAD_PRODUCT.price).toBe(19);
  expect(YEAR_AHEAD_PRODUCT.priceLabel).toBe("$19");
  expect(YEAR_AHEAD_PRODUCT.stripePriceEnv).toBe("STRIPE_PRICE_YEAR_AHEAD");
  expect(YEAR_AHEAD_PRODUCT.reportSlug).toBe(YEAR_AHEAD_REPORT_SLUG);
  expect(YEAR_AHEAD_PRODUCT.href).toBe(YEAR_AHEAD_PRODUCT_PATH);
  expect(YEAR_AHEAD_REVIEW_PATH).toBe("/checkout/year-ahead");
  // The $69 app stays buyable at its own route.
  expect(checkoutProductBySlug(CARD_APP_SLUG)).toBe(CARD_APP_PRODUCT);
});

test("fulfillment reuses the report-token year: webhook, success page, /blueprint", () => {
  const session = read("app/checkout/[offer]/session/route.ts");
  expect(session).toContain("YEAR_AHEAD_REPORT_SLUG]");
  const blueprint = read("app/blueprint/page.tsx");
  expect(blueprint).toContain("payload.slug === YEAR_AHEAD_REPORT_SLUG");
  expect(blueprint).toContain("<YearBlueprintApp");
  const success = read("app/checkout/success/page.tsx");
  expect(success).toContain("yearAheadPurchase");
  expect(success).toContain("buildYearBlueprint(birthdateFromCheckoutSession(session2))");
  expect(success).toContain("<AppUpsell />");
  const webhook = read("app/api/checkout/webhook/route.ts");
  expect(webhook).toContain("YEAR_AHEAD_REPORT_SLUG");
  expect(webhook).toContain("`${yourName} is ready`");
});

test("the product page sample is real engine output", async () => {
  const year = await buildYearBlueprint(YEAR_AHEAD_SAMPLE.birthdate, YEAR_AHEAD_SAMPLE.targetDate);
  expect(year.birthCard.name).toBe(YEAR_AHEAD_SAMPLE.birthCard);
  expect(`${year.yearStartLabel} to ${year.yearEndLabel}`).toBe(YEAR_AHEAD_SAMPLE.yearRange);
  expect(year.longRange.card.name).toBe(YEAR_AHEAD_SAMPLE.longRange);
  expect(year.longRange.yearInCycle).toBe(YEAR_AHEAD_SAMPLE.yearInCycle);
  expect(year.pluto.card.name).toBe(YEAR_AHEAD_SAMPLE.pluto);
  expect(year.result.card.name).toBe(YEAR_AHEAD_SAMPLE.result);
  expect(
    year.chapters.map((c) => ({ planet: c.planet, card: c.card.name, range: `${c.startLabel} – ${c.endLabel}` })),
  ).toEqual(YEAR_AHEAD_SAMPLE.periods.map((p) => ({ ...p })));
});

test("card-specific heading reads naturally", () => {
  expect(withCardArticle("Queen of Diamonds")).toBe("a Queen of Diamonds");
  expect(withCardArticle("8 of Spades")).toBe("an 8 of Spades");
  expect(withCardArticle("Ace of Hearts")).toBe("an Ace of Hearts");
  expect(withCardArticle("10 of Clubs")).toBe("a 10 of Clubs");
  expect(yearAheadHeading("Queen of Diamonds")).toBe("Your year ahead as a Queen of Diamonds");
});

test("product page: metadata, JSON-LD at $19, and no buy button until the price secret exists", () => {
  expect(String(yearMeta.title)).toContain("Your Year Ahead · $19");
  expect(yearMeta.alternates?.canonical).toBe(YEAR_AHEAD_PRODUCT_PATH);
  const json = buildProductJsonLd(YEAR_AHEAD_PRODUCT);
  expect(json.offers.price).toBe("19.00");
  expect(json.offers.url).toBe(`${SITE_URL}${YEAR_AHEAD_PRODUCT_PATH}`);
  expect(json.offers.validFrom).toBe("2026-10-07");

  delete process.env[YEAR_AHEAD_PRICE_ENV];
  const closed = renderToStaticMarkup(createElement(YearAheadPage));
  expect(closed).toContain("Checkout opens soon.");
  expect(closed).not.toContain('href="/checkout/year-ahead"');
  expect(closed).toContain('"@type":"Product"');
  expect(closed).toContain(YEAR_AHEAD_SAMPLE.longRange);
  // The $13 reading stays on offer as the alternative.
  expect(closed).toContain("One Question Reading");

  process.env[YEAR_AHEAD_PRICE_ENV] = "price_test_year_ahead";
  const open = renderToStaticMarkup(createElement(YearAheadPage));
  expect(open).toContain('href="/checkout/year-ahead"');
  expect(open).toContain("Get my year ahead — $19");
  expect(open.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    open.indexOf('href="/checkout/year-ahead"'),
  );
});

test("review page fails closed without the price secret", async () => {
  delete process.env[YEAR_AHEAD_PRICE_ENV];
  const closed = renderToStaticMarkup(
    await CheckoutReviewPage({
      params: Promise.resolve({ offer: YEAR_AHEAD_SLUG }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(closed).toContain("Checkout closed");
  expect(closed).toContain("Checkout for this one opens soon.");

  process.env[YEAR_AHEAD_PRICE_ENV] = "price_test_year_ahead";
  const open = renderToStaticMarkup(
    await CheckoutReviewPage({
      params: Promise.resolve({ offer: YEAR_AHEAD_SLUG }),
      searchParams: Promise.resolve({}),
    }),
  );
  expect(open).not.toContain("Checkout closed");
  expect(open).toContain("Your Year Ahead — $19");
});

test("sitemap lists the year-ahead product page beside the reading", () => {
  expect(MARKETING_PATHS).toContain("/products/year-ahead");
  const xml = renderApplicationSitemapXml();
  expect(xml).toContain(`<loc>${SITE_URL}/products/year-ahead</loc>`);
  expect(xml).toContain(`<loc>${SITE_URL}/products/one-question-reading</loc>`);
});

test("calculator result leads with the card-specific $19 year, keeps the $13 reading second", () => {
  const calculator = read("components/seo/BirthCardCalculator.tsx");
  const result = calculator.slice(
    calculator.indexOf("function CalculatorNextStep"),
    calculator.indexOf("function BirthCardResultCard"),
  );
  expect(result).toContain("<YearAheadResultOffer");
  expect(result).toContain("cardLabel={label}");
  expect(result.indexOf("<YearAheadResultOffer")).toBeLessThan(result.indexOf("<DeepDiveHostedCheckout"));
  expect(result.indexOf("<DeepDiveHostedCheckout")).toBeLessThan(result.indexOf("<NewsletterSignupForm"));
  // Same birthday handoff as the reading CTA: tab storage, never a URL.
  expect(result).toMatch(/<YearAheadResultOffer[\s\S]*?birthdate=\{date \|\| reveal\.birthdate\}/);
  expect(result).toContain("YEAR_AHEAD_PREVIEW_TAG");
  expect(result).toContain("Get a free preview by email");

  const reveal = read("components/seo/Reveal.tsx");
  expect(reveal).toContain("<YearAheadResultOffer");
  expect(reveal.indexOf("<YearAheadResultOffer")).toBeLessThan(reveal.indexOf("Got one question? Ask it. $13."));
  expect(reveal).toContain("birthdate={birthdate}");
  expect(reveal).toContain("YEAR_AHEAD_PREVIEW_TAG");

  const cta = read("components/seo/YearAheadCta.tsx");
  expect(cta).toContain("storeCheckoutBirthdate(birthdate)");
  expect(cta).toContain("href={YEAR_AHEAD_REVIEW_PATH}");
  expect(cta).not.toMatch(/[?&]birthdate=/);
  expect(YEAR_AHEAD_PREVIEW_TAG).toBe("year-ahead-preview");
});

test("the $69 app is not a prime nav button; it is offered after purchase", () => {
  const header = read("components/seo/SiteHeader.tsx");
  expect(header).not.toContain("Buy app");
  expect(header).not.toContain("/checkout/${CARD_APP_SLUG}");
  const success = read("app/checkout/success/page.tsx");
  expect(success).toContain("function AppUpsell");
  expect(success).toContain("CARD_APP_PRODUCT_PATH");
});
