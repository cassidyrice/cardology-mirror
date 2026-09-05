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
  test("home is the calculator landing; explore keeps the library", () => {
    const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
    const explore = readFileSync(new URL("../app/explore/page.tsx", import.meta.url), "utf8");
    const header = readFileSync(
      new URL("../components/seo/SiteHeader.tsx", import.meta.url),
      "utf8",
    );
    const footer = readFileSync(
      new URL("../components/seo/SiteFooter.tsx", import.meta.url),
      "utf8",
    );
    const reveal = readFileSync(
      new URL("../components/seo/Reveal.tsx", import.meta.url),
      "utf8",
    );
    const landing = readFileSync(
      new URL("../components/seo/LandingCalculator.tsx", import.meta.url),
      "utf8",
    );

    expect(home).toContain("LandingCalculator");
    expect(home).toContain("HomeContentCue");
    expect(home).not.toContain("TodaysCardSection");
    expect(home).not.toContain("Learn more");
    expect(home).not.toContain("LiveReadingSection");
    expect(home).not.toContain("DeepDiveSection");
    expect(home).toContain('absolute: HOME_TITLE');
    expect(home).toContain("Find Your Birth Card | Card Blueprints");

    expect(explore).toContain("Everything under the hood");
    expect(explore).toContain("Explore Card Blueprints");
    expect(explore).toContain("HomepageCalculatorHero");
    expect(explore).toContain("TodaysCardSection");
    expect(explore).toContain("DeepDiveSection");

    expect(landing).toContain("Which card were you born under?");
    expect(landing).toContain("Your birthday adds up to one card. Same date, same card, every time.");
    expect(landing).toContain("Show my card");
    expect(landing).toContain("Never stored");

    expect(reveal).toContain("Your strength");
    expect(reveal).toContain("Where it trips you");
    expect(reveal).toContain("Right now");
    expect(reveal).toContain("Want posts written for your business");
    expect(reveal).toContain("See 7 days free");
    expect(reveal).toContain("/content-engine");
    expect(reveal).toContain("engine_link_clicked");
    expect(reveal).toContain("reveal_shown");
    expect(reveal).not.toContain("Something to notice this week");
    expect(reveal).not.toContain("The same math runs a calendar");

    expect(header).toContain("/content-engine");
    expect(header).toContain("Create content");
    expect(header).not.toContain('label: "Learn more"');
    expect(header).not.toContain('href="/explore"');
    expect(header).not.toContain("Get a Reading");
    expect(header).not.toContain("/karma-reading");

    expect(footer).toContain("Learn more");
    expect(footer).toContain("/explore");
    expect(footer).toContain("Content Engine");
    expect(footer).toContain("/content-engine");
    expect(footer).toContain("Deep Dive ($9)");
    expect(footer).not.toContain("Reading Day waitlist");
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
