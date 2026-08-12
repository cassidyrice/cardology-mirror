import { describe, expect, test } from "bun:test";
import { POST } from "../app/api/elroy/micro-reading/route";

function makeRequest(
  url = "https://cardblueprints.com/api/elroy/micro-reading",
  init: RequestInit = {},
): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: "{}",
    ...init,
  });
}

describe("Elroy micro-reading route boundary", () => {
  test("rejects a foreign browser origin and disables caching", async () => {
    const response = await POST(
      makeRequest(undefined, { headers: { origin: "https://evil.example" } }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("compares the browser origin to the actual request origin", async () => {
    const response = await POST(
      makeRequest("http://localhost:3577/api/elroy/micro-reading", {
        headers: { origin: "http://localhost:3578" },
      }),
    );
    expect(response.status).toBe(403);
  });

  test("accepts the current preview origin before parsing JSON", async () => {
    const response = await POST(
      makeRequest("https://elroy-preview.pages.dev/api/elroy/micro-reading", {
        headers: { origin: "https://elroy-preview.pages.dev" },
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON" });
  });

  test("allows server requests without an Origin header", async () => {
    const response = await POST(makeRequest(undefined, { body: "not-json" }));
    expect(response.status).toBe(400);
  });

  test("rejects methods other than POST", async () => {
    const response = await POST(
      new Request("https://cardblueprints.com/api/elroy/micro-reading", {
        method: "GET",
      }),
    );
    expect(response.status).toBe(405);
  });

  test("rejects declared and actual bodies larger than 8 KiB", async () => {
    const declared = await POST(
      makeRequest(undefined, { headers: { "content-length": "8193" } }),
    );
    expect(declared.status).toBe(400);

    const actual = await POST(
      makeRequest(undefined, { body: JSON.stringify({ padding: "x".repeat(8193) }) }),
    );
    expect(actual.status).toBe(400);
  });

  test("measures the actual body limit in UTF-8 bytes", async () => {
    const response = await POST(
      makeRequest(undefined, {
        body: JSON.stringify({ padding: "é".repeat(4_100) }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request too large" });
  });

  test("accepts a valid-shaped body without Turnstile and fails only on missing email infra", async () => {
    const response = await POST(
      makeRequest(undefined, {
        body: JSON.stringify({
          birthdate: "2001-01-15",
          email: "p@example.com",
          consent: true,
          source: "/birth-card-calculator",
        }),
      }),
    );
    // Without RESEND bindings the route still builds the reading path; contact/email
    // may 503, but Turnstile absence must never block as 403.
    expect([200, 503]).toContain(response.status);
    expect(response.status).not.toBe(403);
  });
});
