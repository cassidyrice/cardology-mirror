// Restores ac5f70b's writer/delivery flow with a durable per-order reservation.
import { sendEmail } from "./email";
import { writeReading } from "./reading-writer";
import { sanitizeBirthdateISO } from "./birthdate";
import { getLegacyReading, getReadingRow, readingDb, storedReading, READING_TTL_MS,
  type ReadingDB, type ReadingRow, type StoredReading } from "./reading-service";

export type DeliverInput = { sessionId: string; sessionCreated: number; birthday: string; question: string; email: string };

export async function deliverReading(input: DeliverInput, deps: {
  db?: ReadingDB; write?: typeof writeReading; send?: typeof sendEmail;
  legacy?: typeof getLegacyReading; startAt?: number;
} = {}): Promise<StoredReading> {
  const { sessionId, birthday, question, email } = input;
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !sanitizeBirthdateISO(birthday) || question.trim().length < 5 || !email.includes("@")) {
    throw new Error("invalid fulfillment input");
  }
  const db = deps.db ?? await readingDb();
  const query = <T>(sql: string, ...values: unknown[]) => db.prepare(sql).bind(...values).first<T>();
  let row = await getReadingRow(sessionId, db);
  if (!row) {
    const legacy = await (deps.legacy ?? getLegacyReading)(sessionId);
    // Preserve historical text. Its email outcome is unknown, so never resend it automatically.
    if (legacy) {
      const now = Date.now();
      await query(`INSERT OR IGNORE INTO reading_orders
        (session_id,status,reading,created_at,expires_at,delivery) VALUES (?,?,?,?,?,'review') RETURNING session_id`,
        sessionId, legacy.status === "ready" ? "ready" : "failed", JSON.stringify(legacy), now,
        (Date.parse(legacy.createdAt) || now) + READING_TTL_MS);
    } else {
      // Older orders may have been delivered manually or aged out of KV. A
      // rollout cutoff prevents absence of old data from authorizing regeneration.
      const startAt = deps.startAt ?? Number(process.env.READING_FULFILLMENT_START);
      if (!Number.isFinite(startAt) || startAt <= 0 || !Number.isFinite(input.sessionCreated) || input.sessionCreated < startAt) {
        throw new Error("order predates automatic fulfillment or activation is not configured");
      }
      const now = Date.now();
      const claimed = await query<{session_id: string}>(`INSERT OR IGNORE INTO reading_orders
        (session_id,status,created_at,expires_at) VALUES (?,'writing',?,?) RETURNING session_id`, sessionId, now, now + READING_TTL_MS);
      if (claimed) {
        // Never clear/reclaim this reservation: the provider has no verified generation
        // idempotency contract. A timeout or crash requires manual reconciliation.
        try {
          const written = await (deps.write ?? writeReading)(birthday, question);
          const saved = await query<{session_id: string}>(`UPDATE reading_orders SET status='ready',reading=?
            WHERE session_id=? AND status='writing' RETURNING session_id`, JSON.stringify({ ...written, question }), sessionId);
          if (!saved) throw new Error("reading storage failed");
        } catch (error) {
          await query("UPDATE reading_orders SET status='failed' WHERE session_id=? AND status='writing' RETURNING session_id", sessionId);
          throw error;
        }
      }
    }
    row = await getReadingRow(sessionId, db);
  }
  if (!row) throw new Error("reading storage unavailable");
  const reading = storedReading(row);
  if (reading.status !== "ready" || row.delivery !== "pending") return reading;
  const now = Date.now();
  // Resend remembers keys for 24h. Stop before that boundary if acceptance was
  // ambiguous; an operator must inspect provider history before resending.
  if (row.delivery_started !== null && now - row.delivery_started >= 23 * 3600_000) {
    await query("UPDATE reading_orders SET delivery='review' WHERE session_id=? AND delivery='pending' RETURNING session_id", sessionId);
    return { ...reading, delivery: "review" };
  }
  const payload = {
    to: email, subject: "Your reading",
    text: [question ? `You asked: "${question}"` : "Your reading:", "", reading.text, "",
      "This reading was written from your birth card, this year's Long Range and Pluto cards, and your two karma cards. Same birthday, same cards, every time.", "",
      "Reply to this email if anything in it needs a second pass.", "", "Cass", "Card Blueprints"].join("\n"),
    replyTo: process.env.INTAKE_EMAIL || undefined,
    idempotencyKey: `reading/${sessionId}`,
  };
  // Persist exact payload before sending, so concurrent retries use identical bytes.
  await query(`UPDATE reading_orders SET delivery_payload=?,delivery_started=?
    WHERE session_id=? AND delivery_payload IS NULL RETURNING session_id`, JSON.stringify(payload), now, sessionId);
  row = await getReadingRow(sessionId, db) as ReadingRow;
  if (!row?.delivery_payload) throw new Error("delivery storage failed");
  if (row.delivery !== "pending") return storedReading(row);
  await (deps.send ?? sendEmail)(JSON.parse(row.delivery_payload));
  const sent = await query("UPDATE reading_orders SET delivery='sent' WHERE session_id=? RETURNING session_id", sessionId);
  if (!sent) throw new Error("delivery acknowledgment storage failed");
  return { ...reading, delivery: "sent" };
}
