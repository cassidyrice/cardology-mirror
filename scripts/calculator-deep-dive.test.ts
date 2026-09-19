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
  DEEP_DIVE_PRODUCT_PATH,
  DEEP_DIVE_REVIEW_PATH,
  FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
  FIFTY_TWO_BY_SEVEN_ACCESS_DAYS,
  FIFTY_TWO_BY_SEVEN_SKU,
  DEEP_DIVE_LEGACY_PRICE_ID,
  DEEP_DIVE_SESSION_PATH,
  DEEP_DIVE_SKU,
  DEEP_DIVE_SUCCESS_COPY,
  LEGACY_DEEP_DIVE_SKUS,
  ONE_QUESTION_PRICE_ENV,
  ONE_QUESTION_PRICE_ID,
  ONE_QUESTION_TURNAROUND,
  ONE_QUESTION_SKU,
  QUESTION_MAX_CHARS,
  birthdayForCommand,
  deepDiveBonusBySlug,
  deepDiveCardPdfKey,
  deepDiveSessionMetadata,
  deepDiveSuccessCopy,
  isLegacyYearAppSession,
  isOneQuestionSession,
  questionFromCheckoutSession,
  sanitizeQuestion,
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
const review = read("app/checkout/[offer]/page.tsx");
const continueForm = read("components/checkout/CheckoutContinueForm.tsx");
const hosted = read("components/checkout/DeepDiveHostedCheckout.tsx");
const success = read("app/checkout/success/page.tsx");
const product = read("app/products/one-question-reading/page.tsx");
const home = read("app/page.tsx");

test("One Question Reading ($13) is a Card Blueprint checkout offer on the deep-dive slug", () => {
  expect(DEEP_DIVE_OFFER_SLUG).toBe("deep-dive");
  expect(DEEP_DIVE_SKU).toBe("one-question-47");
  expect(ONE_QUESTION_SKU).toBe(DEEP_DIVE_SKU);
  expect(FIFTY_TWO_BY_SEVEN_SKU).toBe("52xseven-blueprint-19");
  expect(LEGACY_DEEP_DIVE_SKUS).toEqual(["52xseven-blueprint-19", "blueprint-breakdown-47", "deep-dive-9"]);
  expect(DEEP_DIVE_LEGACY_PRICE_ID).toBe("price_1U8s5uChx1yAVyrsjbQKfsmD");
  // The live price object already sits in this Pages secret (created for the
  // retired $47 video); reusing it means no new secret and no dashboard edit.
  expect(ONE_QUESTION_PRICE_ENV).toBe("STRIPE_PRICE_BLUEPRINT_BREAKDOWN");
  expect(ONE_QUESTION_PRICE_ID).toBe("price_1UD0HnChx1yAVyrsIMHLp2E3");
  expect(read("lib/deep-dive.ts")).not.toContain("STRIPE_PRICE_DEEP_DIVE");
  expect(read("lib/deep-dive.ts")).not.toContain("process.env.STRIPE_PRICE_52XSEVEN_BLUEPRINT");
  expect(FIFTY_TWO_BY_SEVEN_REPORT_SLUG).toBe("52xseven-blueprint");
  expect(FIFTY_TWO_BY_SEVEN_ACCESS_DAYS).toBe(365);
  expect(DEEP_DIVE_PRODUCT_PATH).toBe("/products/one-question-reading");
  expect(DEEP_DIVE_REVIEW_PATH).toBe("/checkout/deep-dive");
  expect(DEEP_DIVE_CTA_LABEL).toBe("Ask your question — $13");
  expect(ONE_QUESTION_TURNAROUND).toBe("about a minute");
  expect(DEEP_DIVE_CALCULATOR_ENTRY_LABEL).toBe("Find your card → ask one question, $13");
  expect(DEEP_DIVE_FULFILLMENT).toContain("What $13 gets you");
  expect(DEEP_DIVE_FULFILLMENT).toContain("one question");
  expect(DEEP_DIVE_FULFILLMENT).toContain("the moment you pay");
  expect(DEEP_DIVE_FULFILLMENT).toContain("about a minute");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("2 business days");
  expect(DEEP_DIVE_FULFILLMENT).toContain("keep an eye out for");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("video");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("PDF");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("12 months");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("instant");
  expect(sanitizeOfferSlug(DEEP_DIVE_OFFER_SLUG)).toBe("deep-dive");
  expect(checkoutProductBySlug("deep-dive")?.price).toBe(13);
  expect(checkoutProductBySlug("deep-dive")?.name).toBe("One Question Reading");
  expect(checkoutProductBySlug("deep-dive")?.href).toBe("/products/one-question-reading");
  expect(publicProductBySlug("deep-dive")).toBeUndefined();
  expect(isDeepDive(DEEP_DIVE_PRODUCT)).toBe(true);
  expect(DEEP_DIVE_PRODUCT.includes.join(" ")).toContain("Long Range");
  expect(DEEP_DIVE_PRODUCT.includes.join(" ")).toContain("keep an eye out for");
  expect(cta).toContain("DeepDiveHostedCheckout");
  expect(cta).toContain("DEEP_DIVE_CTA_LABEL");
  expect(cta).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(cta).toContain('type="date"');
  expect(cta).not.toContain("disabled={!iso}");
  expect(cta).not.toContain("buy.stripe.com");
  // The CTA no longer posts straight to Stripe: it parks the birth date in the
  // tab and opens the review page where the question is typed.
  expect(hosted).toContain("DEEP_DIVE_REVIEW_PATH");
  expect(hosted).toContain("storeCheckoutBirthdate(birthdate)");
  expect(hosted).toContain("storeCheckoutContext");
  expect(hosted).toContain("router.push(DEEP_DIVE_REVIEW_PATH)");
  expect(hosted).not.toContain('method="post"');
  expect(hosted).not.toContain("buy.stripe.com");
  expect(hosted).not.toContain("createEmbeddedCheckoutPage");
  expect(hosted).not.toContain("initEmbeddedCheckout");
  expect(hosted).not.toContain("clientSecret");
  expect(cta).not.toContain("DEEP_DIVE_CHECKOUT_URL");
  expect(cta).not.toContain("personal-card-blueprint");
  expect(cta).not.toContain("/checkout/personal-card-blueprint");
  expect(header).toContain('label: "Explore"');
  expect(footer).toContain('href="/explore"');
  expect(header).toContain("/explore");
  expect(header).not.toContain("/karma-reading");
  expect(header).not.toContain("Get a Reading");
  expect(header).not.toContain("HeaderDeepDiveCta");
  expect(header).not.toContain("buy.stripe.com");
});

