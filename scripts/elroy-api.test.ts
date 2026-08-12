import { describe, expect, test } from "bun:test";
import { handleElroyMicroReading, type ElroyDeps } from "../lib/elroy/handler";
import { buildElroyMicroReading } from "../lib/elroy/micro-reading";

function baseDeps(overrides: Partial<ElroyDeps> = {}): ElroyDeps {
  return {
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
};

test("malformed input returns 400 and runs no deps", async () => {
  let called = false;
  const result = await handleElroyMicroReading(
    { ...good, email: "bad" },
    baseDeps({
      addContact: async () => {
        called = true;
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
    baseDeps({
      addContact: async () => {
        called = true;
      },
    }),
  );
  expect(result.status).toBe(422);
  expect(called).toBe(false);
});

test("contact failure returns 503 without reading", async () => {
  const result = await handleElroyMicroReading(
    good,
    baseDeps({
      addContact: async () => {
        throw new Error("down");
      },
    }),
  );
  expect(result.status).toBe(503);
  expect(result.body.reading).toBeUndefined();
});

test("email failure still returns reading with emailError", async () => {
  const result = await handleElroyMicroReading(
    good,
    baseDeps({
      sendReadingEmail: async () => {
        throw new Error("Resend send failed: 403 domain not verified");
      },
    }),
  );
  expect(result.status).toBe(200);
  expect(result.body.emailSent).toBe(false);
  expect(result.body.emailError).toBe("resend_rejected");
  expect((result.body.card as { birthCard: string }).birthCard).toBe("Q♦");
});

test("full success", async () => {
  const order: string[] = [];
  const result = await handleElroyMicroReading(
    good,
    baseDeps({
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
  expect(order).toEqual(["build", "contact", "email"]);
  const serialized = JSON.stringify(result.body);
  expect(serialized).not.toContain("p@example.com");
  expect(serialized).not.toContain("2001-01-15");
});
