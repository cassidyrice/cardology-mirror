import { sendEmail, normalizeFromAddress } from "./email";
import { readingDb, type ReadingDB } from "./reading-service";
import { mintReportToken } from "./report-token";
import { CARD_APP_PRODUCT } from "./products";
import { sanitizeBirthdateISO } from "./birthdate";
import { isJokerBirthdate } from "./deep-dive";
import { SITE_URL } from "./site";

type AppDeliveryRow = { payload: string; started_at: number; status: "pending" | "sent" | "review" };

/** Reuse the existing D1 binding; retain exact email bytes across retries. */
export async function deliverApp(input: { sessionId: string; email: string; birthdate: string }, deps: {
  db?: ReadingDB; send?: typeof sendEmail; now?: number;
} = {}): Promise<"sent" | "review"> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(input.sessionId) || !input.email.includes("@") ||
      !sanitizeBirthdateISO(input.birthdate) || isJokerBirthdate(input.birthdate) ||
      input.birthdate > new Date().toISOString().slice(0, 10)) throw new Error("invalid app delivery input");
  const db = deps.db ?? await readingDb();
  const query = <T>(sql: string, ...values: unknown[]) => db.prepare(sql).bind(...values).first<T>();
  const get = () => query<AppDeliveryRow>("SELECT payload,started_at,status FROM app_deliveries WHERE session_id=?", input.sessionId);
  let row = await get();
  const now = deps.now ?? Date.now();
  if (!row) {
    const from = normalizeFromAddress(process.env.INTAKE_FROM_EMAIL ?? "");
    if (!from || (!deps.send && !process.env.RESEND_API_KEY)) throw new Error("app email not configured");
    const token = await mintReportToken(input.email, CARD_APP_PRODUCT.reportSlug, input.sessionId,
      input.birthdate, CARD_APP_PRODUCT.linkDays);
    const payload = {
      from, to: input.email,
      subject: "Your Card Blueprint App is ready",
      text: ["Thank you. Your Card Blueprint App is confirmed.", "",
        "Your personal app is ready. Open it on your phone:",
        `${SITE_URL}/blueprint?token=${encodeURIComponent(token)}`, "",
        `My purchases: ${SITE_URL}/my-purchases?session_id=${encodeURIComponent(input.sessionId)}`, "",
        "Keep this private link. Your app is yours for life. Add it to your home screen for easy access.",
        "Use a physical deck of cards alongside it to explore the system yourself.", "",
        "Reply to this email if you need help."].join("\n"),
      replyTo: process.env.INTAKE_EMAIL || undefined,
      idempotencyKey: `card-app/${input.sessionId}`,
    };
    await query("INSERT OR IGNORE INTO app_deliveries (session_id,payload,started_at) VALUES (?,?,?) RETURNING session_id",
      input.sessionId, JSON.stringify(payload), now);
    row = await get();
  }
  if (!row) throw new Error("app delivery storage unavailable");
  if (row.status !== "pending") return row.status;
  // Resend keys expire after 24h. Ambiguous old attempts require operator review.
  if (now - row.started_at >= 23 * 3600_000) {
    await query("UPDATE app_deliveries SET status='review' WHERE session_id=? AND status='pending' RETURNING session_id", input.sessionId);
    return (await get())?.status === "sent" ? "sent" : "review";
  }
  await (deps.send ?? sendEmail)(JSON.parse(row.payload));
  const saved = await query("UPDATE app_deliveries SET status='sent' WHERE session_id=? AND status='pending' RETURNING session_id", input.sessionId);
  if (!saved && (await get())?.status !== "sent") throw new Error("app delivery acknowledgment unavailable");
  return "sent";
}
