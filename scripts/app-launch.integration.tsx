// Real route handlers and SQL persistence; synthetic Stripe/Resend only.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { mock } from "bun:test";
import { NextRequest } from "next/server";
const sqlite = new Database(":memory:");
sqlite.run(readFileSync("migrations/0002_app_deliveries.sql", "utf8"));
const db = { prepare: (sql: string) => ({ bind: (...args: any[]) => ({ first: async () => sqlite.query(sql).get(...args) }) }) };
mock.module("@cloudflare/next-on-pages", () => ({ getOptionalRequestContext: () => ({ env: { READING_ORDERS: db } }) }));
Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_test_synthetic", STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
  REPORT_TOKEN_SECRET: "synthetic-app-secret", RESEND_API_KEY: "synthetic", INTAKE_FROM_EMAIL: "reader@example.test",
  INTAKE_EMAIL: "owner@example.test", STRIPE_PRICE_CARD_BLUEPRINT_APP: "price_app_synthetic" });
let failEmail = false, loseResponse = false;
const accepted = new Map<string, string>();
let sendAttempts = 0;
let created: URLSearchParams | undefined;
let session: any = { id: "cs_test_app_launch", created: Math.floor(Date.now()/1000), status: "complete",
  payment_status: "paid", amount_total: 6900, currency: "usd", customer_details: { email: "buyer@example.test" },
  metadata: { offer_slug: "card-blueprint-app", birthdate: "1988-07-14" } };
globalThis.fetch = (async (url: any, init: any) => {
  if (String(url).startsWith("https://api.stripe.com/v1/checkout/sessions")) {
    if (init?.method?.toUpperCase() === "POST") {
      created = new URLSearchParams(init.body);
      return Response.json({ id: "cs_test_app_created", url: "https://checkout.stripe.com/synthetic" });
    }
    return Response.json(session);
  }
  if (String(url) !== "https://api.resend.com/emails") throw new Error("Forbidden external call");
  sendAttempts++;
  if (failEmail) return Response.json({ message: "Unavailable" }, { status: 503 });
  const key = init.headers["Idempotency-Key"];
  assert.ok(key, "every app send must be idempotent");
  if (accepted.has(key)) assert.equal(accepted.get(key), init.body, "retry uses byte-identical payload");
  accepted.set(key, init.body);
  if (loseResponse && key.startsWith("card-app/")) { loseResponse = false; throw new Error("Response lost after acceptance"); }
  return Response.json({ id: "synthetic" });
}) as typeof fetch;
const { POST: webhook } = await import("../app/api/checkout/webhook/route");
const { POST: checkout } = await import("../app/checkout/[offer]/session/route");
const { verifyReportToken } = await import("../lib/report-token");
const { deliverApp } = await import("../lib/app-delivery");
async function event(type = "checkout.session.completed", signatureValid = true) {
  const body = JSON.stringify({ id: "evt_synthetic_app", type, data: { object: session } });
  const t = Math.floor(Date.now()/1000);
  const sig = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET!).update(`${t}.${body}`).digest("hex");
  return webhook(new NextRequest("https://example.test/api/checkout/webhook", { method: "POST", body,
    headers: { "stripe-signature": `t=${t},v1=${signatureValid ? sig : "invalid"}` } }));
}
assert.equal((await event(undefined, false)).status, 400);
session.payment_status = "unpaid";
assert.equal((await event()).status, 200);
assert.equal(accepted.size, 0);
session.payment_status = "paid";
failEmail = true;
assert.equal((await event()).status, 503, "failed buyer send must remain retryable");
assert.equal(sqlite.query("SELECT status FROM app_deliveries").get()?.status, "pending");
failEmail = false; loseResponse = true;
assert.equal((await event()).status, 503, "ambiguous acceptance must remain retryable");
assert.equal((await event("checkout.session.async_payment_succeeded")).status, 200);
const appPayload = JSON.parse(accepted.get(`card-app/${session.id}`)!);
const token = decodeURIComponent(appPayload.text.match(/\/blueprint\?token=(\S+)/)[1]);
const buyer = await verifyReportToken(token);
assert.equal(buyer?.birthdate, "1988-07-14");
assert.equal(buyer?.slug, "card-blueprint-app");
assert.ok(buyer!.exp > Date.now() + 99 * 365 * 86400_000);
assert.equal(await verifyReportToken(token + "invalid"), null);
const attempts = sendAttempts;
await Promise.all(Array.from({length: 12}, () => event()));
assert.equal(sendAttempts, attempts, "sent tombstone prevents replay and concurrent duplicate delivery");
session = { ...session, id: "cs_test_app_old" };
sqlite.query("INSERT INTO app_deliveries(session_id,payload,started_at) VALUES(?,?,?)")
  .run(session.id, JSON.stringify({...appPayload,idempotencyKey:`card-app/${session.id}`}), Date.now()-24*3600_000);
assert.equal((await event()).status, 200, "ambiguous old delivery alerts owner and stops automatic sends");
assert.equal(sqlite.query("SELECT status FROM app_deliveries WHERE session_id=?").get(session.id)?.status, "review");
assert.ok(!accepted.has(`card-app/${session.id}`));
let n = 0;
for (const date of ["not-a-date", "1990-12-31", "2099-01-01", "1988-07-14"]) {
  created = undefined;
  const result = await checkout(new NextRequest("https://example.test/checkout/card-blueprint-app/session", {
    method: "POST", headers: {"content-type":"application/json", origin:"https://example.test", "cf-connecting-ip":`app-${n++}`},
    body: JSON.stringify({birthdate:date}) }), {params:Promise.resolve({offer:"card-blueprint-app"})});
  assert.equal(result.status, date === "1988-07-14" ? 200 : 400);
  if (date === "1988-07-14") assert.equal(created!.get("line_items[0][price]"), "price_app_synthetic");
  else assert.equal(created, undefined);
}
// A persistence failure before send cannot leak a buyer email.
const oldAttempts = sendAttempts;
await assert.rejects(deliverApp({sessionId:"cs_test_storage_fail",email:"buyer@example.test",birthdate:"1988-07-14"},
  {db:{prepare:()=>({bind:()=>({first:async()=>{throw new Error("database unavailable");}})})}}));
assert.equal(sendAttempts, oldAttempts);
console.log("PASS: app checkout validation, signed paid/unpaid/delayed webhooks, persistent retry, ambiguous acceptance, replay/concurrency, old-attempt review, private token and storage failure; no real emails or charges.");
sqlite.close();
