import { describe, expect, test } from "bun:test";

import {
  signOrderAccess,
  verifyOrderAccess,
} from "../lib/my-question/token";

const SECRET = "test-only-secret-that-is-long-enough-for-hmac";
const NOW = new Date("2026-08-10T20:00:00.000Z");

describe("My Question signed order links", () => {
  test("round-trips an unexpired fulfillment link", async () => {
    const token = await signOrderAccess(
      {
        orderId: "order_123",
        scope: "fulfill",
        expiresAt: "2026-09-10T20:00:00.000Z",
      },
      SECRET,
    );

    expect(
      await verifyOrderAccess(token, SECRET, "fulfill", NOW),
    ).toEqual({
      ok: true,
      payload: {
        orderId: "order_123",
        scope: "fulfill",
        expiresAt: "2026-09-10T20:00:00.000Z",
      },
    });
  });

  test("rejects a tampered payload", async () => {
    const token = await signOrderAccess(
      {
        orderId: "order_123",
        scope: "fulfill",
        expiresAt: "2026-09-10T20:00:00.000Z",
      },
      SECRET,
    );
    const [payload, signature] = token.split(".");
    const tampered = `${payload.slice(0, -1)}A.${signature}`;

    expect(
      await verifyOrderAccess(tampered, SECRET, "fulfill", NOW),
    ).toMatchObject({ ok: false, code: "invalid_token" });
  });

  test("rejects a token used for the wrong purpose", async () => {
    const token = await signOrderAccess(
      {
        orderId: "order_123",
        scope: "onboarding",
        expiresAt: "2026-09-10T20:00:00.000Z",
      },
      SECRET,
    );

    expect(
      await verifyOrderAccess(token, SECRET, "fulfill", NOW),
    ).toMatchObject({ ok: false, code: "wrong_scope" });
  });

  test("rejects an expired token", async () => {
    const token = await signOrderAccess(
      {
        orderId: "order_123",
        scope: "fulfill",
        expiresAt: "2026-08-10T19:59:59.000Z",
      },
      SECRET,
    );

    expect(
      await verifyOrderAccess(token, SECRET, "fulfill", NOW),
    ).toMatchObject({ ok: false, code: "expired_token" });
  });

  test("refuses a short signing secret", async () => {
    await expect(
      signOrderAccess(
        {
          orderId: "order_123",
          scope: "fulfill",
          expiresAt: "2026-09-10T20:00:00.000Z",
        },
        "short",
      ),
    ).rejects.toThrow("Signing secret must be at least 32 characters");
  });
});
