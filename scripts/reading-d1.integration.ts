// Real local workerd/D1 persistence, synthetic providers, no network.
import { Miniflare } from "miniflare";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { deliverReading } from "../lib/reading-fulfill";
const mf=new Miniflare({modules:true,script:"export default { fetch() { return new Response('local'); } }",d1Databases:["DB"],compatibilityDate:"2025-05-01"});
try {
 const db=await mf.getD1Database("DB");
 await db.prepare(readFileSync("migrations/0001_reading_orders.sql","utf8")).run();
 let writes=0;
 const deps={startAt:1,db:db as any,legacy:async()=>null,write:async()=>{writes++;return {text:"Synthetic D1 test",words:3,clean:true,lint:[],model:"mock"};},send:async()=>{}};
 const input={sessionId:"cs_test_d1",sessionCreated:100,birthday:"1991-02-17",question:"What should I understand?",email:"buyer@example.test"};
 await Promise.all(Array.from({length:12},()=>deliverReading(input,deps)));
 assert.equal(writes,1);
 assert.equal((await db.prepare("SELECT delivery FROM reading_orders WHERE session_id=?").bind(input.sessionId).first<any>())?.delivery,"sent");
 console.log("Passed: migration and 12 concurrent fulfillment requests against local workerd D1; exactly one generation.");
}finally{await mf.dispose();}