test("the question is typed on the review page and travels in session metadata; birthdays and questions never enter a URL", () => {
  expect(review).toContain("needsQuestion={isReading}");
  expect(review).toContain("needsBirthdate={isReport || isReading}");
  expect(review).toContain('status === "need-question"');
  expect(review).toContain("ONE_QUESTION_TURNAROUND");
  expect(review).not.toContain("52xSeven");
  expect(continueForm).toContain("<textarea");
  expect(continueForm).toContain("QUESTION_MAX_CHARS");
  expect(continueForm).toContain("sanitizeQuestion(question)");
  expect(continueForm).toContain('setHiddenField(form, "question", clean)');
  expect(continueForm).toContain("readCheckoutQuestionDraft");
  expect(continueForm).not.toContain("searchParams");
  expect(session).toContain('formQuestion = sanitizeQuestion(body.question)');
  expect(session).toContain('formQuestion = sanitizeQuestion(form.get("question"))');
  expect(session).toContain("isDeepDive(product) && !formQuestion");
  expect(session).toContain("status=need-question");
  expect(session).toContain("question: formQuestion");
  expect(session).not.toContain("ui_mode");
  expect(session).not.toContain("embedded_page");
  expect(session).not.toContain("client_secret");
  expect(session).toContain("const cancelUrl = isDeepDive(product)");
  expect(session).toContain("DEEP_DIVE_REVIEW_PATH");
  expect(session).toContain("checkout.sessions.create");
  expect(session).toContain("deepDiveSessionMetadata");
  expect(session).toContain("deepDivePriceId");
  // Stripe metadata values cap at 500 characters.
  expect(QUESTION_MAX_CHARS).toBeLessThanOrEqual(480);
  expect(sanitizeQuestion("  Should I   take the job?  ")).toBe("Should I take the job?");
  expect(sanitizeQuestion("hi")).toBe("");
  expect(sanitizeQuestion("x".repeat(600)).length).toBe(QUESTION_MAX_CHARS);
  expect(sanitizeQuestion(42)).toBe("");
});

