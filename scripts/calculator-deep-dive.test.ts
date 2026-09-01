import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sanitizeOfferSlug } from "../lib/analytics";
import { birthdateFromCheckoutSession } from "../lib/birthdate";
import { mintDownloadToken, verifyDownloadToken } from "../lib/download-token";
import {
  DEEP_DIVE_CALCULATOR_ENTRY_LABEL,
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_JOKER_SUCCESS_COPY,
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_ID,
  DEEP_DIVE_SESSION_PATH,
  DEEP_DIVE_SKU,
  DEEP_DIVE_SUCCESS_COPY,
  deepDiveBonusBySlug,
  deepDiveCardPdfKey,
  deepDiveSessionMetadata,
  deepDiveSuccessCopy,
} from "../lib/deep-dive";
import {
  deepDiveCardPdfForBirthday,
  deepDiveFilesForBirthday,
} from "../lib/deep-dive-card-pdf";
import {
  checkoutProductBySlug,
  DEEP_DIVE_PRODUCT,
  isDeepDive,
  publicProductBySlug,
} from "../lib/products";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const page = read("app/birth-card-calculator/page.tsx");
const calculator = read("components/seo/BirthCardCalculator.tsx");
const hero = read("components/home/HomepageCalculatorHero.tsx");
const cta = read("components/seo/DeepDiveCta.tsx");
const header = read("components/seo/SiteHeader.tsx");
const footer = read("components/seo/SiteFooter.tsx");
const offerCta = read("components/seo/OfferCta.tsx");
const meaning = read("app/birth-card/[slug]/page.tsx");
const session = read("app/checkout/[offer]/session/route.ts");
const webhook = read("app/api/checkout/webhook/route.ts");
const middleware = read("middleware.ts");

test("Deep Dive is a Card Blueprint checkout offer, not the Cassidy Rice payment link", () => {
  expect(DEEP_DIVE_OFFER_SLUG).toBe("deep-dive");
  expect(DEEP_DIVE_SKU).toBe("deep-dive-9");
  expect(DEEP_DIVE_PRICE_ID).toBe("price_1U8s5uChx1yAVyrsjbQKfsmD");
  expect(DEEP_DIVE_CTA_LABEL).toBe("Get Deep Dive $9");
  expect(DEEP_DIVE_CALCULATOR_ENTRY_LABEL).toBe("Find your card → $9 Deep Dive");
  expect(DEEP_DIVE_FULFILLMENT).toContain("7-page Deep Dive");
  expect(DEEP_DIVE_FULFILLMENT).toContain("System Guide");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("90 Spreads");
  expect(DEEP_DIVE_FULFILLMENT).toContain("Instant download links + email backup");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("download links now");
  expect(sanitizeOfferSlug(DEEP_DIVE_OFFER_SLUG)).toBe("deep-dive");
  expect(checkoutProductBySlug("deep-dive")?.price).toBe(9);
  expect(publicProductBySlug("deep-dive")).toBeUndefined();
  expect(isDeepDive(DEEP_DIVE_PRODUCT)).toBe(true);

  expect(cta).toContain("DeepDiveHostedCheckout");
  expect(cta).toContain("DEEP_DIVE_CTA_LABEL");
  expect(cta).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(cta).toContain('type="date"');
  expect(cta).not.toContain("disabled={!iso}");
  expect(cta).not.toContain("buy.stripe.com");
  const hosted = read("components/checkout/DeepDiveHostedCheckout.tsx");
  expect(hosted).toContain("DEEP_DIVE_SESSION_PATH");
  expect(hosted).toContain('method="post"');
  expect(hosted).toContain("data-analytics-checkout");
  expect(hosted).toContain('name="birthdate"');
  expect(hosted).not.toContain("buy.stripe.com");
  expect(hosted).not.toContain("createEmbeddedCheckoutPage");
  expect(hosted).not.toContain("initEmbeddedCheckout");
  expect(hosted).not.toContain("clientSecret");
  expect(cta).not.toContain("DEEP_DIVE_CHECKOUT_URL");
  expect(cta).not.toContain("personal-card-blueprint");
  expect(cta).not.toContain("/checkout/personal-card-blueprint");
  expect(header).toContain('href: "/birth-card-calculator"');
  expect(header).toContain('label: "Calculator"');
  expect(header).toMatch(/HeaderDeepDiveCta|DeepDiveCta/);
  expect(header).not.toContain("buy.stripe.com");
});

