import { describe, expect, test } from "bun:test";

import { birthdateBySlug } from "../../lib/seo-cards";
import { generateStudioScript, studioContext, type StudioInput } from "./studio-core";

const base = {
  duration: 15,
  goal: "free_calculator",
} as const;

describe("Card Blueprints Script Studio", () => {
  test("ships the complete card and birthday selectors", () => {
    const context = studioContext();
    expect(context.cards).toHaveLength(52);
    expect(context.dates).toHaveLength(366);
    expect(context.dates.find((date) => date.slug === "december-31")?.cardLabel).toBe("Joker");
  });

  test("uses the deterministic Card Blueprints birthday result", () => {
    const source = birthdateBySlug("july-12");
    const output = generateStudioScript({
      ...base,
      postType: "birthday_reveal",
      dateSlug: "july-12",
    });
    expect(source).not.toBeNull();
    expect(output.subjectLabel).toContain(source!.card.label);
    expect(output.factsChecked.join(" ")).toContain(source!.card.label);
  });

  test("handles December 31 as the Joker without guessing a meaning", () => {
    const output = generateStudioScript({
      ...base,
      postType: "birthday_reveal",
      dateSlug: "december-31",
    });
    expect(output.subjectLabel).toBe("December 31 · Joker");
    expect(output.voiceover).toContain("Cardology tradition");
    expect(output.voiceover).not.toMatch(/scientifically proven|invented as a solar calendar/i);
    expect(output.visualAssets[0]).toContain("Joker art");
  });

  test("pulls card meaning language from the approved data layer", () => {
    const output = generateStudioScript({
      ...base,
      postType: "card_meaning",
      cardSlug: "7-of-clubs",
    });
    expect(output.subjectLabel).toContain("The Analytical Creator");
    expect(output.voiceover).toMatch(/penetrating analysis and pattern recognition/i);
  });

  test("treats a same-card pair equally", () => {
    const output = generateStudioScript({
      ...base,
      postType: "compatibility",
      cardASlug: "ace-of-hearts",
      cardBSlug: "ace-of-hearts",
    });
    expect(output.voiceover).toMatch(/shared equally/i);
    expect(output.voiceover).toMatch(/neither side is heavier/i);
    expect(output.factsChecked.join(" ")).toMatch(/same-card rule/i);
  });

  test("uses the approved paid product wording", () => {
    const output = generateStudioScript({
      ...base,
      postType: "card_meaning",
      cardSlug: "king-of-hearts",
      goal: "ai_voice",
    });
    expect(output.cta).toBe("The $99 AI Voice Reading includes 90 days of access.");
    expect(output.caption).toContain("$99 AI Voice Reading includes 90 days of access");
  });

  test("blocks risky trend promises", () => {
    const output = generateStudioScript({
      ...base,
      postType: "birthday_reveal",
      dateSlug: "july-12",
      trendIdea: "This proves your destiny and guarantees money",
    });
    expect(output.voiceover).not.toMatch(/proves your destiny|guarantees money/i);
    expect(output.warnings.join(" ")).toMatch(/risky promise/i);
  });

  test("uses trend ideas only as a safe pacing style", () => {
    const plain = generateStudioScript({
      ...base,
      postType: "birthday_reveal",
      dateSlug: "july-12",
    });
    const paced = generateStudioScript({
      ...base,
      postType: "birthday_reveal",
      dateSlug: "july-12",
      trendIdea: "POV reveal with a fast cut",
    });
    expect(paced.hook).not.toBe(plain.hook);
    expect(paced.hook).toStartWith("POV:");
    expect(paced.voiceover).not.toContain("fast cut");
  });

  test("keeps every card and pair script as complete sentences", () => {
    const context = studioContext();
    const samples: StudioInput[] = [];
    for (const card of context.cards) {
      samples.push({ ...base, postType: "card_meaning", cardSlug: card.slug });
      samples.push({ ...base, duration: 30, postType: "birthday_reveal", dateSlug: context.dates.find((date) => date.cardLabel === card.label)!.slug });
    }
    for (const a of context.cards) {
      for (const b of context.cards) {
        samples.push({ ...base, postType: "compatibility", cardASlug: a.slug, cardBSlug: b.slug });
      }
    }

    for (const sample of samples) {
      const output = generateStudioScript(sample);
      expect(output.voiceover).not.toMatch(/\b(and|or|the|a|an|to|from|with|into|of)\.$/i);
      expect(output.voiceover).not.toMatch(/\b(brings bringing|is you\b|become you\b)/i);
      for (const scene of output.scenes) {
        expect(scene.voiceover).toMatch(/[.!?]$/);
      }
    }
  });

  test("keeps every 30-second card meaning at least 65 words", () => {
    const context = studioContext();
    const goals = ["free_calculator", "ai_voice", "brand_awareness"] as const;
    for (const card of context.cards) {
      for (const goal of goals) {
        for (const variant of [0, 1, 2]) {
          const output = generateStudioScript({
            postType: "card_meaning",
            duration: 30,
            goal,
            cardSlug: card.slug,
            variant,
          });
          expect(output.wordCount).toBeGreaterThanOrEqual(65);
          expect(output.wordCount).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  test("keeps the old prediction disclaimer out of spoken scripts", () => {
    const output = generateStudioScript({
      postType: "birthday_reveal",
      duration: 30,
      goal: "free_calculator",
      dateSlug: "december-31",
    });
    expect(output.voiceover).not.toMatch(/mirror, not a forecast|reflection, not a prediction/i);
    expect(output.caption).toContain("A mirror, not a forecast");
  });

  test("keeps scripts and screen text short", () => {
    const samples: StudioInput[] = [
      { ...base, postType: "birthday_reveal", dateSlug: "july-12" },
      { ...base, postType: "birthday_reveal", dateSlug: "december-31" },
      { ...base, postType: "card_meaning", cardSlug: "7-of-clubs" },
      { ...base, postType: "compatibility", cardASlug: "ace-of-hearts", cardBSlug: "king-of-spades" },
      { ...base, postType: "compatibility", cardASlug: "ace-of-hearts", cardBSlug: "ace-of-hearts" },
      { ...base, duration: 30, postType: "card_meaning", cardSlug: "queen-of-diamonds" },
    ];

    for (const sample of samples) {
      const output = generateStudioScript(sample);
      if (output.duration === 15) {
        expect(output.wordCount).toBeGreaterThanOrEqual(35);
        expect(output.wordCount).toBeLessThanOrEqual(55);
      } else {
        expect(output.wordCount).toBeGreaterThanOrEqual(65);
        expect(output.wordCount).toBeLessThanOrEqual(100);
      }
      for (const scene of output.scenes) {
        expect(scene.screenText.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(8);
      }
    }
  });
});