test("session metadata carries the birthday and the question", () => {
  const meta = deepDiveSessionMetadata({
    birthday: "1990-01-15",
    question: "Should I take the promotion?",
    source: "checkout-review",
  });
  expect(meta).toMatchObject({
    sku: "one-question-47",
    offer_slug: "deep-dive",
    birthday: "1990-01-15",
    birthdate: "1990-01-15",
    question: "Should I take the promotion?",
    source: "checkout-review",
    offer_name: "One Question Reading",
    product_kind: "digital_download",
  });
  expect(
    birthdateFromCheckoutSession({
      metadata: { birthday: "1990-01-15" },
    }),
  ).toBe("1990-01-15");
  expect(questionFromCheckoutSession({ metadata: meta })).toBe("Should I take the promotion?");
  expect(isOneQuestionSession({ metadata: meta })).toBe(true);
  expect(isLegacyYearAppSession({ metadata: meta })).toBe(false);
  expect(isLegacyYearAppSession({ metadata: { sku: "52xseven-blueprint-19", offer_slug: "deep-dive" } })).toBe(true);
  expect(isLegacyYearAppSession({ metadata: { sku: "blueprint-breakdown-47" } })).toBe(true);
  expect(isLegacyYearAppSession({ metadata: { offer_slug: "deep-dive" } })).toBe(true);
  expect(isLegacyYearAppSession({ metadata: { offer_slug: "analog-algorithm" } })).toBe(false);
  expect(birthdayForCommand("1991-02-17")).toBe("2/17/1991");
});

test("webhook: the reading is fulfilled by hand; retired year-app SKUs still fulfill", () => {
  expect(webhook).toContain("isOneQuestionSession(session)");
  expect(webhook).toContain("questionFromCheckoutSession");
  expect(webhook).toContain("ACTION: write the reading within");
  expect(webhook).toContain("--send");
  expect(webhook).toContain("shellQuote");
  expect(webhook).toContain('subject: "Got your question"');
  expect(webhook).toContain("ONE_QUESTION_TURNAROUND");
  // Nothing generated on the site for this product.
  expect(webhook).not.toContain("generateReading");
  expect(webhook).not.toContain("anthropic");
  // Sessions opened under the retired $19 / $47 / $9 SKUs still get the year app.
  expect(webhook).toContain('session.metadata?.sku === "52xseven-blueprint-19"');
  expect(webhook).toContain('session.metadata?.sku === "deep-dive-9"');
  expect(webhook).toContain('session.metadata?.sku === "blueprint-breakdown-47"');
  expect(webhook).toContain("!isOneQuestionSession(session)");
  expect(webhook).toContain("FIFTY_TWO_BY_SEVEN_REPORT_SLUG");
  expect(webhook).toContain("FIFTY_TWO_BY_SEVEN_ACCESS_DAYS");
  expect(webhook).toContain("/blueprint?token=");
  expect(webhook).toContain("isJokerBirthdate");
  expect(webhook).not.toContain("Yearly Timing Map");
  expect(webhook).not.toContain("deepDiveFilesForBirthday");
  expect(webhook).not.toContain("record the 5-minute");
  expect(webhook).not.toContain("Mac watcher");
  expect(webhook).not.toContain("Files emailed automatically: NO");
  expect(webhook).not.toContain("king-of-spades");
  expect(webhook).not.toContain("K♠");
  expect(webhook).not.toContain("buy.stripe.com");
});

test("success page: the question is echoed, nothing is minted for the live product, past buyers keep the year app", () => {
  expect(success).toContain("isOneQuestionSession(session2)");
  expect(success).toContain("const legacyYearApp = Boolean(deepDive && !oneQuestion)");
  expect(success).toContain("if (legacyYearApp && confirmed && customerEmail)");
  expect(success).toContain("<QuestionFulfillment");
  expect(success).toContain("Payment confirmed. Your question is in.");
  expect(success).toContain("deepDiveSuccessCopy");
  expect(success).toContain("<YearFulfillment");
  expect(success).toContain("FIFTY_TWO_BY_SEVEN_REPORT_SLUG");
  expect(success).not.toContain("52xSeven Blueprint\"");
});