test("session metadata carries birthday from the calculator reveal", () => {
  const meta = deepDiveSessionMetadata({
    birthday: "1990-01-15",
    source: "birth-card-calculator",
  });
  expect(meta).toMatchObject({
    sku: "deep-dive-9",
    offer_slug: "deep-dive",
    birthday: "1990-01-15",
    birthdate: "1990-01-15",
    source: "birth-card-calculator",
    offer_name: "Birth Card Deep Dive",
    product_kind: "digital_download",
  });
  expect(
    birthdateFromCheckoutSession({
      metadata: { birthday: "1990-01-15" },
    }),
  ).toBe("1990-01-15");
  expect(session).not.toContain("ui_mode");
  expect(session).not.toContain("embedded_page");
  expect(session).not.toContain("client_secret");
  expect(session).toContain("const cancelUrl = isDeepDive(product)");
  expect(session).toContain("/birth-card-calculator");
  expect(session).toContain("checkout.sessions.create");
  expect(session).toContain("deepDiveSessionMetadata");
  expect(session).toContain(DEEP_DIVE_SESSION_PATH.replace("/checkout/deep-dive/session", "deep-dive") && "deepDivePriceId");
  expect(webhook).toContain("DEEP_DIVE_SKU");
  expect(webhook).toContain("deepDiveFilesForBirthday");
  expect(webhook).toContain("deepDiveCardPdfForBirthday");
  expect(webhook).toContain("isJokerBirthdate");
  expect(webhook).toContain("skipped (Joker)");
  expect(webhook).not.toContain("Mac watcher");
  expect(webhook).not.toContain("Files emailed automatically: NO");
  expect(webhook).not.toContain("king-of-spades");
  expect(webhook).not.toContain("K♠");
});

test("shared calculator result sells Deep Dive $9, not the $13 Blueprint", () => {
  expect(calculator).toContain("<DeepDiveCta");
  expect(calculator).toContain('placement="birth-card-calculator-result"');
  expect(calculator).toContain("reveal.birthdate");
  expect(calculator).toContain("date={date}");
  expect(calculator).toContain("date || reveal.birthdate");
  expect(calculator).not.toContain("personal-card-blueprint");
  expect(calculator).not.toContain("personalCheckoutHref");
  expect(calculator).not.toContain("instantReportBySlug");
  expect(calculator).not.toContain("Get My Blueprint");
  expect(calculator).not.toContain("What's inside the Blueprint");
  expect(calculator).not.toContain("<NewsletterSignupForm");
  // Link-only ShareCard stays out of the funnel; PNG share lives on the hero.
  expect(calculator).not.toMatch(/<ShareCard[\s/>]/);
  expect(calculator).toContain("<BirthShareHero");
  expect(calculator).not.toContain("buy.stripe.com");
  expect(calculator).not.toContain("seoCard");
  expect(calculator).not.toContain("getCardSeo");
  expect(calculator).toContain("<BirthShareHero");
  expect(calculator).toContain("<CurrentPeriod");
  expect(calculator.indexOf("<BirthShareHero")).toBeLessThan(
    calculator.indexOf("<CurrentPeriod"),
  );
  // The $9 CTA follows the free one-line read; the 52-day box sits below it
  // (2026-09-01: 1,149 completions → 41 taps when the CTA was two screens down).
  expect(calculator.indexOf('placement="birth-card-calculator-result"')).toBeLessThan(
    calculator.indexOf("<CurrentPeriod"),
  );
  expect(calculator).toContain("<OneLineRead");
  expect(calculator).not.toContain("FreeCourseSignupForm");
});

