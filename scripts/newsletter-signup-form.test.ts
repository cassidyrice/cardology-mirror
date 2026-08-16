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
const footer = read("components/seo/SiteFooter.tsx");

const endpoint = "https://buttondown.com/api/emails/embed-subscribe/cardblueprint";

test("newsletter form uses Buttondown's native confirmed-subscription endpoint", () => {
  expect(component).toContain(endpoint);
  expect(component).toContain('name="email"');
  expect(component).toContain('type="email"');
  expect(component).toContain("required");
});

test("newsletter form states the promise and privacy boundary", () => {
  expect(component).toContain("No daily horoscope spam");
  expect(component).toContain("Unsubscribe anytime");
  expect(component).toContain('href="/privacy-policy"');
  expect(component).not.toContain('name="birthdate"');
  expect(component).not.toContain("trackClientFunnelEvent");
});

test("newsletter form appears after calculator results", () => {
  expect(calculator).toContain('source="calculator-result"');
  expect(calculator).toContain("<NewsletterSignupForm");
});

test("newsletter form appears in methodology and the shared footer", () => {
  expect(methodology).toContain('source="methodology-dataset"');
  expect(footer).toContain('source="site-footer"');
});
