import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

import { POST } from "../app/api/reading/route";
import { canonicalCalendarDate } from "../lib/birthdate";
import { EngineError, getReading } from "../lib/engine";
import { readingApiRequest } from "../lib/reading-request";

describe("canonicalCalendarDate", () => {
  test("accepts US month/day/year and ISO, including 2/17/1991", () => {
    for (const value of [
      "2/17/1991",
      "02/17/1991",
      "2-17-1991",
      "2 17 1991",
      "1991-02-17",
      "1991-2-17",
      " 2/17/1991 ",
    ]) {
      expect(canonicalCalendarDate(value)).toBe("1991-02-17");
    }
  });

  test("accepts other real US dates, including leap day", () => {
    expect(canonicalCalendarDate("1/1/2001")).toBe("2001-01-01");
    expect(canonicalCalendarDate("12/30/1990")).toBe("1990-12-30");
    expect(canonicalCalendarDate("2/29/2000")).toBe("2000-02-29");
  });

  test("rejects impossible and ambiguous dates", () => {
    for (const value of [
      "2/30/1991",
      "02/29/1991",
      "2/29/1900",
      "1991-02-31",
      "13/1/1991",
      "0/17/1991",
      "2/0/1991",
      "17/2/1991",
      "2/17/91",
      "not-a-date",
      "",
    ]) {
      expect(canonicalCalendarDate(value)).toBeNull();
    }
  });
});

describe("getReading birthdate", () => {
  test("2/17/1991 continues as the 8 of diamonds", async () => {
    const reading = await getReading("2/17/1991", "2026-09-22");
    expect(reading.archetype.birth_card).toBe("8♦");
    expect(reading.inputs.birthdate).toBe("02/17/1991");
    expect(reading.inputs.target_date).toBe("2026-09-22");
  });

  test("impossible dates fail clearly", async () => {
    await expect(getReading("2/30/1991")).rejects.toThrow("invalid birthdate: 2/30/1991");
    await expect(getReading("1991-02-31")).rejects.toThrow("invalid birthdate: 1991-02-31");
  });

  test("December 31 stays the Joker refusal, not an invalid date", async () => {
    const error = await getReading("12/31/1990").then(
      () => {
        throw new Error("expected rejection");
      },
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(EngineError);
    expect((error as EngineError).code).toBe("JOKER_UNSUPPORTED");
    expect((error as EngineError).message.startsWith("invalid birthdate")).toBe(false);
  });
});

describe("today reading request", () => {
  test("posts the birthday so middleware cannot strip it", () => {
    const { url, init } = readingApiRequest("2/17/1991", "2026-09-22");
    expect(url).toBe("/api/reading");
    expect(url.includes("birthdate")).toBe(false);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      birthdate: "2/17/1991",
      date: "2026-09-22",
    });
  });

  test("POST accepts 2/17/1991 and rejects February 30", async () => {
    const ok = await POST(
      new NextRequest("https://example.test/api/reading", {
        method: "POST",
        body: JSON.stringify({ birthdate: "2/17/1991", date: "2026-09-22" }),
      }),
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).archetype.birth_card).toBe("8♦");

    const bad = await POST(
      new NextRequest("https://example.test/api/reading", {
        method: "POST",
        body: JSON.stringify({ birthdate: "2/30/1991" }),
      }),
    );
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: "invalid birthdate: 2/30/1991" });
  });
});