test("conversion chrome and card meanings use one $9 Deep Dive offer", () => {
  const headerCta = read("components/seo/HeaderDeepDiveCta.tsx");
  expect(headerCta).toContain('placement="site-header"');
  expect(headerCta).toContain('source="site-header"');
  expect(headerCta).toContain("<DeepDiveCta");
  expect(cta).toContain('placement === "site-header"');
  expect(cta).toContain("{!compact && showFulfillment && (");
  expect(header).not.toContain('label: "Deep Dive $9"');
  expect(header).not.toMatch(/Deep Dive \$9[\s\S]*href="\/birth-card-calculator"/);
  expect(header).toMatch(/HeaderDeepDiveCta|DeepDiveCta/);
  expect(meaning).not.toContain("ReadingBridge");
  expect(header).not.toContain('label: "Blueprint"');
  expect(footer).toContain("Birth Card Deep Dive — $9");
  expect(footer).toContain('href="/products/birth-card-deep-dive"');
  expect(footer).toContain('href={DEEP_DIVE_CALCULATOR_FORM_HREF}');
  expect(footer).not.toContain('href="/products/personal-card-blueprint"');
  expect(footer).not.toContain("(other product)");
  expect(offerCta).toContain("DEEP_DIVE_CALCULATOR_ENTRY_LABEL");
  expect(offerCta).toContain("DEEP_DIVE_CALCULATOR_FORM_HREF");
  expect(offerCta).not.toContain("personal-card-blueprint");
  expect(meaning).toContain('source="birth-card-meaning"');
  expect(meaning).toContain("Get the {card.label} Deep Dive");
  expect(meaning).not.toContain('className="mt-3 inline-block rounded-full bg-foil');
});

test("SEO calculator page keeps ranking URL, title, H1, and educational HTML", () => {
  expect(page).toContain('canonical: "/birth-card-calculator"');
  expect(page).toContain("/og/birth-card-calculator.png");
  expect(page).not.toContain("/og/default.png");
  expect(page).toContain('const TITLE = "Cardology Chart & Birth Card Calculator (Free, All 366 Days)"');
  expect(page).toContain("Birth Card Calculator and Cardology Chart");
  expect(page).toContain('"Cardology calculator"');
  expect(page).toMatch(/cardology calculator/i);
  expect(page).toContain('"@type": "FAQPage"');
  expect(page).toContain('"@type": "WebApplication"');
  expect(page).toContain('"@type": "Article"');
  expect(page).toContain('id="how-it-works"');
  expect(page).toContain('id="cardology-chart"');
  expect(page).toContain('id="worked-example"');
  expect(page).toContain('id="birth-vs-ruling"');
  expect(page).toContain('id="trust-and-limits"');
  expect(page).toContain('id="faq"');
  expect(page).toContain("How to find your birth card from your birthday");
  expect(page).toContain("This is a playing-card birth calculator — not tarot");
  expect(page).toContain("What is a birth card in Cardology?");
  expect(page).toContain("<details");
  expect(page).not.toMatch(/noindex/i);
  expect(page).not.toMatch(/display:\s*none/i);
  expect(page).not.toContain("Got the card name");
  expect(page).toContain("/products/birth-card-deep-dive");
  expect(page).not.toContain("/products/personal-card-blueprint");
  expect(page).toContain("<BirthdayChartTable />");
  expect(page).not.toContain("/checkout/personal-card-blueprint");
  expect(page).not.toContain("See the Blueprint");
  expect(middleware).not.toMatch(
    /["']\/birth-card-calculator["']\s*:\s*["']https:\/\/52xseven/,
  );
});

test("homepage calculator result no longer sells the $13 Blueprint or Cassidy Rice link", () => {
  expect(hero).toContain("<DeepDiveCta");
  expect(hero).toContain("birthdate={date}");
  expect(hero).not.toContain("/products/personal-card-blueprint");
  expect(hero).not.toContain("Get the complete Personal Blueprint · $13");
  expect(hero).not.toContain('offerSlug: "personal-card-blueprint"');
  expect(hero).not.toContain("buy.stripe.com");
});

