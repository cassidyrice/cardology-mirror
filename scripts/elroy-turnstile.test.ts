import { describe, expect, test } from "bun:test";
import { verifyTurnstile } from "../lib/turnstile";

const env = {
  secret: "test-secret",
  expectedAction: "elroy_micro_reading",
  allowedHostnames: new Set(["cardblueprints.com"]),
};

test("accepts a matching successful response", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        action: "elroy_micro_reading",
        hostname: "cardblueprints.com",
      }),
    );
  await expect(verifyTurnstile("token", "203.0.113.1", env, fetcher)).resolves.toBe(
    true,
  );
});

test.each([
  { success: false, action: "elroy_micro_reading", hostname: "cardblueprints.com" },
  { success: true, action: "wrong", hostname: "cardblueprints.com" },
  { success: true, action: "elroy_micro_reading", hostname: "evil.example" },
])("rejects invalid verification %#", async (payload) => {
  const fetcher: typeof fetch = async () => new Response(JSON.stringify(payload));
  await expect(verifyTurnstile("token", "", env, fetcher)).resolves.toBe(false);
});

test("rejects non-2xx", async () => {
  const fetcher: typeof fetch = async () => new Response("nope", { status: 500 });
  await expect(verifyTurnstile("token", "", env, fetcher)).resolves.toBe(false);
});

test("rejects fetch failure", async () => {
  const fetcher: typeof fetch = async () => {
    throw new Error("network");
  };
  await expect(verifyTurnstile("token", "", env, fetcher)).resolves.toBe(false);
});

test("rejects missing secret", async () => {
  await expect(
    verifyTurnstile("token", "", { ...env, secret: "" }, fetch),
  ).resolves.toBe(false);
});
