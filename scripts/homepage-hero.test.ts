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

describe("Homepage landing contract", () => {
  test("home offers a free calculator, a labeled fictional sample, and personal readings", () => {
    const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
    const landing = readFileSync(new URL("../components/seo/LandingCalculator.tsx", import.meta.url), "utf8");
    const reveal = readFileSync(new URL("../components/seo/Reveal.tsx", import.meta.url), "utf8");
    expect(home).toContain("<LandingCalculator />");
    expect(home).toContain("<ReadingSample />");
    expect(home).toContain("fictional Chemistry Check sample");
    expect(home).toContain("<ManualReadingOffers />");
    expect(home.match(/<h1\b/g)).toHaveLength(1);
    expect(landing).not.toContain("<h1");
    expect(landing).toContain("Your birthday is kept in this tab");
    expect(landing).not.toContain("Never stored");
    expect(reveal).toContain("<OfferCta");
    expect(reveal).not.toContain("Got one question? Ask it. $13.");
    expect(reveal).toContain("result_card_clicked");
    expect(reveal).toContain("result_compare_clicked");
  });
});

describe("HomepageCalculatorHero contract", () => {
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