test("success copy is instant card PDF, honest for Joker, no delayed follow-up", () => {
  expect(DEEP_DIVE_SUCCESS_COPY).toContain("7-page Deep Dive and the complete System Guide");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("90 Spreads");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("follows in a few minutes");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).toContain("complete System Guide");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).not.toContain("90 Spreads");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).toContain("Joker");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).not.toContain("7-page Deep Dive");
  expect(deepDiveSuccessCopy("1990-01-15")).toBe(DEEP_DIVE_SUCCESS_COPY);
  expect(deepDiveSuccessCopy("1990-12-31")).toBe(DEEP_DIVE_JOKER_SUCCESS_COPY);
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("Joker");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("Dec 31");
  expect(calculator).not.toContain("Joker position");
  expect(read("lib/products.ts")).not.toContain("Joker / Dec 31");
  expect(read("app/checkout/success/page.tsx")).toContain("deepDiveSuccessCopy");
  expect(read("components/checkout/DeepDiveHostedCheckout.tsx")).toContain(
    "Continue to Secure Checkout",
  );
});

test("Deep Dive stays one $9 SKU and mint tokens for a card birthday", async () => {
  expect(DEEP_DIVE_SKU).toBe("deep-dive-9");
  expect(DEEP_DIVE_OFFER_SLUG).toBe("deep-dive");
  expect(checkoutProductBySlug("deep-dive")?.price).toBe(9);
  expect(webhook).not.toContain("buy.stripe.com");
  expect(read("lib/products.ts")).not.toContain("deep-dive-card");

  const files = deepDiveFilesForBirthday("1990-01-15");
  expect(files.map((f) => f.slug)).toEqual([
    "system-guide",
    "queen-of-diamonds",
  ]);
  expect(files).toHaveLength(2);
  expect(files.some((f) => f.slug === "all-90-spreads")).toBe(false);
  const card = deepDiveCardPdfForBirthday("1990-01-15");
  expect(card?.key).toBe("deep-dive/queen-of-diamonds.pdf");
  expect(deepDiveCardPdfKey("queen-of-diamonds")).toBe(
    "deep-dive/queen-of-diamonds.pdf",
  );
  expect(deepDiveBonusBySlug("queen-of-diamonds")?.key).toBe(
    "deep-dive/queen-of-diamonds.pdf",
  );

  process.env.DOWNLOAD_TOKEN_SECRET = "test-deep-dive-token-secret";
  const slugs: string[] = [];
  for (const file of files) {
    const token = await mintDownloadToken("buyer@example.com", file.slug, 30);
    const payload = await verifyDownloadToken(token);
    expect(payload?.slug).toBe(file.slug);
    slugs.push(payload!.slug);
  }
  expect(slugs).toEqual(["system-guide", "queen-of-diamonds"]);
});

test("Joker / Dec 31 skips card PDF and never falls back to King of Spades", async () => {
  const files = deepDiveFilesForBirthday("1990-12-31");
  expect(files).toHaveLength(1);
  expect(files.map((f) => f.slug)).toEqual(["system-guide"]);
  expect(files.some((f) => f.slug === "all-90-spreads")).toBe(false);
  expect(deepDiveCardPdfForBirthday("1990-12-31")).toBeNull();
  expect(deepDiveCardPdfForBirthday("2024-12-31")).toBeNull();
  expect(files.some((f) => f.slug === "king-of-spades")).toBe(false);
  expect(files.some((f) => f.key.includes("king-of-spades"))).toBe(false);
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY.toLowerCase()).not.toContain("king of spades");
  expect(read("lib/deep-dive-card-pdf.ts")).toContain('birth.kind === "joker"');
  expect(read("lib/deep-dive-card-pdf.ts")).toContain("resolvePublicBirth");

  process.env.DOWNLOAD_TOKEN_SECRET = "test-deep-dive-token-secret";
  const slugs: string[] = [];
  for (const file of files) {
    const token = await mintDownloadToken("joker@example.com", file.slug, 30);
    const payload = await verifyDownloadToken(token);
    slugs.push(payload!.slug);
  }
  expect(slugs).toEqual(["system-guide"]);
  expect(slugs).not.toContain("king-of-spades");
});
