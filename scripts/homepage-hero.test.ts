import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  birthCardSlug,
  calculateBirthCard,
  calculateBirthCardFromIsoDate,
} from "../lib/birth-card-calculator";

describe("calculateBirthCard", () => {
  test("returns the documented January 15 card", () => {
    expect(calculateBirthCard(1, 15)?.birthCard).toBe("Q♦");
  });

  test("supports leap day", () => {
    expect(calculateBirthCard(2, 29)?.birthCard).toBe("9♣");
  });

  test("returns the December 31 Joker boundary", () => {
    expect(calculateBirthCard(12, 31)?.birthCard).toBe("Joker");
  });

  test("rejects impossible month/day combinations", () => {
    expect(calculateBirthCard(2, 30)).toBeNull();
    expect(calculateBirthCard(13, 1)).toBeNull();
  });

  test("validates the supplied year before calculating an ISO date", () => {
    expect(calculateBirthCardFromIsoDate("2023-02-29")).toBeNull();
    expect(calculateBirthCardFromIsoDate("2024-02-29")?.birthCard).toBe("9♣");
    expect(calculateBirthCardFromIsoDate("2024-2-29")).toBeNull();
  });
});

describe("birthCardSlug", () => {
  test("creates a card meaning slug and leaves Joker without one", () => {
    expect(birthCardSlug("Q♦")).toBe("queen-of-diamonds");
    expect(birthCardSlug("Joker")).toBeNull();
  });
});

describe("HomepageCalculatorHero contract", () => {
  test("replaces the cinematic journey and removes the duplicate calculator row", () => {
    const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    const header = readFileSync(
      new URL("../components/seo/SiteHeader.tsx", import.meta.url),
      "utf8",
    );
    const footer = readFileSync(
      new URL("../components/seo/SiteFooter.tsx", import.meta.url),
      "utf8",
    );

    const freePaths = home.slice(
      home.indexOf("const FREE_PATHS"),
      home.indexOf("const STEPS"),
    );
    expect(home).toContain("HomepageCalculatorHero");
    expect(home).not.toContain("HomepageJourney");
    expect(freePaths).not.toContain('href: "/birth-card-calculator"');
    expect(freePaths).toContain('href: "/birth-card-compatibility-calculator"');
    expect(home).toContain("<FreeCourseCta source=\"home\"");
    expect(layout).not.toContain("homepage-journey.css");
    expect(header).toContain("$13");
    expect(header).not.toContain("$29");
    expect(footer).toContain("$13");
    expect(footer).not.toContain("$29");
  });

  test("puts the free calculator first and gates email behind the result", () => {
    const hero = readFileSync(
      new URL("../components/home/HomepageCalculatorHero.tsx", import.meta.url),
      "utf8",
    );

    for (const text of [
      "Free · instant · no signup",
      "Which playing card were you born under?",
      "Your birthday maps to one card in a fixed 52-card system.",
      "52 cards",
      "366 birthdays",
      "not tarot",
      "Reveal my birth card",
      "Private calculation · result appears here",
      "Want to learn how to read your card?",
      'source="home-hero-result"',
      "Get the complete Personal Blueprint · $13",
    ]) {
      expect(hero).toContain(text);
    }

    expect(hero).toContain("calculateBirthCardFromIsoDate");
    expect(hero).toContain("elroy:birth-card-revealed");
    expect(hero).toContain("result &&");
    expect(hero).not.toContain("$29");
    expect(hero).not.toContain("birthdate: date,");
    expect(hero).not.toContain("home-hero-input");
    expect(hero).not.toContain("home-hero-form");
    expect(hero.indexOf("<form")).toBeLessThan(hero.indexOf('aria-label="Calculator details"'));
  });
});
