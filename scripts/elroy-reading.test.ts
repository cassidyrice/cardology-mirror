import { describe, expect, test } from "bun:test";
import { buildElroyMicroReading } from "../lib/elroy/micro-reading";

const BANNED =
  /\b(PTSD|diagnos(?:e|is)|bipolar|narcissis(?:m|t)|cancerous|abuse history)\b/i;

describe("buildElroyMicroReading", () => {
  test("builds the verified January 15 example", () => {
    const result = buildElroyMicroReading("2001-01-15");
    expect(result.card.birthCard).toBe("Q♦");
    expect(result.card.birthCardLabel).toBe("Queen of Diamonds");
    expect(result.card.rulingCards).toEqual(["7♣"]);
    expect(result.reading.core.length).toBeGreaterThan(20);
    expect(result.reading.tension.length).toBeGreaterThan(20);
    expect(result.reading.reflection).toEndWith("?");
    expect(result.reading.disclaimer).toContain("reflection");
  });

  test("is deterministic", () => {
    expect(buildElroyMicroReading("2001-01-15")).toEqual(
      buildElroyMicroReading("2001-01-15"),
    );
  });

  test("does not generate a Joker reading", () => {
    expect(() => buildElroyMicroReading("1990-12-31")).toThrow("Joker");
  });

  test("keeps copy bounded and non-diagnostic for every calendar mapping", () => {
    for (let month = 1; month <= 12; month += 1) {
      const days = new Date(Date.UTC(2024, month, 0)).getUTCDate();
      for (let day = 1; day <= days; day += 1) {
        if (month === 12 && day === 31) continue;
        const birthdate = `2000-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const result = buildElroyMicroReading(birthdate);
        for (const value of Object.values(result.reading)) {
          expect(value.length).toBeLessThanOrEqual(420);
          expect(value).not.toMatch(BANNED);
        }
      }
    }
  });
});