test("product page and homepage sell one reading, show a sample, and never preview a year app", () => {
  expect(product).toContain("<DeepDiveCta");
  expect(product).toContain('source="product-page"');
  expect(product).toContain("Ask one question.");
  expect(product).toContain("A piece of one");
  expect(product).toContain("A mirror, not a forecast");
  expect(product).toContain('"@type": "FAQPage"');
  expect(product).toContain("buildProductJsonLd(DEEP_DIVE_PRODUCT)");
  expect(product).not.toContain("<YearPreview");
  expect(product).not.toContain("searchParams");
  expect(product).not.toContain("buildYearBlueprint");
  expect(product).not.toContain("12 months");
  expect(product).not.toContain("52xSeven");
  expect(home).toContain("<LandingCalculator />");
  expect(home).toContain("One Question Reading");
  expect(home).toContain("home-sample-quote");
  expect(home).toContain("DEEP_DIVE_PRODUCT_PATH");
  expect(home).not.toContain("<YearPreviewApp");
  expect(home).not.toContain("buildYearBlueprint");
  expect(home).not.toContain("52xSeven");
  expect(home.indexOf("<LandingCalculator />")).toBeLessThan(home.indexOf("One Question Reading"));
  // The retired product URL answers with an edge 301 and a redirect stub.
  expect(middleware).toContain('"/products/52xseven-blueprint": "/products/one-question-reading"');
  expect(read("app/products/52xseven-blueprint/page.tsx")).toContain("permanentRedirect(DEEP_DIVE_PRODUCT_PATH)");
  // Past buyers: the year app and its sign-in tokens keep rendering.
  expect(read("lib/elroy/widget.ts")).toContain('"/blueprint"');
  expect(read("app/blueprint/page.tsx")).toContain("FIFTY_TWO_BY_SEVEN_REPORT_SLUG");
  expect(read("app/blueprint/page.tsx")).toContain("<YearBlueprintApp");
});

test("shared calculator result sells the $13 One Question Reading with one primary ask", () => {
  expect(calculator).toContain("<DeepDiveCta");
  expect(calculator).toContain('placement="birth-card-calculator-result"');
  expect(calculator).toContain("reveal.birthdate");
  expect(calculator).toContain("date={date}");
  expect(calculator).toContain("date || reveal.birthdate");
  // One unmissable ask after the reveal; it names the price and the product.
  expect(calculator).toContain(
    "Ask one question about it. The $13 One Question Reading answers it in writing.",
  );
  expect(calculator).not.toContain("What do you want to ask about it?");
  // The card's own watch-for line is the bridge into the ask.
  expect(calculator).toContain("bible.watchFor");
  expect(calculator.indexOf("bible.watchFor")).toBeLessThan(
    calculator.indexOf('placement="birth-card-calculator-result"'),
  );
  // Free exits (card meaning, whole year, born-on page) sit below the offer.
  expect(calculator.indexOf('placement="birth-card-calculator-result"')).toBeLessThan(
    calculator.indexOf("`/birth-card/${slug}`"),
  );
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
  expect(calculator).toContain("<CurrentPeriod");
  expect(calculator.indexOf("<BirthShareHero")).toBeLessThan(
    calculator.indexOf("<CurrentPeriod"),
  );
  // The primary ask is one full-width button; nothing else competes with it.
  expect(hosted).not.toContain("sm:w-auto");
  expect(cta).not.toContain("sm:w-auto");
  // The 52-day box keeps the period facts and drops its own $13 sales line.
  const currentPeriod = read("components/seo/CurrentPeriod.tsx");
  expect(currentPeriod).toContain("This 52-day stretch");
  expect(currentPeriod).not.toContain("$13");
  expect(currentPeriod).not.toContain("One Question Reading");
  // Testimonial / E-E-A-T block stays under the offer.
  expect(calculator).toContain("testimonialForCard");
  expect(calculator).toContain("Real customer words, shared with permission.");
  // The $13 CTA follows the free one-line read; the 52-day box sits below it
  // (2026-09-01: 1,149 completions → 41 taps when the CTA was two screens down).
  expect(calculator.indexOf('placement="birth-card-calculator-result"')).toBeLessThan(
    calculator.indexOf("<CurrentPeriod"),
  );
  expect(calculator).toContain("<OneLineRead");
  expect(calculator).not.toContain("FreeCourseSignupForm");
});

