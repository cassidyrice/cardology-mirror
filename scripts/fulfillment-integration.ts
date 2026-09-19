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
mock.module("@cloudflare/next-on-pages", () => ({getOptionalRequestContext: () => ({env: {READING_ORDERS: db, READINGS: {get:async()=>null}}})}));
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
const {POST:checkout}=await import("../app/checkout/[offer]/session/route");
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
for(const question of ["", "Should I take the promotion?"]) {
 const body=new URLSearchParams({birthdate:"1991-02-17",question});
 const response=await checkout(new NextRequest("https://example.test/checkout/deep-dive/session",{method:"POST",body,headers:{"content-type":"application/x-www-form-urlencoded"}}),{params:Promise.resolve({offer:"deep-dive"})});
 assert.equal(response.status,303);
 if(question){assert.equal(response.headers.get("location"),"https://checkout.stripe.com/synthetic");assert.equal(created.get("metadata[question]"),question);assert.equal(created.get("metadata[birthdate]"),"1991-02-17");}
 else assert.ok(response.headers.get("location")?.includes("need-question"));
}
session.id="cs_test_stale";
sql.query("INSERT INTO reading_orders(session_id,status,created_at,expires_at) VALUES (?,'writing',?,?)").run(session.id,Date.now()-301_000,Date.now()+86400_000);
process.env.INTAKE_EMAIL="operator@example.test";
assert.equal((await event("checkout.session.completed")).status,503);
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
console.log("Passed: signed unpaid webhook + retrieval denied; delayed payment fulfills; duplicate event does not regenerate/resend; paid success retrieval; checkout question validation and Stripe metadata; API exposes ready text after email failure and webhook retries the stored payload without regeneration. Mock HTTP only.");
