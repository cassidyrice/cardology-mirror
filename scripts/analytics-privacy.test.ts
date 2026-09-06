import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  CLIENT_FUNNEL_EVENTS,
  isClientFunnelEventName,
} from "../lib/analytics";
import { sanitizeGaEventParams } from "../lib/ga4";

const SENSITIVE_KEYS = ["birthdate", "birth_date", "dob", "bd", "email", "card"];

test("new reveal funnel events are registered", () => {
  for (const name of [
    "result_card_clicked",
    "result_compare_clicked",
    "deep_dive_delivered",
  ] as const) {
    expect(isClientFunnelEventName(name)).toBe(true);
    expect(CLIENT_FUNNEL_EVENTS).toContain(name);
  }
});

test("browser analytics payload does not accept birthdate fields", () => {
  const source = readFileSync(
    new URL("../components/analytics/AnalyticsCapture.tsx", import.meta.url),
    "utf8",
  );
  for (const key of SENSITIVE_KEYS) {
    expect(source).not.toContain(`${key}:`);
    expect(source).not.toContain(`"${key}"`);
  }
  expect(source).toContain("offerSlug: context.offerSlug");
  expect(source).toContain("placement: context.placement");
});

test("GA sanitization strips birthdate from event params", () => {
  const cleaned = sanitizeGaEventParams({
    placement: "home-reveal",
    birthdate: "2001-01-15",
    birth_date: "2001-01-15",
    dob: "2001-01-15",
  });
  expect(cleaned.placement).toBe("home-reveal");
  for (const key of SENSITIVE_KEYS) {
    expect(cleaned[key]).toBeUndefined();
  }
});
