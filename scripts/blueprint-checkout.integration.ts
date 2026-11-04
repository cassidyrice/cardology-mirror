// Isolated process: exercise the real route, Stripe SDK, and order migration without network traffic.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { mock } from "bun:test";

const sql = new Database(":memory:");
sql.exec(readFileSync("migrations/0004_birth_card_blueprint_orders.sql", "utf8"));
let failBindingOnce = false;
const db = { prepare: (query: string) => ({ bind: (...args: any[]) => ({ first: async () => {
  if (failBindingOnce && query.startsWith("UPDATE")) {
    failBindingOnce = false;
    throw new Error("simulated storage outage");
  }
  return sql.query(query).get(...args);
} }) }) };
mock.module("@cloudflare/next-on-pages", () => ({ getOptionalRequestContext: () => ({env: {READING_ORDERS: db}}) }));
const origin = "https://blueprint.example.test";
Object.assign(process.env, {
  NEXT_PUBLIC_SITE_URL: origin, STRIPE_SECRET_KEY: "sk_test_synthetic", STRIPE_PUBLISHABLE_KEY: "pk_test_synthetic",
  STRIPE_WEBHOOK_SECRET: "whsec_synthetic", STRIPE_BIRTH_CARD_BLUEPRINT_PRICE_ID: "price_synthetic",
  STRIPE_BIRTH_CARD_BLUEPRINT_TEST_ACCOUNT_ID: "acct_test_merchant", CARD_BLUEPRINT_EMBEDDED_CHECKOUT: "1",
});
const { POST } = await import("../app/api/checkout/birth-card-blueprint/route");
const price = { id: "price_synthetic", active: true, type: "one_time", currency: "usd", unit_amount: 1300, livemode: false };
let account = "acct_test_merchant";
const sessions = new Map<string, any>();
let requests = 0;
globalThis.fetch = (async (url: string, init: RequestInit) => {
  const { origin: host, pathname } = new URL(url);
  assert.equal(host, "https://api.stripe.com");
  requests++;
  if (pathname === "/v1/account") return Response.json({ id: account });
  if (pathname === "/v1/prices/price_synthetic") return Response.json(price);
  if (pathname === "/v1/checkout/sessions" && init.method === "POST") {
    const body = new URLSearchParams(String(init.body));
    const orderId = body.get("metadata[blueprint_order_id]");
    assert.ok(orderId);
    assert.deepEqual([...body].map(([k]) => k).filter(k => k.startsWith("metadata")).sort(),
      ["metadata[blueprint_order_id]", "metadata[offer_slug]"]);
    assert.equal(body.get("metadata[offer_slug]"), "birth-card-blueprint");
    assert.equal(body.get("ui_mode"), "embedded_page");
    assert.equal(body.get("redirect_on_completion"), "never");
    assert.equal(body.get("line_items[0][price]"), price.id);
    assert.equal(body.get("line_items[0][quantity]"), "1");
    assert.equal(body.get("customer_email"), null);
    assert.equal(new Headers(init.headers).get("Idempotency-Key"), `blueprint-order-${orderId}`);
    const id = `cs_test_${orderId}`;
    if (!sessions.has(id)) sessions.set(id, { id, client_secret: "test_secret", metadata: {
      blueprint_order_id: orderId, offer_slug: "birth-card-blueprint",
    }, status: "open", payment_status: "unpaid", livemode: false, currency: "usd", amount_total: 1300 });
    return Response.json(sessions.get(id));
  }
  const session = sessions.get(pathname.split("/").pop()!);
  assert.ok(session, "unexpected Stripe endpoint");
  return Response.json(session);
}) as typeof fetch;
const attemptId = crypto.randomUUID();
const fields = { month: 2, day: 29, attemptId };
const post = (data = fields, requestOrigin = origin) => POST(new Request(`${origin}/api/checkout/birth-card-blueprint`, {
  method: "POST", headers: { "content-type": "application/json", origin: requestOrigin, "cf-connecting-ip": crypto.randomUUID() },
  body: JSON.stringify(data),
}));
assert.equal((await post(fields, "https://other.example.test")).status, 403);
assert.equal((await post({ ...fields, day: 30 })).status, 400);
assert.equal((await post({ ...fields, attemptId: "z".repeat(1100) })).status, 413);
assert.equal((await post({ ...fields, attemptId: "unsafe" })).status, 400);
process.env.CARD_BLUEPRINT_EMBEDDED_CHECKOUT = "0";
assert.equal((await post()).status, 503);
process.env.CARD_BLUEPRINT_EMBEDDED_CHECKOUT = "1";
process.env.STRIPE_PUBLISHABLE_KEY = "pk_live_synthetic";
assert.equal((await post()).status, 503);
assert.equal(requests, 0);
process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_synthetic";
account = "acct_other";
assert.equal((await post()).status, 503);
account = "acct_test_merchant";
for (const change of [{ active: false }, { unit_amount: 999 }, { currency: "gbp" }, { type: "recurring" }, { livemode: true }]) {
  const valid = { ...price };
  Object.assign(price, change);
  assert.equal((await post()).status, 503);
  Object.assign(price, valid);
}
assert.equal(sessions.size, 0);
failBindingOnce = true;
assert.equal((await post()).status, 503);
const retries = await Promise.all([post(), post()]);
for (const response of retries) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), { clientSecret: "test_secret", publishableKey: "pk_test_synthetic" });
}
assert.equal(sessions.size, 1);
assert.equal(sql.query("SELECT count(*) AS n FROM blueprint_checkout_orders").get()?.n, 1);
assert.equal((await post({ ...fields, day: 28 })).status, 409);
sql.run("UPDATE blueprint_checkout_orders SET paid_at = unixepoch()");
assert.equal((await post()).status, 409);
console.log("Passed: trusted origin, gate, verified merchant/price/mode, privacy, partial failure and idempotent retry, paid order protection.");
