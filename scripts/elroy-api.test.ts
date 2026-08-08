import { describe, expect, test } from "bun:test";
import { handleElroyMicroReading, type ElroyDeps } from "../lib/elroy/handler";
import { buildElroyMicroReading } from "../lib/elroy/micro-reading";

function baseDeps(overrides: Partial<ElroyDeps> = {}): ElroyDeps {
  return {
    verifyTurnstile: async () => true,
    addContact: async () => undefined,
    buildReading: (birthdate) => buildElroyMicroReading(birthdate),
    sendReadingEmail: async () => undefined,
    now: () => new Date("2026-08-08T12:00:00Z"),
    ...overrides,
  };
}

const good = {
  birthdate: "2001-01-15",
  email: "p@example.com",
  consent: true,
  source: "/birth-card-calculator",
  turnstileToken: "tok",
};

test("malformed input returns 400 and runs no deps", async () => {
  let called = false;
  const result = await handleElroyMicroReading(
    { ...good, email: "bad" },
    "1.1.1.1",
    baseDeps({
      verifyTurnstile: async () => {
        called = true;
        return true;
      },
    }),
  );
  expect(result.status).toBe(400);
  expect(called).toBe(false);
});

test("joker date returns 422 without side effects", async () => {
  let called = false;
  const result = await handleElroyMicroReading(
    { ...good, birthdate: "1990-12-31" },
    "1.1.1.1",
    baseDeps({
      verifyTurnstile: async () => {
        called = true;
        return true;
      },
    }),
  );
  expect(result.status).toBe(422);
  expect(called).toBe(false);
});

test("invalid turnstile returns 403", async () => {
  let contact = false;
  const result = await handleElroyMicroReading(
    good,
    "1.1.1.1",
    baseDeps({
      verifyTurnstile: async () => false,
      addContact: async () => {
        contact = true;
      },
    }),
  );
  expect(result.status).toBe(403);
  expect(contact).toBe(false);
});

test("contact failure returns 503 without reading", async () => {
  const result = await handleElroyMicroReading(
    good,
    "1.1.1.1",
    baseDeps({
      addContact: async () => {
        throw new Error("down");
      },
    }),
  );
  expect(result.status).toBe(503);
  expect(result.body.reading).toBeUndefined();
});

test("email failure still returns reading", async () => {
  const result = await handleElroyMicroReading(
    good,
    "1.1.1.1",
    baseDeps({
      sendReadingEmail: async () => {
        throw new Error("mail");
      },
    }),
  );
  expect(result.status).toBe(200);
  expect(result.body.emailSent).toBe(false);
  expect((result.body.card as { birthCard: string }).birthCard).toBe("Q♦");
});

test("full success", async () => {
  const order: string[] = [];
  const result = await handleElroyMicroReading(
    good,
    "1.1.1.1",
    baseDeps({
      verifyTurnstile: async () => {
        order.push("turnstile");
        return true;
      },
      buildReading: (d) => {
        order.push("build");
        return buildElroyMicroReading(d);
      },
      addContact: async () => {
        order.push("contact");
      },
      sendReadingEmail: async () => {
        order.push("email");
      },
    }),
  );
  expect(result.status).toBe(200);
  expect(result.body.emailSent).toBe(true);
  expect(order).toEqual(["turnstile", "build", "contact", "email"]);
  const serialized = JSON.stringify(result.body);
  expect(serialized).not.toContain("p@example.com");
  expect(serialized).not.toContain("2001-01-15");
  expect(serialized).not.toContain("tok");
});
