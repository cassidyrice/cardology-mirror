// Real local workerd/D1 persistence, synthetic providers, no network.
import { Miniflare } from "miniflare";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { deliverReading } from "../lib/reading-fulfill";
import { deliverApp } from "../lib/app-delivery";
const mf=new Miniflare({modules:true,script:"export default { fetch() { return new Response('local'); } }",d1Databases:["DB"],compatibilityDate:"2025-05-01"});
try {
 const db=await mf.getD1Database("DB");
 await db.prepare(readFileSync("migrations/0001_reading_orders.sql","utf8")).run();
 let writes=0;
 const deps={startAt:1,from:"reading@example.test",db:db as any,legacy:async()=>null,write:async()=>{writes++;return {text:"Synthetic D1 test",words:3,clean:true,lint:[],model:"mock"};},send:async()=>{}};
 const input={sessionId:"cs_test_d1",sessionCreated:100,birthday:"1991-02-17",question:"What should I understand?",email:"buyer@example.test"};
 await Promise.all(Array.from({length:12},()=>deliverReading(input,deps)));
 assert.equal(writes,1);
 assert.equal((await db.prepare("SELECT delivery FROM reading_orders WHERE session_id=?").bind(input.sessionId).first<any>())?.delivery,"sent");
 console.log("Passed: migration and 12 concurrent fulfillment requests against local workerd D1; exactly one generation.");
 await db.prepare(readFileSync("migrations/0002_app_deliveries.sql","utf8")).run();
 process.env.INTAKE_FROM_EMAIL="reader@example.test";
 process.env.REPORT_TOKEN_SECRET="synthetic-d1-app";
 const accepted=new Map<string,string>();
 const appDeps={db:db as any,send:async(payload:any)=>{
   const previous=accepted.get(payload.idempotencyKey);
   if(previous)assert.equal(previous,JSON.stringify(payload));
   accepted.set(payload.idempotencyKey,JSON.stringify(payload));
 }};
 await Promise.all(Array.from({length:12},()=>deliverApp({sessionId:"cs_test_app_d1",email:"buyer@example.test",birthdate:"1988-07-14"},appDeps)));
 assert.equal(accepted.size,1);
 assert.equal((await db.prepare("SELECT status FROM app_deliveries WHERE session_id='cs_test_app_d1'").first<any>())?.status,"sent");
 console.log("Passed: app delivery migration and 12 concurrent requests against local workerd D1; identical delivery payload and one provider key.");
}finally{await mf.dispose();}
