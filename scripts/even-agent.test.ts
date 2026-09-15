// The glasses agent's two pieces of real logic: turning transcribed speech into
// a date, and fitting an answer onto a 48-column display.
import { expect, test } from "bun:test";

import { getReading } from "../lib/engine";
import { birthCardSlug } from "../lib/birth-card-calculator";
import { compatForCard } from "../lib/compat-pairs";
import {
  EVEN_LINE_WIDTH,
  EVEN_MAX_LINES,
  buildEvenReply,
  fit,
  parseSpokenDates,
  wrap,
} from "../lib/even-agent";

const deps = { getReading, birthCardSlug, compatForCard };

test("parses the ways a birthday gets spoken", () => {
  expect(parseSpokenDates("my card, June 14 1946")).toEqual(["1946-06-14"]);
  expect(parseSpokenDates("what is the card for 14 June 1946")).toEqual(["1946-06-14"]);
  expect(parseSpokenDates("card for 6/14/1946")).toEqual(["1946-06-14"]);
  expect(parseSpokenDates("card for 1946-06-14")).toEqual(["1946-06-14"]);
  expect(parseSpokenDates("born June 14th 1946")).toEqual(["1946-06-14"]);
});

test("keeps two spoken dates in order and rejects impossible ones", () => {
  expect(parseSpokenDates("match June 14 1946 and March 16 1965")).toEqual([
    "1946-06-14",
    "1965-03-16",
  ]);
  expect(parseSpokenDates("February 30 1990")).toEqual([]);
  expect(parseSpokenDates("13/45/1990")).toEqual([]);
});

test("falls back to the configured birthday only when none is spoken", () => {
  expect(parseSpokenDates("what is my card", "1965-03-16")).toEqual(["1965-03-16"]);
  expect(parseSpokenDates("card for June 14 1946", "1965-03-16")).toEqual(["1946-06-14"]);
  expect(parseSpokenDates("what is my card")).toEqual([]);
  // an unrelated remark must not be answered with the default birthday
  expect(parseSpokenDates("hello there", "1965-03-16")).toEqual([]);
  expect(parseSpokenDates("period", "1965-03-16")).toEqual(["1965-03-16"]);
});

test("wrapping never exceeds the display width and never splits a word", () => {
  const long = "The Wealthy King sits in the Venus position of the Three of Diamonds spread";
  for (const line of wrap(long)) expect(line.length).toBeLessThanOrEqual(EVEN_LINE_WIDTH);
  expect(wrap(long).join(" ")).toBe(long);
  expect(fit(long.repeat(10)).split("\n").length).toBeLessThanOrEqual(EVEN_MAX_LINES);
});

test("a birthday returns its card, within the display budget", async () => {
  const reply = await buildEvenReply("what is my card", ["1946-06-14"], deps);
  expect(reply).toContain("3♦");
  for (const line of reply.split("\n")) expect(line.length).toBeLessThanOrEqual(EVEN_LINE_WIDTH);
});

test("two dates return the connection between them", async () => {
  const reply = await buildEvenReply(
    "match June 14 1946 and January 15 1977",
    ["1946-06-14", "1977-01-15"],
    deps,
  );
  expect(reply).toContain("3♦");
  expect(reply).toContain("Q♦");
  expect(reply.toLowerCase()).toContain("lifetime gift");
});

test("asking about timing returns the active period, not the card blurb", async () => {
  const reply = await buildEvenReply("what period am I in", ["1946-06-14"], deps);
  expect(reply.toLowerCase()).toMatch(/period|year/);
  expect(reply.split("\n").length).toBeLessThanOrEqual(EVEN_MAX_LINES);
});

test("no date and no default asks for one instead of guessing", async () => {
  const reply = await buildEvenReply("hello", [], deps);
  expect(reply.toLowerCase()).toContain("birthday");
});
