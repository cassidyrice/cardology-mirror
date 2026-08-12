import { describe, expect, test } from "bun:test";
import { classifyElroyBirthdate, normalizeElroyRequest } from "../lib/elroy/input";

const NOW = new Date("2026-08-08T12:00:00.000Z");

describe("classifyElroyBirthdate", () => {
  test("accepts leap day as a standard 9 of Clubs date", () => {
    expect(classifyElroyBirthdate("2000-02-29", NOW)).toEqual({
      kind: "standard",
      birthdate: "2000-02-29",
      birthCard: "9♣",
    });
  });

  test("returns the Joker boundary for December 31", () => {
    expect(classifyElroyBirthdate("1990-12-31", NOW)).toEqual({
      kind: "joker",
      birthdate: "1990-12-31",
      birthCard: "Joker",
    });
  });

  test.each(["", "2025-02-29", "2026-13-01", "2026-08-09", "not-a-date"])(
    "rejects invalid or future date %s",
    (birthdate) => expect(() => classifyElroyBirthdate(birthdate, NOW)).toThrow(),
  );
});

describe("normalizeElroyRequest", () => {
  test("normalizes email and accepts consent", () => {
    expect(
      normalizeElroyRequest(
        {
          birthdate: "2001-01-15",
          email: "  Person@Example.COM ",
          consent: true,
          source: "/birth-card-calculator?ignored=1",
        },
        NOW,
      ),
    ).toMatchObject({
      birthdate: "2001-01-15",
      email: "person@example.com",
      consent: true,
      source: "/birth-card-calculator",
    });
  });

  test("rejects the Joker boundary without resolving a standard reading", () => {
    expect(() =>
      normalizeElroyRequest(
        {
          birthdate: "1990-12-31",
          email: "p@example.com",
          consent: true,
        },
        NOW,
      ),
    ).toThrow("Joker boundary");
  });

  test("rejects missing consent", () => {
    expect(() =>
      normalizeElroyRequest(
        {
          birthdate: "2001-01-15",
          email: "p@example.com",
          consent: false,
        },
        NOW,
      ),
    ).toThrow("consent");
  });
});
