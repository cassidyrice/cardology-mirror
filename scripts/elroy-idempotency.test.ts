import { describe, expect, test } from "bun:test";
import { buildElroyIdempotencyKey } from "../lib/elroy/idempotency";

const T0 = new Date("2026-08-08T12:03:00Z");

test("is stable within a ten-minute bucket", async () => {
  expect(await buildElroyIdempotencyKey("p@example.com", "2001-01-15", T0)).toBe(
    await buildElroyIdempotencyKey(
      "p@example.com",
      "2001-01-15",
      new Date("2026-08-08T12:09:59Z"),
    ),
  );
});

test("contains no raw PII", async () => {
  const key = await buildElroyIdempotencyKey("p@example.com", "2001-01-15", T0);
  expect(key).not.toContain("p@example.com");
  expect(key).not.toContain("2001-01-15");
  expect(key.startsWith("elroy-")).toBe(true);
});
