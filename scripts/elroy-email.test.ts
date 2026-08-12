import { describe, expect, test } from "bun:test";
import { renderElroyReadingEmail } from "../lib/elroy/email";
import { buildElroyMicroReading } from "../lib/elroy/micro-reading";
import { sendEmail } from "../lib/email";

const reading = buildElroyMicroReading("2001-01-15");
const blueprintUrl = "https://cardblueprints.com/products/personal-card-blueprint";

test("renders subject and bodies without raw birth date", () => {
  const rendered = renderElroyReadingEmail(reading, blueprintUrl);
  expect(rendered.subject).toContain("Queen of Diamonds");
  expect(rendered.subject).not.toContain("2001-01-15");
  expect(rendered.text).toContain(reading.reading.core);
  expect(rendered.text).toContain(blueprintUrl);
  expect(rendered.text).not.toContain("2001-01-15");
  expect(rendered.html).toContain("Queen of Diamonds");
  expect(rendered.html).toContain(blueprintUrl);
  expect(rendered.html).not.toContain("2001-01-15");
});

test("escapes HTML in reading fields", () => {
  const dirty = {
    ...reading,
    reading: {
      ...reading.reading,
      core: 'Hello <script>alert(1)</script> & "x"',
    },
  };
  const rendered = renderElroyReadingEmail(dirty, blueprintUrl);
  expect(rendered.html).toContain("&lt;script&gt;");
  expect(rendered.html).not.toContain("<script>");
});

test("sendEmail rejects missing config without logging recipient", async () => {
  await expect(
    sendEmail(
      { to: "p@example.com", subject: "x", text: "y" },
      { apiKey: "", from: "" },
    ),
  ).rejects.toThrow(/not configured/i);
});

test("normalizeFromAddress wraps bare emails", async () => {
  const { normalizeFromAddress } = await import("../lib/email");
  expect(normalizeFromAddress("readings@cardologypro.com")).toBe(
    "Card Blueprints <readings@cardologypro.com>",
  );
  expect(normalizeFromAddress('Card Blueprints <a@b.com>')).toBe(
    "Card Blueprints <a@b.com>",
  );
});

test("sendEmail rejects non-2xx and sends idempotency header", async () => {
  let headers: Headers | Record<string, string> | undefined;
  const fetcher: typeof fetch = async (_url, init) => {
    headers = init?.headers as Headers | Record<string, string>;
    return new Response("nope", { status: 500 });
  };
  await expect(
    sendEmail(
      {
        to: "p@example.com",
        subject: "x",
        text: "y",
        idempotencyKey: "elroy-abc",
      },
      { apiKey: "rk", from: "from@example.com" },
      fetcher,
    ),
  ).rejects.toThrow(/500/);
  const asRecord = headers as Record<string, string>;
  expect(asRecord["Idempotency-Key"] || asRecord["idempotency-key"]).toBe(
    "elroy-abc",
  );
});
