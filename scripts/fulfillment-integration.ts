// Isolated integration process: real route handlers, Stripe signature verification,
// SQLite migration and mocked provider HTTP. Never contacts any external service.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { mock } from "bun:test";
import { NextRequest } from "next/server";
const sql = new Database(":memory:");
sql.exec(readFileSync("migrations/0001_reading_orders.sql", "utf8"));
const db = { prepare: (q: string) => ({ bind: (...v: any[]) => ({ first: async () => sql.query(q).get(...v) }) }) };
const analytics: any[] = [];
mock.module("@cloudflare/next-on-pages", () => ({getOptionalRequestContext: () => ({env: {READING_ORDERS: db, READINGS: {get:async()=>null}, FUNNEL_ANALYTICS: {writeDataPoint: (data: any) => analytics.push(data)}}})}));
Object.assign(process.env, {READING_FULFILLMENT_START:"1",STRIPE_SECRET_KEY:"sk_test_synthetic",STRIPE_WEBHOOK_SECRET:"whsec_synthetic",READING_WORKER_URL:"https://writer.example.test",READING_SHARED_SECRET:"synthetic",RESEND_API_KEY:"synthetic",INTAKE_FROM_EMAIL:"reading@example.test",STRIPE_PRICE_BLUEPRINT_BREAKDOWN:"price_synthetic"});
let writes=0, sends=0, emailFails=false; const notifications:any[]=[];
let session:any={id:"cs_test_integration",created:100,status:"complete",payment_status:"unpaid",amount_total:1300,customer_details:{email:"buyer@example.test"},metadata:{offer_slug:"deep-dive",sku:"one-question-47",birthdate:"1991-02-17",question:"Should I take the promotion?"}};
let created:any;
globalThis.fetch=(async (url:any,init:any) => {
 const href=String(url);
 if(href.startsWith("https://api.stripe.com/v1/checkout/sessions")) {
  if(init?.method?.toUpperCase()==="POST") {created=new URLSearchParams(init.body);return Response.json({id:"cs_test_created",url:"https://checkout.stripe.com/synthetic"});}
  return Response.json(session);
 }
 if(href==="https://writer.example.test"){writes++;return Response.json({text:"Synthetic reading",words:2,clean:true,lint:[],model:"mock"});}
 if(href==="https://api.resend.com/emails"){sends++;notifications.push(JSON.parse(init.body));assert.ok(init.headers["Idempotency-Key"]);if(emailFails)return Response.json({message:"Synthetic email failure"},{status:503});return Response.json({id:"email_mock"});}
 throw new Error("Forbidden network: "+href);
}) as typeof fetch;
const {POST:webhook}=await import("../app/api/checkout/webhook/route");
const {GET:reading}=await import("../app/api/one-question/route");
async function event(type:string) {
 const body=JSON.stringify({id:"evt_synthetic",type,data:{object:session}}),t=Math.floor(Date.now()/1000);
 const signature=createHmac("sha256",process.env.STRIPE_WEBHOOK_SECRET!).update(`${t}.${body}`).digest("hex");
 return webhook(new NextRequest("https://example.test/api/checkout/webhook",{method:"POST",body,headers:{"stripe-signature":`t=${t},v1=${signature}`}}));
}
const request=()=>new NextRequest(`https://example.test/api/one-question?session_id=${session.id}&start=1`);
assert.equal((await event("checkout.session.completed")).status,200);assert.equal(writes,0);
assert.equal((await reading(request())).status,403);assert.equal(writes,0);
session.payment_status="paid";
assert.equal((await event("checkout.session.async_payment_succeeded")).status,200);
assert.equal((await event("checkout.session.completed")).status,200);
assert.equal(writes,1);assert.equal(sends,1);
const ready=await reading(request());assert.equal(ready.status,200);assert.equal((await ready.json()).text,"Synthetic reading");assert.equal(ready.headers.get("cache-control"),"private, no-store");
assert.equal(writes,1);assert.equal(sends,1);
session.id="cs_test_stale";
sql.query("INSERT INTO reading_orders(session_id,status,created_at,expires_at) VALUES (?,'writing',?,?)").run(session.id,Date.now()-301_000,Date.now()+86400_000);
assert.equal((await event("checkout.session.completed")).status,503); // no operator address: keep Stripe retrying
process.env.INTAKE_EMAIL="operator@example.test";
assert.equal((await event("checkout.session.completed")).status,200); // operator told: stop retry loop
assert.equal(writes,1);
assert.equal(notifications.at(-1).subject,"Reading fulfillment needs review");
assert.ok(notifications.at(-1).text.includes("reading 2/17/1991"));
session.id="cs_test_email_failure";
emailFails=true;
const writesBefore=writes, sendsBefore=sends;
const emailFailureResponse=await reading(request());
assert.equal(emailFailureResponse.status,200);
assert.deepEqual(await emailFailureResponse.json(),{status:"ready",text:"Synthetic reading",words:2,question:session.metadata.question});
assert.equal(emailFailureResponse.headers.get("cache-control"),"private, no-store");
const pending=sql.query("SELECT status,reading,delivery,delivery_payload,delivery_started FROM reading_orders WHERE session_id=?").get(session.id) as any;
assert.equal(pending.status,"ready");assert.equal(pending.delivery,"pending");
assert.equal(JSON.parse(pending.reading).text,"Synthetic reading");
assert.ok(pending.delivery_payload);assert.ok(pending.delivery_started);
assert.equal(writes,writesBefore+1);assert.equal(sends,sendsBefore+1);
const failedEmail=notifications.at(-1);
assert.ok(failedEmail.text.includes(JSON.parse(pending.reading).text));
emailFails=false;
assert.equal((await event("checkout.session.completed")).status,200);
assert.equal(writes,writesBefore+1);assert.equal(sends,sendsBefore+2);
assert.deepEqual(notifications.at(-1),failedEmail);
const delivered=sql.query("SELECT status,reading,delivery,delivery_payload,delivery_started FROM reading_orders WHERE session_id=?").get(session.id) as any;
assert.deepEqual(delivered,{...pending,delivery:"sent"});
session={id:"cs_test_payment_link",created:100,status:"complete",payment_status:"paid",amount_total:2000,payment_link:"plink_synthetic",customer_details:{email:"walkin@example.test"},metadata:{}};
const sendsBeforeLink=sends;
assert.equal((await event("checkout.session.completed")).status,200);
assert.equal(sends,sendsBeforeLink);
console.log("Passed: Payment Link sale sends no site email; signed unpaid webhook + retrieval denied; delayed payment fulfills; duplicate event does not regenerate/resend; paid success retrieval; API exposes ready text after email failure and webhook retries the stored payload without regeneration. Mock HTTP only.");

