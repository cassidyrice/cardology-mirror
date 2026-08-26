import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sanitizeOfferSlug } from "../lib/analytics";
import {
  DEEP_DIVE_CHECKOUT_URL,
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_OFFER_SLUG,
} from "../lib/deep-dive";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const page = read("app/birth-card-calculator/page.tsx");
const calculator = read("components/seo/BirthCardCalculator.tsx");
const hero = read("components/home/HomepageCalculatorHero.tsx");
const cta = read("components/seo/DeepDiveCta.tsx");
const middleware = read("middleware.ts");

test("the live Deep Dive Payment Link is the only paid after-card offer", () => {
  expect(DEEP_DIVE_CHECKOUT_URL).toBe(
    "https://buy.stripe.com/7sY14n9Ca3GocHfcYDd3i0r",
  );
  expect(DEEP_DIVE_CTA_LABEL).toBe("Get Deep Dive $9");
  expect(DEEP_DIVE_FULFILLMENT).toContain("7-page Deep Dive");
  expect(DEEP_DIVE_FULFILLMENT).toContain("System Guide");
  expect(DEEP_DIVE_FULFILLMENT).toContain("90 Spreads");
  expect(sanitizeOfferSlug(DEEP_DIVE_OFFER_SLUG)).toBe("birth-card-deep-dive");

  expect(cta).toContain("DEEP_DIVE_CHECKOUT_URL");
  expect(cta).toContain("DEEP_DIVE_CTA_LABEL");
  expect(cta).not.toContain("personal-card-blueprint");
  expect(cta).not.toContain("/checkout/personal-card-blueprint");
});

test("shared calculator result sells Deep Dive $9, not the $13 Blueprint", () => {
  expect(calculator).toContain("<DeepDiveCta");
  expect(calculator).toContain('placement="birth-card-calculator-result"');
  expect(calculator).not.toContain("personal-card-blueprint");
  expect(calculator).not.toContain("personalCheckoutHref");
  expect(calculator).not.toContain("instantReportBySlug");
  expect(calculator).not.toContain("Get My Blueprint");
  expect(calculator).not.toContain("What's inside the Blueprint");
  expect(calculator).not.toContain("<NewsletterSignupForm");
  expect(calculator).not.toContain("<ShareCard");
});

test("SEO calculator page keeps ranking URL, title, H1, and educational HTML", () => {
  expect(page).toContain('canonical: "/birth-card-calculator"');
  expect(page).toContain('const TITLE = "Birth Card Calculator & Cardology Chart"');
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
  expect(page).not.toContain("/products/personal-card-blueprint");
  expect(page).not.toContain("/checkout/personal-card-blueprint");
  expect(page).not.toContain("See the Blueprint");
  expect(middleware).not.toMatch(
    /["']\/birth-card-calculator["']\s*:\s*["']https:\/\/52xseven/,
  );
});

test("homepage calculator result no longer sells the $13 Blueprint", () => {
  expect(hero).toContain("<DeepDiveCta");
  expect(hero).not.toContain("/products/personal-card-blueprint");
  expect(hero).not.toContain("Get the complete Personal Blueprint · $13");
  expect(hero).not.toContain('offerSlug: "personal-card-blueprint"');
});
