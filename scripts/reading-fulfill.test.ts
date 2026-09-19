import { test, expect } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { deliverReading } from "../lib/reading-fulfill";
import { getReadingRow, type ReadingDB } from "../lib/reading-service";
import { sendEmail } from "../lib/email";
const input = { sessionId: "cs_test_order", sessionCreated: 100, birthday: "1991-02-17", question: "Should I take this job?", email: "buyer@example.test" };
const written = { text: "Synthetic reading", words: 2, clean: true, lint: [], model: "mock" };
function setup() {
  const sql = new Database(":memory:"); sql.exec(readFileSync(new URL("../migrations/0001_reading_orders.sql", import.meta.url), "utf8"));
  const db: ReadingDB = { prepare: query => ({ bind: (...values: any[]) => ({ first: async <T>() => sql.query(query).get(...values) as T | null }) }) };
  let writes = 0, sends = 0;
  const deps = { db, startAt: 1, from: "reading@example.test", legacy: async () => null, write: async () => { writes++; return written; }, send: async () => { sends++; } };
  return { deps, sql, counts: () => ({ writes, sends }) };
}
test("concurrent requests reserve one generation and reuse identical provider idempotency payload", async () => {
  const x = setup(); const payloads: unknown[] = [];
  x.deps.send = async (args?: unknown) => { payloads.push(args); };
  await Promise.all(Array.from({length: 20}, () => deliverReading(input, x.deps)));
  expect(x.counts().writes).toBe(1); expect((await getReadingRow(input.sessionId, x.deps.db))?.delivery).toBe("sent");
  expect(new Set(payloads.map(p => JSON.stringify(p))).size).toBe(1);
  expect((payloads[0] as any).idempotencyKey).toBe("reading/cs_test_order");
});
test("email failure retries saved text without generation", async () => {
  const x = setup(); x.deps.send = async () => { throw new Error("email failure"); };
  await expect(deliverReading(input, x.deps)).rejects.toThrow();
  expect((await getReadingRow(input.sessionId, x.deps.db))?.status).toBe("ready");
  x.deps.send = async () => {};
  expect((await deliverReading(input, x.deps)).delivery).toBe("sent"); expect(x.counts().writes).toBe(1);
});
test("generation failure is terminal and cannot generate again", async () => {
  const x = setup(); let attempts = 0; x.deps.write = async () => { attempts++; throw new Error("timeout"); };
  await expect(deliverReading(input, x.deps)).rejects.toThrow();
  expect((await deliverReading(input, x.deps)).status).toBe("failed"); expect(attempts).toBe(1);
});
test("storage failure before reservation prevents generation", async () => {
  const x = setup(); x.sql.close(); await expect(deliverReading(input, x.deps)).rejects.toThrow(); expect(x.counts().writes).toBe(0);
});
test("storage failure after generation never sends or regenerates", async () => {
  const x = setup();
  x.sql.exec("CREATE TRIGGER fail_ready BEFORE UPDATE OF reading ON reading_orders BEGIN SELECT RAISE(FAIL, 'storage unavailable'); END;");
  await expect(deliverReading(input, x.deps)).rejects.toThrow("storage unavailable");
  x.sql.exec("DROP TRIGGER fail_ready");
  expect((await deliverReading(input, x.deps)).status).toBe("failed"); expect(x.counts()).toEqual({writes: 1, sends: 0});
});
test("missing email configuration is never sent", async () => {
  const x = setup(); x.deps.send = (args?: any) => sendEmail(args, {});
  await expect(deliverReading(input, x.deps)).rejects.toThrow("not configured");
  expect((await getReadingRow(input.sessionId, x.deps.db))?.delivery).toBe("pending");
});
test("ambiguous delivery beyond provider window requires review", async () => {
  const x = setup(); x.deps.send = async () => { throw new Error("ambiguous"); };
  await expect(deliverReading(input, x.deps)).rejects.toThrow();
  x.sql.exec(`UPDATE reading_orders SET delivery_started = ${Date.now() - 24 * 3600_000}`);
  expect((await deliverReading(input, x.deps)).delivery).toBe("review"); expect(x.counts().writes).toBe(1);
});
test("legacy text is preserved without duplicate generation or speculative email", async () => {
  const x = setup(); x.deps.legacy = async () => ({status: "ready", ...written, createdAt: new Date().toISOString()}) as any;
  expect((await deliverReading(input, x.deps)).text).toBe(written.text); expect(x.counts()).toEqual({writes: 0, sends: 0});
});
test("legacy storage failure cannot be mistaken for a missing order", async () => {
  const x = setup(); x.deps.legacy = async () => { throw new Error("KV down"); };
  await expect(deliverReading(input, x.deps)).rejects.toThrow("KV down"); expect(x.counts().writes).toBe(0);
});
test("expired order remains a tombstone", async () => {
  const x = setup(); await deliverReading(input, x.deps); x.sql.exec("UPDATE reading_orders SET expires_at=1");
  expect((await deliverReading(input, x.deps)).status).toBe("failed"); expect(x.counts().writes).toBe(1);
});

test("historical orders without stored text never silently regenerate", async () => {
  const x = setup(); x.deps.startAt = 101;
  await expect(deliverReading(input, x.deps)).rejects.toThrow("predates");
  expect(x.counts()).toEqual({ writes: 0, sends: 0 });
});

test("delivery retains the original sender across configuration changes", async () => {
  const x = setup(); const bodies: string[] = [];
  x.deps.send = (args?: any) => sendEmail(args, {apiKey:"synthetic", from:"changed@example.test"}, (async (_url: any, init: any) => {
    bodies.push(init.body);
    if (bodies.length === 1) throw new Error("ambiguous acceptance");
    return Response.json({id:"mock"});
  }) as typeof fetch);
  await expect(deliverReading(input, x.deps)).rejects.toThrow();
  x.deps.from = "different@example.test";
  await deliverReading(input, x.deps);
  expect(bodies[1]).toBe(bodies[0]);
  expect(JSON.parse(bodies[1]).from).toBe("Card Blueprints <reading@example.test>");
});
test("stale generation becomes reviewable without a second generation", async () => {
  const x = setup();
  x.sql.query("INSERT INTO reading_orders(session_id,status,created_at,expires_at) VALUES (?,'writing',?,?)").run(input.sessionId,Date.now()-301_000,Date.now()+86400_000);
  const result = await deliverReading(input, x.deps);
  expect(result.status).toBe("failed"); expect(result.delivery).toBe("review");
  expect(x.counts()).toEqual({writes:0,sends:0});
});
