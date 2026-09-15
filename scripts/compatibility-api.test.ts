// POST /api/compatibility — the two-birthday comparison the glasses app and the
// Even agent both call. Exercised through the route handler with real Requests,
// so the error shaping and CORS headers are covered, not just the engine.
import { expect, test } from "bun:test";

import { OPTIONS, POST } from "../app/api/compatibility/route";

const post = (body: unknown, raw?: string) =>
  POST(
    new Request("https://cardblueprints.com/api/compatibility", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw ?? JSON.stringify(body),
    }),
  );

test("returns both cards, the one-way seats, and the shared cards", async () => {
  const res = await post({ a: "1965-03-16", b: "1946-06-14" });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.a.label).toBe("7 of Diamonds");
  expect(data.b.label).toBe("3 of Diamonds");
  // Landing on someone's board is not symmetric: B holds A in Mars, A does not
  // hold B at all. A merged answer would invent a connection.
  expect(data.aSeesB).toBeNull();
  expect(data.bSeesA.position).toBe("Mars");
  expect(data.shared.length).toBeGreaterThan(0);
  for (const s of data.shared) expect(s.label).toMatch(/ of (Hearts|Diamonds|Clubs|Spades)$/);
});

test("every response carries CORS, including errors", async () => {
  const ok = await post({ a: "1965-03-16", b: "1946-06-14" });
  const bad = await post({ a: "nope", b: "1946-06-14" });
  const preflight = await OPTIONS();
  for (const res of [ok, bad, preflight]) {
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  }
  expect(preflight.status).toBe(204);
});

test("a null JSON body is a 400, not an uncaught 500", async () => {
  // `null` parses cleanly, so a try/catch around req.json() does not cover it.
  const res = await post(undefined, "null");
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe("invalid JSON body");
});

test("malformed JSON and missing fields are 400 with the failing side named", async () => {
  expect((await post(undefined, "{oops")).status).toBe(400);
  const missing = await post({ a: "1965-03-16" });
  expect(missing.status).toBe(400);
  expect((await missing.json()).side).toBe("b");
  const firstBad = await post({ a: "1991-02-29", b: "1946-06-14" });
  expect(firstBad.status).toBe(400);
  expect((await firstBad.json()).side).toBe("a");
});

test("December 31 is a 422 naming which side is the Joker", async () => {
  const res = await post({ a: "1946-06-14", b: "1990-12-31" });
  expect(res.status).toBe(422);
  const data = await res.json();
  expect(data.code).toBe("JOKER_UNSUPPORTED");
  expect(data.side).toBe("b");
});

test("two people on the same birth card still get an answer", async () => {
  const res = await post({ a: "1946-06-14", b: "1946-06-14" });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.a.label).toBe(data.b.label);
  expect(data.shared.length).toBeGreaterThan(0);
});

console.log("PASS: compatibility API — seats, shared cards, CORS, null body, Joker side, same card");
