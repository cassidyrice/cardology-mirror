import { describe, expect, test } from "bun:test";
import { isClientFunnelEventName } from "../lib/analytics";
import { mapFunnelEventToGa4, sanitizeGaEventParams } from "../lib/ga4";

const ELROY_EVENTS = [
  "elroy_teaser_shown",
  "elroy_opened",
  "elroy_birthdate_entered",
  "elroy_email_submitted",
  "elroy_micro_reading_viewed",
  "elroy_blueprint_clicked",
] as const;

test("allows Elroy funnel events", () => {
  for (const name of ELROY_EVENTS) {
    expect(isClientFunnelEventName(name)).toBe(true);
  }
});

test("maps micro-reading view to generate_lead without card payload", () => {
  const mapped = mapFunnelEventToGa4("elroy_micro_reading_viewed");
  expect(mapped.eventName).toBe("generate_lead");
  expect(mapped.params).toEqual({ lead_source: "elroy_micro_reading" });
});

test("strips sensitive params from GA payloads", () => {
  const cleaned = sanitizeGaEventParams({
    placement: "home",
    email: "p@example.com",
    birthdate: "2001-01-15",
    card: "Q♦",
    turnstileToken: "abc",
  });
  expect(cleaned.placement).toBe("home");
  expect(cleaned.email).toBeUndefined();
  expect(cleaned.birthdate).toBeUndefined();
  expect(cleaned.card).toBeUndefined();
  expect(cleaned.turnstileToken).toBeUndefined();
});
