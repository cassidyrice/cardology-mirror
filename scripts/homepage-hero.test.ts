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
  test("keeps the calculator-first home without Reading Day surfaces", () => {
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

    expect(home).toContain("HomepageCalculatorHero");
    expect(home).toContain("TodaysCardSection");
    expect(home).toContain("LatestBlogSection");
    expect(home).toContain("CompareBand");
    expect(home).not.toContain("LiveReadingSection");
    expect(home).toContain("DeepDiveSection");
    expect(home).not.toContain("HomepageJourney");
    expect(home).not.toContain("Two paid writes");
    expect(home).not.toContain("A real system under the symbols");
    expect(home).not.toContain("Explore the library");
    expect(layout).not.toContain("homepage-journey.css");
    expect(header).not.toContain("/karma-reading");
    expect(header).not.toContain("Get a Reading");
    expect(header).toContain("/birth-card-calculator");
    expect(header).not.toContain("HeaderDeepDiveCta");
    expect(header).not.toContain("$29");
    expect(header).not.toContain("buy.stripe.com");
    expect(footer).not.toContain("$13");
    expect(footer).not.toContain("$29");
    expect(footer).toContain("Playing cards, not tarot");
    expect(footer).toContain("Reading Day waitlist");
  });

  test("puts the free calculator first with exact hero copy", () => {
    const hero = readFileSync(
      new URL("../components/home/HomepageCalculatorHero.tsx", import.meta.url),
      "utf8",
    );

    for (const text of [
      "Free · instant · no signup",
      "Which card were you born under?",
      "Your birthday adds up to one playing card",
      "52 cards · 366 birthdays · 1 is yours",
      "Show my card",
      "Calculated right here. Your birthday is never stored.",
      "home-hero-result",
      "<DeepDiveCta",
    ]) {
      expect(hero).toContain(text);
    }

    expect(hero).toContain("calculateBirthCardFromIsoDate");
    expect(hero).toContain("elroy:birth-card-revealed");
    expect(hero).toContain("result &&");
    expect(hero).not.toContain("$29");
    expect(hero).not.toContain("birthdate: date,");
    expect(hero).not.toContain("not tarot");
    expect(hero).not.toContain("The $9 Deep Dive is optional after");
    expect(hero.indexOf("<form")).toBeLessThan(hero.indexOf('aria-label="Calculator details"'));
    expect(hero).toContain("<HomepageLifeSpread");
  });
});