// A real signed event and SQLite constraints exercise the separate seven-page manual delivery queue.
sql.exec(readFileSync("migrations/0004_birth_card_blueprint_orders.sql", "utf8"));
const blueprintId = crypto.randomUUID();
const sessionId = "cs_test_blueprint_queue";
const reserve = sql.query("INSERT INTO blueprint_checkout_orders(id,attempt_id,stripe_session_id,birth_month,birth_day) VALUES (?,?,?,?,?)");
reserve.run(blueprintId, crypto.randomUUID(), sessionId, 2, 29);
assert.throws(() => reserve.run(crypto.randomUUID(), crypto.randomUUID(), "cs_test_invalid_date", 2, 30));
const order = () => sql.query("SELECT paid_at,claimed_at,fulfilled_at,birth_month,birth_day FROM blueprint_checkout_orders WHERE id=?").get(blueprintId) as any;
session = {id: sessionId, mode: "payment", payment_status: "unpaid", currency: "usd", amount_total: 1300,
  metadata: {offer_slug: "birth-card-blueprint", blueprint_order_id: blueprintId}};
const salesBefore = analytics.length, sendsBeforeBlueprint = sends;
assert.equal((await event("checkout.session.completed")).status, 200);
assert.equal(order().paid_at, null);
session.payment_status = "paid";
for (const override of [{amount_total: 1299}, {currency: "cad"}, {mode: "subscription"}, {payment_status: "no_payment_required"}]) {
  const original = session;
  session = {...original, ...override};
  assert.equal((await event("checkout.session.completed")).status, 422);
  session = original;
}
session.id = "cs_test_different_session";
assert.equal((await event("checkout.session.completed")).status, 503);
session.id = sessionId;
assert.equal(order().paid_at, null);
assert.equal((await event("checkout.session.async_payment_succeeded")).status, 200);
assert.ok(order().paid_at);
assert.equal(order().fulfilled_at, null);
assert.equal((await event("checkout.session.completed")).status, 200);
assert.equal(analytics.length, salesBefore + 1);
assert.equal(analytics.at(-1).blobs[0], "purchase_completed");
sql.query("UPDATE blueprint_checkout_orders SET claimed_at=unixepoch(),fulfilled_at=unixepoch(),birth_month=NULL,birth_day=NULL WHERE id=?").run(blueprintId);
const sent = order();
assert.equal((await event("checkout.session.completed")).status, 200);
assert.equal((await event("checkout.session.expired")).status, 200);
assert.deepEqual(order(), sent);
const expired = crypto.randomUUID();
session.id = "cs_test_expired";
session.metadata.blueprint_order_id = expired;
reserve.run(expired, crypto.randomUUID(), session.id, 12, 31);
assert.equal((await event("checkout.session.expired")).status, 200);
assert.equal(sql.query("SELECT id FROM blueprint_checkout_orders WHERE id=?").get(expired), null);
assert.equal(sends, sendsBeforeBlueprint);
assert.equal(analytics.length, salesBefore + 1);
console.log("Passed: Blueprint needs a matching session and paid USD 13.00; duplicate events queue one sale, preserve sent orders and never send a legacy email; expiration removes only pending attempts.");