test("conversion chrome and card meanings use one $13 One Question Reading offer", () => {
  // HeaderDeepDiveCta remains for other surfaces; home header has no Reading Day CTA.
  const headerCta = read("components/seo/HeaderDeepDiveCta.tsx");
  expect(headerCta).toContain('placement="site-header"');
  expect(headerCta).toContain('source="site-header"');
  expect(headerCta).toContain("<DeepDiveCta");
  expect(cta).toContain('placement === "site-header"');
  expect(cta).toContain("{!compact && showFulfillment && (");
  expect(header).not.toContain('label: "Deep Dive $9"');
  expect(header).not.toMatch(/Deep Dive \$9[\s\S]*href="\/birth-card-calculator"/);
  // The approved September 5 landing page uses Explore in the header and footer.
  expect(header).toContain("/explore");
  expect(header).toContain('label: "Explore"');
  expect(read("components/seo/SiteFooter.tsx")).toContain('href="/explore"');
  expect(header).not.toContain("/karma-reading");
  expect(header).not.toContain("Get a Reading");
  expect(meaning).not.toContain("ReadingBridge");
  expect(header).not.toContain('label: "Blueprint"');
  expect(footer).toContain("One Question Reading ($13)");
  expect(footer).not.toContain("52xSeven Blueprint");
  expect(footer).not.toContain("Deep Dive ($9)");
  expect(footer).not.toContain("Blueprint Breakdown");
  expect(footer).toContain("/products/one-question-reading");
  expect(footer).not.toContain("Content Calendar");
  expect(footer).not.toContain('href="/products/personal-card-blueprint"');
  expect(footer).not.toContain("(other product)");
  expect(offerCta).toContain("DEEP_DIVE_CALCULATOR_ENTRY_LABEL");
  expect(offerCta).toContain("DEEP_DIVE_CALCULATOR_FORM_HREF");
  expect(offerCta).not.toContain("personal-card-blueprint");
  expect(offerCta).not.toContain("52xSeven");
  expect(meaning).toContain('source="birth-card-meaning"');
  expect(meaning).toContain("Ask your question as the {card.label} — $13");
  expect(meaning).not.toContain("52xSeven");
  expect(meaning).not.toContain("Blueprint Breakdown");
  expect(meaning).not.toContain("Deep Dive — $9");
  expect(meaning).not.toContain('className="mt-3 inline-block rounded-full bg-foil');
});

test("SEO calculator page keeps ranking URL, title, H1, and educational HTML", () => {
  expect(page).toContain('canonical: "/birth-card-calculator"');
  expect(page).toContain("/og/birth-card-calculator.png");
  expect(page).not.toContain("/og/default.png");
  expect(page).toContain('const TITLE = "Cardology Chart & Birth Card Calculator (Free)"');
  expect(page).toContain(
    "Free Cardology chart + birth card calculator — all 366 birthdays → one playing card. Same date, same card. Not tarot.",
  );
  expect(page).toContain("Cardology Chart & Birth Card Calculator");
  expect(page).toContain(">Cardology Chart</h2>");
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
  expect(page).toContain("/products/one-question-reading");
  expect(page).toContain("One Question Reading — $13");
  expect(page).toContain("written for you the moment you pay");
  expect(page).not.toContain("2 business days");
  expect(page).not.toContain("/products/52xseven-blueprint");
  expect(page).not.toContain("/products/blueprint-breakdown-video");
  expect(page).not.toContain("/products/birth-card-deep-dive");
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

test("success copy: question is in, written the moment you pay, honest for Joker", () => {
  expect(DEEP_DIVE_SUCCESS_COPY).toContain("Your question is in");
  expect(DEEP_DIVE_SUCCESS_COPY).toContain("It is written the moment you pay");
  expect(DEEP_DIVE_SUCCESS_COPY).toContain("within about a minute");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("2 business days");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("12 months");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("video");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("PDF");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("Timing Map");
  expect(DEEP_DIVE_SUCCESS_COPY).not.toContain("90 Spreads");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).toContain("Joker");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).toContain("It is written the moment you pay");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).toContain("within about a minute");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).not.toContain("2 business days");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).not.toContain("System Guide");
  expect(DEEP_DIVE_JOKER_SUCCESS_COPY).not.toContain("7-page Deep Dive");
  expect(deepDiveSuccessCopy("1990-01-15")).toBe(DEEP_DIVE_SUCCESS_COPY);
  expect(deepDiveSuccessCopy("1990-12-31")).toBe(DEEP_DIVE_JOKER_SUCCESS_COPY);
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("Joker");
  expect(DEEP_DIVE_FULFILLMENT).not.toContain("Dec 31");
  expect(calculator).not.toContain("Joker position");
  expect(read("lib/products.ts")).not.toContain("Joker / Dec 31");
  expect(success).toContain("deepDiveSuccessCopy");
  expect(hosted).toContain("Ask your question");
});

test("legacy $9 / $47 download links still resolve for past buyers", async () => {
  expect(DEEP_DIVE_OFFER_SLUG).toBe("deep-dive");
  expect(checkoutProductBySlug("deep-dive")?.price).toBe(13);
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
