import { describe, expect, test } from "bun:test";

import {
  candidateFulfillmentDates,
  firstAvailableFulfillmentDate,
  localDateIso,
  orderTotalCents,
  validatePrimaryBirthdate,
  validateQuestion,
  validateRelevantBirthdates,
} from "../lib/my-question/core";

const TODAY = "2026-08-10";

describe("My Question birthdate eligibility", () => {
  test("accepts a real past calendar date", () => {
    expect(validatePrimaryBirthdate("1991-02-17", TODAY)).toEqual({
      ok: true,
      value: "1991-02-17",
    });
  });

  test("rejects impossible dates", () => {
    expect(validatePrimaryBirthdate("1991-02-30", TODAY)).toMatchObject({
      ok: false,
      code: "invalid_birthdate",
    });
  });

  test("rejects future dates", () => {
    expect(validatePrimaryBirthdate("2026-08-11", TODAY)).toMatchObject({
      ok: false,
      code: "future_birthdate",
    });
  });

  test("fails closed on the unsupported December 31 Joker boundary", () => {
    expect(validatePrimaryBirthdate("1991-12-31", TODAY)).toMatchObject({
      ok: false,
      code: "joker_boundary",
    });
  });
});

describe("My Question intake validation", () => {
  test("accepts and trims one focused relationship question", () => {
    expect(
      validateQuestion("  Why do we keep arguing about money?  "),
    ).toEqual({
      ok: true,
      value: "Why do we keep arguing about money?",
    });
  });

  test("rejects an empty question", () => {
    expect(validateQuestion("   ")).toMatchObject({
      ok: false,
      code: "question_required",
    });
  });

  test("rejects more than 600 characters", () => {
    expect(validateQuestion("a".repeat(601))).toMatchObject({
      ok: false,
      code: "question_too_long",
    });
  });

  test("rejects multiple questions", () => {
    expect(validateQuestion("Why is this happening? What should I do next?")).toMatchObject({
      ok: false,
      code: "multiple_questions",
    });
  });

  test.each([
    ["What treatment should I use for these symptoms?", "medical"],
    ["What legal strategy should I use in court?", "legal"],
    ["Which stock should I invest my savings in?", "financial"],
    ["Should I hurt myself tonight?", "crisis"],
    ["What mental health diagnosis do I have?", "mental_health"],
    ["Guarantee the exact date I will get married?", "guaranteed_prediction"],
    ["Tell me exactly what my partner is secretly thinking?", "mind_reading"],
  ])("rejects prohibited %s requests", (question, category) => {
    expect(validateQuestion(question)).toMatchObject({
      ok: false,
      code: "prohibited_question",
      category,
    });
  });

  test("accepts up to three distinct relevant birthdates", () => {
    expect(
      validateRelevantBirthdates(
        ["1989-04-08", "1990-07-12", "2000-01-01"],
        TODAY,
      ),
    ).toEqual({
      ok: true,
      value: ["1989-04-08", "1990-07-12", "2000-01-01"],
    });
  });

  test("rejects a fourth relevant birthdate", () => {
    expect(
      validateRelevantBirthdates(
        ["1989-04-08", "1990-07-12", "2000-01-01", "2001-01-01"],
        TODAY,
      ),
    ).toMatchObject({ ok: false, code: "too_many_relevant_birthdates" });
  });

  test("rejects duplicate relevant birthdates", () => {
    expect(
      validateRelevantBirthdates(["1989-04-08", "1989-04-08"], TODAY),
    ).toMatchObject({ ok: false, code: "duplicate_relevant_birthdate" });
  });
});

describe("My Question fulfillment capacity", () => {
  test("derives validation dates in America/Chicago instead of UTC", () => {
    expect(localDateIso(new Date("2026-08-11T02:00:00.000Z"))).toBe(
      "2026-08-10",
    );
  });

  test("starts with the next weekday in America/Chicago", () => {
    expect(
      candidateFulfillmentDates(
        new Date("2026-08-10T20:00:00.000Z"),
        3,
      ),
    ).toEqual(["2026-08-11", "2026-08-12", "2026-08-13"]);
  });

  test("rolls Friday and weekend starts to Monday", () => {
    expect(
      candidateFulfillmentDates(
        new Date("2026-08-14T20:00:00.000Z"),
        2,
      ),
    ).toEqual(["2026-08-17", "2026-08-18"]);
    expect(
      candidateFulfillmentDates(
        new Date("2026-08-15T20:00:00.000Z"),
        1,
      ),
    ).toEqual(["2026-08-17"]);
  });

  test("treats weekday holidays as fulfillment days", () => {
    expect(
      candidateFulfillmentDates(
        new Date("2026-09-06T20:00:00.000Z"),
        1,
      ),
    ).toEqual(["2026-09-07"]);
  });

  test("uses the first date with fewer than three assigned orders", () => {
    const dates = ["2026-08-11", "2026-08-12", "2026-08-13"];
    expect(
      firstAvailableFulfillmentDate(dates, {
        "2026-08-11": 3,
        "2026-08-12": 2,
      }),
    ).toBe("2026-08-12");
  });
});

describe("My Question pricing", () => {
  test("uses server-owned base and add-on totals", () => {
    expect(orderTotalCents(false)).toBe(9_900);
    expect(orderTotalCents(true)).toBe(12_800);
  });
});
