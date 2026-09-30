import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => {
  const absolute = join(root, path);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
};

const component = read("components/seo/NewsletterSignupForm.tsx");
const calculator = read("components/seo/BirthCardCalculator.tsx");
const methodology = read("app/methodology/page.tsx");
const home = read("app/page.tsx");
const emailSection = read("components/home/EmailSignupSection.tsx");

const endpoint = "https://buttondown.com/api/emails/embed-subscribe/cardblueprint";

test("newsletter form uses Buttondown's native confirmed-subscription endpoint", () => {
  expect(component).toContain(endpoint);
  expect(component).toContain('name="email"');
  expect(component).toContain('type="email"');
  expect(component).toContain("required");
});

test("newsletter form states the Monday-card promise and privacy boundary", () => {
  expect(component).toContain("Your card, every Monday.");
  expect(component).toContain("Unsubscribe anytime");
  expect(component).toContain('href="/privacy-policy"');
  expect(component).not.toContain("No daily horoscope spam");
  expect(component).not.toContain('name="birthdate"');
  expect(component).not.toContain("trackClientFunnelEvent");
});

test("newsletter form catches non-buyers right under the $13 button on the calculator result", () => {
  expect(calculator).toContain("<NewsletterSignupForm");
  expect(calculator).toContain('source="calculator-result"');
  expect(calculator.indexOf("<DeepDiveHostedCheckout")).toBeLessThan(
    calculator.indexOf("<NewsletterSignupForm"),
  );
});

test("newsletter tags carry the card, never the birthday", () => {
  expect(component).toContain('type="hidden" name="tag"');
  expect(calculator).toContain('"calculator-result"');
  expect(calculator).toContain("`card-${slug}`");
  expect(calculator).toContain('"card-joker"');
  const tagsLine = calculator.split("\n").find((line) => line.includes("tags={")) ?? "";
  expect(tagsLine).not.toMatch(/date|birthdate/i);
});

test("newsletter form appears in methodology; home stays calculator-only", () => {
  expect(methodology).toContain('source="methodology-dataset"');
  expect(emailSection).toContain('source="home-monday"');
  expect(home).toContain("LandingCalculator");
  expect(home).not.toContain("EmailSignupSection");
  expect(home).not.toContain("<NewsletterSignupForm");
});
