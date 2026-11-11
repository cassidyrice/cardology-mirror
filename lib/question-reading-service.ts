// Service layer for The Card Blueprint Reading ($99 · Suggested Questions PDF + 48h pass for up to 3 questions).
// Coordinates D1 persistence, HMAC magic-link signing for /ops/inbox and /reading-pass,
// idempotent Stripe fulfillment, 3-angle AI drafting, operator notifications, and Email / Hybrid SMS delivery.

import { sanitizeAnalyticsPath, type FunnelContext } from "./analytics";
import { recordFunnelEvent } from "./analytics-server";
import { canonicalCalendarDate } from "./birthdate";
import { resolvePublicBirth } from "./birth-card-truth";
import { sendEmail, sendIntakeEmail } from "./email";
import {
  buildQuestionReadingFacts,
  type QuestionReadingFacts,
  type QuestionTrack,
} from "./question-reading-facts";
import {
  generateThreeReadingAngles,
  type PriorQuestionContext,
  type ReadingAngleDraft,
} from "./question-reading-writer";
import { JokerNotSupportedError } from "./reading";
import { SITE_URL } from "./site";
import { buildOperatorSmsHref, normalizePhoneE164, sendSms } from "./sms";
import { SUGGESTED_QUESTIONS_PDF_PATH } from "./suggested-questions";
import { b64urlDecode, b64urlEncode, hmac, randomJti, safeEqual } from "./token-crypto";

import {
  CARD_BLUEPRINT_READING_SPEC,
  CARD_BLUEPRINTS_STRIPE_ACCOUNT,
  MAX_QUESTIONS_PER_ORDER,
  PRIMARY_QUESTION_TRACK,
  QUESTION_ACCESS_WINDOW_HOURS,
  QUESTION_ACCESS_WINDOW_MS,
  QUESTION_READING_TRACKS,
  QUESTION_SLA_PROSE,
  QUESTION_SLA_SHORT,
  isQuestionTrack,
  type DeliveryChannel,
  type QuestionOrderStatus,
  type QuestionTrackSpec,
} from "./question-reading-tracks";

export {
  CARD_BLUEPRINT_READING_SPEC,
  CARD_BLUEPRINTS_STRIPE_ACCOUNT,
  MAX_QUESTIONS_PER_ORDER,
  PRIMARY_QUESTION_TRACK,
  QUESTION_ACCESS_WINDOW_HOURS,
  QUESTION_ACCESS_WINDOW_MS,
  QUESTION_READING_TRACKS,
  QUESTION_SLA_PROSE,
  QUESTION_SLA_SHORT,
  SUGGESTED_QUESTIONS_PDF_PATH,
  isQuestionTrack,
  type DeliveryChannel,
  type QuestionOrderStatus,
  type QuestionTrackSpec,
};

export interface QuestionOrderRow {
  id: string;
  attempt_id: string;
  stripe_session_id: string | null;
  track: QuestionTrack;
  amount_cents: number;
  currency: string;
  birth1: string;
  name1: string;
  birth2: string;
  name2: string;
  rel2: string;
  question: string;
  delivery_channel: DeliveryChannel;
  buyer_email: string;
  buyer_phone: string;
  sms_consent: number;
  placement: string;
  source_path: string;
  attribution_json: string;
  engine_facts_json: string | null;
  angles_json: string | null;
  steering_note: string;
  status: QuestionOrderStatus;
  approved_angle: number | null;
  approved_subject: string | null;
  approved_body: string | null;
  approved_sms_body: string | null;
  delivery_log_json: string | null;
  created_at: number;
  paid_at: number | null;
  angles_ready_at: number | null;
  sent_at: number | null;
}

export interface HydratedQuestionOrder {
  id: string;
  parentOrderId: string;
  questionNumber: 1 | 2 | 3;
  maxQuestions: number;
  attemptId: string;
  stripeSessionId: string | null;
  track: QuestionTrack;
  trackTitle: string;
  amountCents: number;
  currency: string;
  birth1: string;
  name1: string;
  birth2: string;
  name2: string;
  rel2: string;
  question: string;
  deliveryChannel: DeliveryChannel;
  buyerEmail: string;
  buyerPhone: string;
  smsConsent: boolean;
  placement: string;
  sourcePath: string;
  status: QuestionOrderStatus;
  steeringNote: string;
  facts: QuestionReadingFacts | null;
  angles: ReadingAngleDraft[];
  approvedAngle: number | null;
  approvedSubject: string | null;
  approvedBody: string | null;
  approvedSmsBody: string | null;
  deliveryLog: Record<string, unknown> | null;
  createdAt: number;
  paidAt: number | null;
  accessExpiresAt: number | null;
  anglesReadyAt: number | null;
  sentAt: number | null;
  manualSmsHref: string | null;
}

export interface BuyerPassQuestionItem {
  questionNumber: 1 | 2 | 3;
  orderId: string;
  question: string;
  birth1: string;
  name1: string;
  birth2: string;
  name2: string;
  rel2: string;
  status: QuestionOrderStatus;
  submittedAt: number;
  sentAt: number | null;
  approvedSubject: string | null;
  approvedBody: string | null;
  approvedSmsBody: string | null;
}

export interface ReadingPassState {
  orderId: string;
  trackTitle: string;
  priceDollars: number;
  birth1: string;
  name1: string;
  defaultBirth2: string;
  defaultName2: string;
  defaultRel2: string;
  deliveryChannel: DeliveryChannel;
  destination: string;
  paidAt: number;
  accessExpiresAt: number;
  windowHours: number;
  windowOpen: boolean;
  maxQuestions: number;
  questionsUsed: number;
  questionsRemaining: number;
  canSubmitQuestion: boolean;
  suggestedQuestionsUrl: string;
  passUrl: string;
  turnaround: string;
  questions: BuyerPassQuestionItem[];
}

export class ReadingPassError extends Error {
  status: 400 | 401 | 402 | 404 | 409 | 410 | 422;
  code: string;

  constructor(
    status: 400 | 401 | 402 | 404 | 409 | 410 | 422,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "ReadingPassError";
    this.status = status;
    this.code = code;
  }
}

export interface QuestionOrderStatement {
  bind(...values: unknown[]): {
    first<T = QuestionOrderRow>(): Promise<T | null>;
    all<T = QuestionOrderRow>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
  };
}

export interface QuestionOrderDB {
  prepare(sql: string): QuestionOrderStatement;
}

const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS question_reading_orders (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT UNIQUE,
  track TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  birth1 TEXT NOT NULL,
  name1 TEXT NOT NULL DEFAULT '',
  birth2 TEXT NOT NULL DEFAULT '',
  name2 TEXT NOT NULL DEFAULT '',
  rel2 TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  delivery_channel TEXT NOT NULL DEFAULT 'email',
  buyer_email TEXT NOT NULL DEFAULT '',
  buyer_phone TEXT NOT NULL DEFAULT '',
  sms_consent INTEGER NOT NULL DEFAULT 0,
  placement TEXT NOT NULL DEFAULT '',
  source_path TEXT NOT NULL DEFAULT '',
  attribution_json TEXT NOT NULL DEFAULT '{}',
  engine_facts_json TEXT,
  angles_json TEXT,
  steering_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_payment',
  approved_angle INTEGER,
  approved_subject TEXT,
  approved_body TEXT,
  approved_sms_body TEXT,
  delivery_log_json TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  angles_ready_at INTEGER,
  sent_at INTEGER
)`;

const schemaEnsuredForDb = new WeakSet<object>();

// Fallback process-local memory DB for local `next dev` when D1 binding isn't attached,
// and exported factory for deterministic isolated tests.
export function createMemoryQuestionOrderDb(): QuestionOrderDB {
  const rows = new Map<string, QuestionOrderRow>();
  return {
    prepare(sql: string): QuestionOrderStatement {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        bind(...values: unknown[]) {
          return {
            async first<T = QuestionOrderRow>(): Promise<T | null> {
              if (normalized.includes("WHERE id = ?")) {
                return ((rows.get(String(values[0])) ?? null) as unknown) as T | null;
              }
              if (normalized.includes("WHERE attempt_id = ?")) {
                for (const r of rows.values()) {
                  if (r.attempt_id === String(values[0])) return (r as unknown) as T;
                }
                return null;
              }
              if (normalized.includes("WHERE stripe_session_id = ?")) {
                for (const r of rows.values()) {
                  if (r.stripe_session_id === String(values[0])) return (r as unknown) as T;
                }
                return null;
              }
              return null;
            },
            async all<T = QuestionOrderRow>(): Promise<{ results: T[] }> {
              let list = Array.from(rows.values());
              if (normalized.includes("WHERE status NOT IN ('pending_payment', 'awaiting_question')")) {
                list = list.filter(
                  (r) => r.status !== "pending_payment" && r.status !== "awaiting_question",
                );
              } else if (normalized.includes("WHERE status != 'pending_payment'")) {
                list = list.filter((r) => r.status !== "pending_payment");
              } else if (normalized.includes("WHERE status = ?")) {
                list = list.filter((r) => r.status === String(values[0]));
              }
              list.sort((a, b) => (b.paid_at ?? b.created_at) - (a.paid_at ?? a.created_at));
              return { results: (list.slice(0, 50) as unknown) as T[] };
            },
            async run(): Promise<unknown> {
              if (normalized.startsWith("CREATE TABLE") || normalized.startsWith("CREATE INDEX")) {
                return { success: true };
              }
              if (normalized.startsWith("INSERT INTO question_reading_orders")) {
                const isChildInsert = normalized.includes("paid_at, status");
                if (isChildInsert) {
                  const [
                    id,
                    attempt_id,
                    track,
                    amount_cents,
                    currency,
                    birth1,
                    name1,
                    birth2,
                    name2,
                    rel2,
                    question,
                    delivery_channel,
                    buyer_email,
                    buyer_phone,
                    sms_consent,
                    placement,
                    source_path,
                    attribution_json,
                    engine_facts_json,
                    angles_json,
                    created_at,
                    paid_at,
                    status,
                    angles_ready_at,
                  ] = values;
                  for (const existing of rows.values()) {
                    if (existing.attempt_id === String(attempt_id)) {
                      throw new Error("UNIQUE constraint failed: question_reading_orders.attempt_id");
                    }
                  }
                  rows.set(String(id), {
                    id: String(id),
                    attempt_id: String(attempt_id),
                    stripe_session_id: null,
                    track: track as QuestionTrack,
                    amount_cents: Number(amount_cents),
                    currency: String(currency),
                    birth1: String(birth1),
                    name1: String(name1),
                    birth2: String(birth2),
                    name2: String(name2),
                    rel2: String(rel2),
                    question: String(question),
                    delivery_channel: delivery_channel as DeliveryChannel,
                    buyer_email: String(buyer_email),
                    buyer_phone: String(buyer_phone),
                    sms_consent: Number(sms_consent),
                    placement: String(placement),
                    source_path: String(source_path),
                    attribution_json: String(attribution_json),
                    engine_facts_json: engine_facts_json ? String(engine_facts_json) : null,
                    angles_json: angles_json ? String(angles_json) : null,
                    steering_note: "",
                    status: status as QuestionOrderStatus,
                    approved_angle: null,
                    approved_subject: null,
                    approved_body: null,
                    approved_sms_body: null,
                    delivery_log_json: null,
                    created_at: Number(created_at),
                    paid_at: Number(paid_at),
                    angles_ready_at: angles_ready_at ? Number(angles_ready_at) : null,
                    sent_at: null,
                  });
                  return { success: true };
                }

                const [
                  id,
                  attempt_id,
                  track,
                  amount_cents,
                  currency,
                  birth1,
                  name1,
                  birth2,
                  name2,
                  rel2,
                  question,
                  delivery_channel,
                  buyer_email,
                  buyer_phone,
                  sms_consent,
                  placement,
                  source_path,
                  attribution_json,
                  created_at,
                ] = values;
                for (const existing of rows.values()) {
                  if (existing.attempt_id === String(attempt_id)) {
                    throw new Error("UNIQUE constraint failed: question_reading_orders.attempt_id");
                  }
                }
                rows.set(String(id), {
                  id: String(id),
                  attempt_id: String(attempt_id),
                  stripe_session_id: null,
                  track: track as QuestionTrack,
                  amount_cents: Number(amount_cents),
                  currency: String(currency),
                  birth1: String(birth1),
                  name1: String(name1),
                  birth2: String(birth2),
                  name2: String(name2),
                  rel2: String(rel2),
                  question: String(question),
                  delivery_channel: delivery_channel as DeliveryChannel,
                  buyer_email: String(buyer_email),
                  buyer_phone: String(buyer_phone),
                  sms_consent: Number(sms_consent),
                  placement: String(placement),
                  source_path: String(source_path),
                  attribution_json: String(attribution_json),
                  engine_facts_json: null,
                  angles_json: null,
                  steering_note: "",
                  status: "pending_payment",
                  approved_angle: null,
                  approved_subject: null,
                  approved_body: null,
                  approved_sms_body: null,
                  delivery_log_json: null,
                  created_at: Number(created_at),
                  paid_at: null,
                  angles_ready_at: null,
                  sent_at: null,
                });
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET stripe_session_id = ?")) {
                const [sessionId, id] = values;
                const row = rows.get(String(id));
                if (row) row.stripe_session_id = String(sessionId);
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET status = ?, paid_at = COALESCE(paid_at, ?)")) {
                const [status, paidAt, buyerEmail, id] = values;
                const row = rows.get(String(id));
                if (row) {
                  row.status = status as QuestionOrderStatus;
                  row.paid_at = row.paid_at ?? Number(paidAt);
                  if (buyerEmail && !row.buyer_email) row.buyer_email = String(buyerEmail);
                }
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET question = ?, birth2 = ?, name2 = ?, rel2 = ?")) {
                const [qText, b2, n2, r2, factsJson, anglesJson, status, readyAt, id] = values;
                const row = rows.get(String(id));
                if (row) {
                  row.question = String(qText);
                  row.birth2 = String(b2);
                  row.name2 = String(n2);
                  row.rel2 = String(r2);
                  row.engine_facts_json = String(factsJson);
                  row.angles_json = String(anglesJson);
                  row.status = status as QuestionOrderStatus;
                  row.angles_ready_at = Number(readyAt);
                }
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET engine_facts_json = ?, angles_json = ?")) {
                const [factsJson, anglesJson, steeringNote, status, readyAt, id] = values;
                const row = rows.get(String(id));
                if (row) {
                  row.engine_facts_json = String(factsJson);
                  row.angles_json = String(anglesJson);
                  row.steering_note = String(steeringNote);
                  row.status = status as QuestionOrderStatus;
                  row.angles_ready_at = Number(readyAt);
                }
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET status = 'sent'")) {
                const [angle, subj, body, smsBody, logJson, sentAt, id] = values;
                const row = rows.get(String(id));
                if (row) {
                  row.status = "sent";
                  row.approved_angle = Number(angle);
                  row.approved_subject = String(subj);
                  row.approved_body = String(body);
                  row.approved_sms_body = String(smsBody);
                  row.delivery_log_json = String(logJson);
                  row.sent_at = Number(sentAt);
                }
                return { success: true };
              }
              if (normalized.startsWith("UPDATE question_reading_orders SET status = ? WHERE id = ?")) {
                const [status, id] = values;
                const row = rows.get(String(id));
                if (row && row.status === "pending_payment") {
                  row.status = status as QuestionOrderStatus;
                }
                return { success: true };
              }
              return { success: true };
            },
          };
        },
      };
    },
  };
}

let devFallbackDb: QuestionOrderDB | null = null;
let testOverrideDb: QuestionOrderDB | null = null;

export function setQuestionOrderTestDb(db: QuestionOrderDB | null): void {
  testOverrideDb = db;
}

export async function getQuestionOrderDb(): Promise<QuestionOrderDB> {
  if (testOverrideDb) return testOverrideDb;
  try {
    const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
    const env = getOptionalRequestContext()?.env as { READING_ORDERS?: QuestionOrderDB } | undefined;
    if (env?.READING_ORDERS) {
      if (!schemaEnsuredForDb.has(env.READING_ORDERS)) {
        await env.READING_ORDERS.prepare(CREATE_TABLE_SQL).bind().run();
        schemaEnsuredForDb.add(env.READING_ORDERS);
      }
      return env.READING_ORDERS;
    }
  } catch {
    // Node dev / test environment without Cloudflare request context
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("READING_ORDERS D1 database binding is not configured");
  }
  if (!devFallbackDb) devFallbackDb = createMemoryQuestionOrderDb();
  return devFallbackDb;
}

// --- Operator & Buyer Reading Pass HMAC Tokens ---

function getOpsSigningSecret(): string {
  return (
    process.env.OPS_INBOX_SECRET ||
    process.env.GATE_SECRET ||
    process.env.CARDOLOGY_GATE_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-local-ops-inbox-secret" : "")
  );
}

export async function signOpsOrderToken(orderId: string, ttlDays = 30): Promise<string> {
  const secret = getOpsSigningSecret();
  if (!secret) throw new Error("missing OPS_INBOX_SECRET / GATE_SECRET");
  const payload = {
    scope: "ops_question_order",
    orderId,
    exp: Date.now() + ttlDays * 86_400_000,
  };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyOpsOrderToken(
  token: string | null | undefined,
  expectedOrderId?: string,
): Promise<{ orderId: string } | null> {
  if (!token) return null;
  const secret = getOpsSigningSecret();
  if (!secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expectedSig = await hmac(payloadB64, secret);
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as {
      scope?: string;
      orderId?: string;
      exp?: number;
    };
    if (decoded.scope !== "ops_question_order" || typeof decoded.orderId !== "string") return null;
    if (typeof decoded.exp !== "number" || decoded.exp < Date.now()) return null;
    if (expectedOrderId && decoded.orderId !== expectedOrderId) return null;
    return { orderId: decoded.orderId };
  } catch {
    return null;
  }
}

export async function signReadingPassToken(rootOrderId: string, ttlDays = 90): Promise<string> {
  const secret = getOpsSigningSecret();
  if (!secret) throw new Error("missing OPS_INBOX_SECRET / GATE_SECRET");
  const payload = {
    scope: "buyer_reading_pass",
    orderId: rootOrderId,
    exp: Date.now() + ttlDays * 86_400_000,
  };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyReadingPassToken(
  token: string | null | undefined,
): Promise<{ orderId: string } | null> {
  if (!token) return null;
  const secret = getOpsSigningSecret();
  if (!secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expectedSig = await hmac(payloadB64, secret);
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as {
      scope?: string;
      orderId?: string;
      exp?: number;
    };
    if (decoded.scope !== "buyer_reading_pass" || typeof decoded.orderId !== "string") return null;
    if (typeof decoded.exp !== "number" || decoded.exp < Date.now()) return null;
    return { orderId: decoded.orderId };
  } catch {
    return null;
  }
}

export function verifyOpsMasterToken(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  const validTokens = [process.env.OPS_INBOX_TOKEN, process.env.LIVE_DASH_TOKEN]
    .map((t) => (t || "").trim())
    .filter(Boolean);
  for (const expected of validTokens) {
    if (safeEqual(trimmed, expected)) return true;
  }
  return false;
}

// --- Intake Validation ---

export type ValidatedQuestionIntake = {
  attemptId: string;
  track: QuestionTrack;
  birth1: string;
  name1: string;
  birth2: string;
  name2: string;
  rel2: string;
  question: string;
  deliveryChannel: DeliveryChannel;
  buyerEmail: string;
  buyerPhone: string;
  smsConsent: boolean;
  placement: string;
  sourcePath: string;
};

export type IntakeValidationError = {
  status: 400 | 422;
  code: string;
  error: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkBirthdateOrJoker(
  raw: unknown,
  fieldLabel: string,
): { ok: true; iso: string } | { ok: false; err: IntakeValidationError } {
  const str = typeof raw === "string" ? raw.trim() : "";
  const iso = canonicalCalendarDate(str);
  if (!iso) {
    return {
      ok: false,
      err: { status: 400, code: "INVALID_BIRTHDATE", error: `Enter a valid ${fieldLabel} (YYYY-MM-DD).` },
    };
  }
  const [year, month, day] = iso.split("-").map(Number);
  const currentYear = new Date().getUTCFullYear();
  if (year < 1900 || year > currentYear) {
    return {
      ok: false,
      err: { status: 400, code: "INVALID_BIRTH_YEAR", error: `Enter a real four-digit birth year for ${fieldLabel}.` },
    };
  }
  if (resolvePublicBirth(month, day).kind === "joker") {
    return {
      ok: false,
      err: {
        status: 422,
        code: "JOKER_UNSUPPORTED",
        error:
          "December 31 resolves to the Joker — outside the 52-card spread. Message us at /contact before paying so we tell you honestly what can and cannot be read.",
      },
    };
  }
  return { ok: true, iso };
}

function validateQuestionText(
  raw: unknown,
  allowEmpty: boolean,
): { ok: true; question: string } | { ok: false; err: IntakeValidationError } {
  const question = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (!question) {
    if (allowEmpty) return { ok: true, question: "" };
    return {
      ok: false,
      err: {
        status: 400,
        code: "QUESTION_TOO_SHORT",
        error: "Write at least a full sentence so Cass can answer your actual question.",
      },
    };
  }
  if (question.length < 12) {
    return {
      ok: false,
      err: {
        status: 400,
        code: "QUESTION_TOO_SHORT",
        error: "Write at least a full sentence so Cass can answer your actual question.",
      },
    };
  }
  if (question.length > 1200) {
    return {
      ok: false,
      err: {
        status: 400,
        code: "QUESTION_TOO_LONG",
        error: "Keep your question under 1,200 characters so the reading stays sharp.",
      },
    };
  }
  return { ok: true, question };
}

export function validateQuestionIntake(
  body: Record<string, unknown>,
): { ok: true; value: ValidatedQuestionIntake } | { ok: false; err: IntakeValidationError } {
  const rawTrack = body.track;
  if (rawTrack !== undefined && rawTrack !== null && rawTrack !== "" && !isQuestionTrack(rawTrack)) {
    return {
      ok: false,
      err: { status: 400, code: "INVALID_TRACK", error: "Select The Card Blueprint Reading ($99)." },
    };
  }
  // All new checkouts purchase the single unified $99 offer (The Card Blueprint Reading).
  const track: QuestionTrack = PRIMARY_QUESTION_TRACK;

  const b1 = checkBirthdateOrJoker(body.birth1, "birth date");
  if (!b1.ok) return b1;

  let b2Iso = "";
  if (typeof body.birth2 === "string" && body.birth2.trim()) {
    const b2 = checkBirthdateOrJoker(body.birth2, "second person's birth date");
    if (!b2.ok) return b2;
    b2Iso = b2.iso;
  }

  // Question #1 is optional at checkout — the buyer can either ask Question #1 right now
  // OR pay first, download the Suggested Questions Guide, and submit Questions 1–3 within 48 hours.
  const qChecked = validateQuestionText(body.question, true);
  if (!qChecked.ok) return qChecked;

  const deliveryChannel: DeliveryChannel = body.deliveryChannel === "sms" ? "sms" : "email";
  const rawEmail = typeof body.buyerEmail === "string" ? body.buyerEmail.trim().toLowerCase() : "";
  const rawPhone = typeof body.buyerPhone === "string" ? body.buyerPhone.trim() : "";
  const smsConsent = Boolean(body.smsConsent);

  let buyerEmail = "";
  if (rawEmail) {
    if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 180) {
      return {
        ok: false,
        err: { status: 400, code: "INVALID_EMAIL", error: "Enter a valid email address for delivery." },
      };
    }
    buyerEmail = rawEmail;
  }

  let buyerPhone = "";
  if (deliveryChannel === "sms") {
    const normalizedPhone = normalizePhoneE164(rawPhone);
    if (!normalizedPhone) {
      return {
        ok: false,
        err: {
          status: 400,
          code: "INVALID_PHONE",
          error: "Enter a valid 10-digit US/Canada or +country mobile number for text delivery.",
        },
      };
    }
    if (!smsConsent) {
      return {
        ok: false,
        err: {
          status: 400,
          code: "SMS_CONSENT_REQUIRED",
          error: "Confirm the text-delivery checkbox so we have permission to text your reading.",
        },
      };
    }
    buyerPhone = normalizedPhone;
  } else {
    if (!buyerEmail) {
      return {
        ok: false,
        err: { status: 400, code: "EMAIL_REQUIRED", error: "Enter the email address where Cass should send your reading." },
      };
    }
    if (rawPhone) {
      buyerPhone = normalizePhoneE164(rawPhone) ?? "";
    }
  }

  const attemptRaw = typeof body.attemptId === "string" ? body.attemptId.trim() : "";
  const attemptId = /^[a-zA-Z0-9_-]{8,80}$/.test(attemptRaw) ? attemptRaw : `att_${randomJti()}`;

  const cleanShort = (v: unknown, max = 80) =>
    typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";

  return {
    ok: true,
    value: {
      attemptId,
      track,
      birth1: b1.iso,
      name1: cleanShort(body.name1, 60),
      birth2: b2Iso,
      name2: cleanShort(body.name2, 60),
      rel2: cleanShort(body.rel2, 80),
      question: qChecked.question,
      deliveryChannel,
      buyerEmail,
      buyerPhone,
      smsConsent,
      placement: cleanShort(body.placement, 60) || "inline-drawer",
      sourcePath: sanitizeAnalyticsPath(body.sourcePath) || "/",
    },
  };
}

// --- Hydrate Row ---

function parseRowAttributionMeta(row: QuestionOrderRow): {
  parentOrderId: string;
  questionNumber: 1 | 2 | 3;
  funnel: FunnelContext;
} {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(row.attribution_json || "{}") as Record<string, unknown>;
  } catch {
    raw = {};
  }
  const parentOrderId =
    typeof raw.parentOrderId === "string" && raw.parentOrderId.trim()
      ? raw.parentOrderId.trim()
      : row.id;
  const qNum: 1 | 2 | 3 =
    raw.questionNumber === 2 || row.attempt_id.endsWith(":q2")
      ? 2
      : raw.questionNumber === 3 || row.attempt_id.endsWith(":q3")
        ? 3
        : 1;
  return {
    parentOrderId,
    questionNumber: qNum,
    funnel: raw as FunnelContext,
  };
}

export function hydrateQuestionOrder(row: QuestionOrderRow): HydratedQuestionOrder {
  let facts: QuestionReadingFacts | null = null;
  let angles: ReadingAngleDraft[] = [];
  let deliveryLog: Record<string, unknown> | null = null;
  try {
    if (row.engine_facts_json) facts = JSON.parse(row.engine_facts_json) as QuestionReadingFacts;
  } catch {
    facts = null;
  }
  try {
    if (row.angles_json) angles = JSON.parse(row.angles_json) as ReadingAngleDraft[];
  } catch {
    angles = [];
  }
  try {
    if (row.delivery_log_json) deliveryLog = JSON.parse(row.delivery_log_json) as Record<string, unknown>;
  } catch {
    deliveryLog = null;
  }

  const meta = parseRowAttributionMeta(row);
  const spec = QUESTION_READING_TRACKS[row.track] ?? CARD_BLUEPRINT_READING_SPEC;
  const preferredSmsText =
    row.approved_sms_body ||
    angles[0]?.smsBody ||
    `Hi${row.name1 ? ` ${row.name1}` : ""}, here is Question ${meta.questionNumber} of ${MAX_QUESTIONS_PER_ORDER} from your ${spec.title} at Card Blueprints.`;

  return {
    id: row.id,
    parentOrderId: meta.parentOrderId,
    questionNumber: meta.questionNumber,
    maxQuestions: MAX_QUESTIONS_PER_ORDER,
    attemptId: row.attempt_id,
    stripeSessionId: row.stripe_session_id,
    track: row.track,
    trackTitle: spec.title,
    amountCents: row.amount_cents || CARD_BLUEPRINT_READING_SPEC.amountCents,
    currency: row.currency,
    birth1: row.birth1,
    name1: row.name1,
    birth2: row.birth2,
    name2: row.name2,
    rel2: row.rel2,
    question: row.question,
    deliveryChannel: row.delivery_channel,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    smsConsent: Boolean(row.sms_consent),
    placement: row.placement,
    sourcePath: row.source_path,
    status: row.status,
    steeringNote: row.steering_note,
    facts,
    angles,
    approvedAngle: row.approved_angle,
    approvedSubject: row.approved_subject,
    approvedBody: row.approved_body,
    approvedSmsBody: row.approved_sms_body,
    deliveryLog,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    accessExpiresAt: row.paid_at ? row.paid_at + QUESTION_ACCESS_WINDOW_MS : null,
    anglesReadyAt: row.angles_ready_at,
    sentAt: row.sent_at,
    manualSmsHref: row.buyer_phone ? buildOperatorSmsHref(row.buyer_phone, preferredSmsText) : null,
  };
}

// --- CRUD & Fulfillment ---

export async function findOrderByAttempt(
  attemptId: string,
  db?: QuestionOrderDB,
): Promise<QuestionOrderRow | null> {
  const store = db ?? (await getQuestionOrderDb());
  return store
    .prepare("SELECT * FROM question_reading_orders WHERE attempt_id = ?")
    .bind(attemptId)
    .first<QuestionOrderRow>();
}

export async function getQuestionOrderById(
  orderId: string,
  db?: QuestionOrderDB,
): Promise<QuestionOrderRow | null> {
  const store = db ?? (await getQuestionOrderDb());
  return store
    .prepare("SELECT * FROM question_reading_orders WHERE id = ?")
    .bind(orderId)
    .first<QuestionOrderRow>();
}

export async function getQuestionOrderBySessionId(
  sessionId: string,
  db?: QuestionOrderDB,
): Promise<QuestionOrderRow | null> {
  const store = db ?? (await getQuestionOrderDb());
  return store
    .prepare("SELECT * FROM question_reading_orders WHERE stripe_session_id = ?")
    .bind(sessionId)
    .first<QuestionOrderRow>();
}

export async function listQuestionOrdersForInbox(
  statusFilter?: QuestionOrderStatus,
  db?: QuestionOrderDB,
): Promise<HydratedQuestionOrder[]> {
  const store = db ?? (await getQuestionOrderDb());
  const res = statusFilter
    ? await store
        .prepare("SELECT * FROM question_reading_orders WHERE status = ? ORDER BY created_at DESC LIMIT 50")
        .bind(statusFilter)
        .all<QuestionOrderRow>()
    : await store
        .prepare(
          "SELECT * FROM question_reading_orders WHERE status NOT IN ('pending_payment', 'awaiting_question') ORDER BY created_at DESC LIMIT 50",
        )
        .bind()
        .all<QuestionOrderRow>();
  return (res.results ?? []).map(hydrateQuestionOrder);
}

export async function createPendingQuestionOrder(
  intake: ValidatedQuestionIntake,
  attribution: FunnelContext,
  db?: QuestionOrderDB,
): Promise<QuestionOrderRow> {
  const store = db ?? (await getQuestionOrderDb());
  const existing = await findOrderByAttempt(intake.attemptId, store);
  if (existing) return existing;

  const spec = CARD_BLUEPRINT_READING_SPEC;
  const id = `qro_${randomJti()}`;
  const now = Date.now();

  await store
    .prepare(
      `INSERT INTO question_reading_orders (
        id, attempt_id, track, amount_cents, currency,
        birth1, name1, birth2, name2, rel2, question,
        delivery_channel, buyer_email, buyer_phone, sms_consent,
        placement, source_path, attribution_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      intake.attemptId,
      PRIMARY_QUESTION_TRACK,
      spec.amountCents,
      "usd",
      intake.birth1,
      intake.name1,
      intake.birth2,
      intake.name2,
      intake.rel2,
      intake.question,
      intake.deliveryChannel,
      intake.buyerEmail,
      intake.buyerPhone,
      intake.smsConsent ? 1 : 0,
      intake.placement,
      intake.sourcePath,
      JSON.stringify({ ...(attribution ?? {}), questionNumber: 1 }),
      now,
    )
    .run();

  const row = await getQuestionOrderById(id, store);
  if (!row) throw new Error("failed to persist question reading order");
  return row;
}

export async function attachStripeSessionToOrder(
  orderId: string,
  stripeSessionId: string,
  db?: QuestionOrderDB,
): Promise<void> {
  const store = db ?? (await getQuestionOrderDb());
  await store
    .prepare("UPDATE question_reading_orders SET stripe_session_id = ? WHERE id = ?")
    .bind(stripeSessionId, orderId)
    .run();
}

export async function markQuestionOrderExpired(
  orderId: string,
  db?: QuestionOrderDB,
): Promise<void> {
  const store = db ?? (await getQuestionOrderDb());
  await store
    .prepare("UPDATE question_reading_orders SET status = ? WHERE id = ?")
    .bind("expired", orderId)
    .run();
}

async function notifyOperatorOfQuestion(args: {
  row: QuestionOrderRow;
  facts: QuestionReadingFacts;
  angles: ReadingAngleDraft[];
  source: string;
  questionNumber: 1 | 2 | 3;
  emailSender?: typeof sendEmail;
  smsSender?: typeof sendSms;
}): Promise<void> {
  const { row, facts, angles, source, questionNumber } = args;
  const spec = CARD_BLUEPRINT_READING_SPEC;
  const magicToken = await signOpsOrderToken(row.id);
  const approvalUrl = `${SITE_URL}/ops/inbox?order=${encodeURIComponent(row.id)}&sig=${encodeURIComponent(magicToken)}`;

  const operatorEmail = process.env.INTAKE_EMAIL;
  if (operatorEmail) {
    const emailText = [
      `PAID CARD BLUEPRINT READING ($${spec.priceDollars} · Question ${questionNumber} of ${MAX_QUESTIONS_PER_ORDER})`,
      `Approve & send in 1 tap: ${approvalUrl}`,
      "",
      `Order ID: ${row.id}`,
      `Delivery requested: ${row.delivery_channel.toUpperCase()} ${
        row.delivery_channel === "sms" ? `(${row.buyer_phone})` : `(${row.buyer_email})`
      }`,
      row.buyer_email ? `Buyer email: ${row.buyer_email}` : "",
      row.buyer_phone ? `Buyer phone: ${row.buyer_phone}` : "",
      `Question ${questionNumber} of ${MAX_QUESTIONS_PER_ORDER}: "${row.question}"`,
      "",
      "SPREAD SUMMARY:",
      ...facts.summaryBullets.map((b) => `- ${b}`),
      "",
      ...angles.flatMap((a) => [
        `--- ANGLE ${a.angle}: ${a.label} (${source}) ---`,
        `Thesis: ${a.thesis}`,
        `Subject: ${a.subject}`,
        "",
        a.emailBody,
        "",
        `[SMS version]: ${a.smsBody}`,
        "",
      ]),
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const subject = `[Approve Reading · Q${questionNumber}/${MAX_QUESTIONS_PER_ORDER}] $${spec.priceDollars} ${spec.shortTitle} — ${
      row.name1 || row.buyer_email || row.buyer_phone
    }`;

    try {
      if (args.emailSender) {
        await args.emailSender({
          to: operatorEmail,
          subject,
          text: emailText,
          replyTo: row.buyer_email || undefined,
          idempotencyKey: `qro-ops/${row.id}`,
        });
      } else {
        await sendIntakeEmail({
          to: operatorEmail,
          subject,
          text: emailText,
          replyTo: row.buyer_email || undefined,
        });
      }
    } catch (err) {
      console.warn("[question-reading] operator notification email failed", err);
    }
  }

  const cassPhone = process.env.CASS_NOTIFY_PHONE;
  if (cassPhone) {
    const smsFn = args.smsSender ?? sendSms;
    await smsFn({
      to: cassPhone,
      body: `Card Blueprints: Q${questionNumber}/${MAX_QUESTIONS_PER_ORDER} $${spec.priceDollars} ${spec.shortTitle} (${row.delivery_channel.toUpperCase()}). "${row.question.slice(0, 85)}" — Approve & send: ${approvalUrl}`,
    }).catch(() => null);
  }
}

/**
 * Idempotent paid-order fulfillment:
 * 1. Marks order paid and stores fallback Stripe email if buyer checked out in SMS mode without typing email.
 * 2. Mints the buyer's 48-hour Reading Pass link + Suggested Questions PDF link and emails their receipt.
 * 3. If Question #1 was provided at checkout, computes spread facts + 3 AI angles and alerts Cass;
 *    if Question #1 was left blank so the buyer could read the Suggested Questions Guide first,
 *    parks status at 'awaiting_question' ready for /reading-pass or inline post-checkout submission.
 */
export async function fulfillPaidQuestionOrder(args: {
  orderId: string;
  stripeSessionId?: string;
  stripeBuyerEmail?: string;
  db?: QuestionOrderDB;
  llmChat?: Parameters<typeof generateThreeReadingAngles>[1] extends { llmChat?: infer F } ? F : never;
  emailSender?: typeof sendEmail;
  smsSender?: typeof sendSms;
}): Promise<HydratedQuestionOrder> {
  const store = args.db ?? (await getQuestionOrderDb());
  let row = await getQuestionOrderById(args.orderId, store);
  if (!row && args.stripeSessionId) {
    row = await getQuestionOrderBySessionId(args.stripeSessionId, store);
  }
  if (!row) throw new Error(`question order not found: ${args.orderId}`);

  // Already fulfilled -> idempotent return!
  if (
    row.status === "awaiting_question" ||
    ((row.status === "awaiting_approval" || row.status === "sent") && row.angles_json)
  ) {
    return hydrateQuestionOrder(row);
  }

  if (args.stripeSessionId && !row.stripe_session_id) {
    await attachStripeSessionToOrder(row.id, args.stripeSessionId, store);
  }

  const hasInitialQuestion = row.question.trim().length >= 12;
  const paidAt = Date.now();
  const stripeEmail = (args.stripeBuyerEmail || "").trim().toLowerCase();
  const interimStatus: QuestionOrderStatus = hasInitialQuestion
    ? "generating_angles"
    : "awaiting_question";

  await store
    .prepare(
      "UPDATE question_reading_orders SET status = ?, paid_at = COALESCE(paid_at, ?), buyer_email = CASE WHEN buyer_email = '' THEN ? ELSE buyer_email END WHERE id = ?",
    )
    .bind(interimStatus, paidAt, EMAIL_RE.test(stripeEmail) ? stripeEmail : "", row.id)
    .run();

  row = (await getQuestionOrderById(row.id, store))!;

  const spec = CARD_BLUEPRINT_READING_SPEC;
  const passToken = await signReadingPassToken(row.id);
  const passUrl = `${SITE_URL}/reading-pass?token=${encodeURIComponent(passToken)}`;
  const guideUrl = `${SITE_URL}${SUGGESTED_QUESTIONS_PDF_PATH}`;

  let facts: QuestionReadingFacts | null = null;
  let draftedAngles: ReadingAngleDraft[] = [];
  let draftedSource = "deterministic-fallback";

  if (hasInitialQuestion) {
    facts = await buildQuestionReadingFacts({
      track: row.track,
      birth1: row.birth1,
      name1: row.name1,
      birth2: row.birth2,
      name2: row.name2,
      rel2: row.rel2,
      question: row.question,
    });

    const drafted = await generateThreeReadingAngles(facts, {
      steeringNote: row.steering_note,
      questionNumber: 1,
      llmChat: args.llmChat,
    });
    draftedAngles = drafted.angles;
    draftedSource = drafted.source;

    const readyAt = Date.now();
    await store
      .prepare(
        "UPDATE question_reading_orders SET engine_facts_json = ?, angles_json = ?, steering_note = ?, status = ?, angles_ready_at = ? WHERE id = ?",
      )
      .bind(
        JSON.stringify(facts),
        JSON.stringify(drafted.angles),
        row.steering_note,
        "awaiting_approval",
        readyAt,
        row.id,
      )
      .run();
  }

  const updated = (await getQuestionOrderById(row.id, store))!;
  const hydrated = hydrateQuestionOrder(updated);

  // Send buyer receipt + Suggested Questions PDF + private 48h 3-question Reading Pass link
  const effectiveEmail = updated.buyer_email;
  const receiptLines = [
    updated.name1 ? `Hi ${updated.name1},` : "Hi,",
    "",
    `Your ${spec.title} ($${spec.priceDollars}) is confirmed.`,
    "",
    "1. DOWNLOAD YOUR SUGGESTED QUESTIONS GUIDE (PDF):",
    guideUrl,
    "",
    `2. YOUR 48-HOUR READING PASS (UP TO ${MAX_QUESTIONS_PER_ORDER} QUESTIONS):`,
    passUrl,
    "",
    hasInitialQuestion
      ? `Question 1 of ${MAX_QUESTIONS_PER_ORDER} received: "${updated.question}"\nYou still have ${MAX_QUESTIONS_PER_ORDER - 1} questions remaining on your pass over the next ${QUESTION_ACCESS_WINDOW_HOURS} hours — ask any follow-up or bring a second birthday anytime at the link above.`
      : `You have ${QUESTION_ACCESS_WINDOW_HOURS} hours from purchase to ask up to ${MAX_QUESTIONS_PER_ORDER} questions (pick from the guide or ask anything in your own words, solo or with a second birthday).`,
    "",
    `Delivery method: ${
      updated.delivery_channel === "sms"
        ? `Text message to ${updated.buyer_phone}${effectiveEmail ? ` (with email copy here)` : ""}`
        : `Email to ${effectiveEmail}`
    }`,
    `Turnaround per question: ${QUESTION_SLA_PROSE}.`,
    "",
    "If you need anything at all, just reply to this email.",
    "",
    "— Card Blueprints",
  ].join("\n");

  if (effectiveEmail) {
    const receiptSubject = hasInitialQuestion
      ? `Your Card Blueprint Reading Pass + Question 1 received`
      : `Your Card Blueprint Reading Pass + Suggested Questions Guide`;
    try {
      if (args.emailSender) {
        await args.emailSender({
          to: effectiveEmail,
          subject: receiptSubject,
          text: receiptLines,
          replyTo: process.env.INTAKE_EMAIL || undefined,
          idempotencyKey: `qro-receipt/${updated.id}`,
        });
      } else {
        await sendIntakeEmail({
          to: effectiveEmail,
          subject: receiptSubject,
          text: receiptLines,
          replyTo: process.env.INTAKE_EMAIL || undefined,
        });
      }
    } catch (err) {
      console.warn("[question-reading] buyer receipt email skipped", err);
    }
  } else if (updated.delivery_channel === "sms" && updated.buyer_phone) {
    // SMS-only checkout with no email on file: text the pass + PDF links so buyer never loses access.
    const smsFn = args.smsSender ?? sendSms;
    await smsFn({
      to: updated.buyer_phone,
      body: `Card Blueprints: Your $${spec.priceDollars} Reading Pass is live (${QUESTION_ACCESS_WINDOW_HOURS}h · up to ${MAX_QUESTIONS_PER_ORDER} questions). Suggested Questions PDF: ${guideUrl} — Ask questions here: ${passUrl}`,
    }).catch(() => null);
  }

  if (hasInitialQuestion && facts && draftedAngles.length === 3) {
    await notifyOperatorOfQuestion({
      row: updated,
      facts,
      angles: draftedAngles,
      source: draftedSource,
      questionNumber: 1,
      emailSender: args.emailSender,
      smsSender: args.smsSender,
    });
  }

  return hydrated;
}

// --- 48-Hour 3-Question Reading Pass State & Submissions ---

function toBuyerPassQuestionItem(
  row: QuestionOrderRow,
  questionNumber: 1 | 2 | 3,
): BuyerPassQuestionItem {
  return {
    questionNumber,
    orderId: row.id,
    question: row.question,
    birth1: row.birth1,
    name1: row.name1,
    birth2: row.birth2,
    name2: row.name2,
    rel2: row.rel2,
    status: row.status,
    submittedAt: row.angles_ready_at ?? row.paid_at ?? row.created_at,
    sentAt: row.sent_at,
    approvedSubject: row.status === "sent" ? row.approved_subject : null,
    approvedBody: row.status === "sent" ? row.approved_body : null,
    approvedSmsBody: row.status === "sent" ? row.approved_sms_body : null,
  };
}

export async function getReadingPassState(
  rootOrderId: string,
  opts: { db?: QuestionOrderDB; nowMs?: number } = {},
): Promise<ReadingPassState> {
  const store = opts.db ?? (await getQuestionOrderDb());
  const rootRow = await getQuestionOrderById(rootOrderId, store);
  if (!rootRow) {
    throw new ReadingPassError(404, "ORDER_NOT_FOUND", "Reading Pass not found.");
  }
  if (!rootRow.paid_at || rootRow.status === "pending_payment" || rootRow.status === "expired") {
    throw new ReadingPassError(402, "ORDER_NOT_PAID", "This Reading Pass has not completed payment yet.");
  }

  const q2Row = await findOrderByAttempt(`${rootRow.id}:q2`, store);
  const q3Row = await findOrderByAttempt(`${rootRow.id}:q3`, store);

  const questions: BuyerPassQuestionItem[] = [];
  if (rootRow.question.trim().length >= 12 && rootRow.status !== "awaiting_question") {
    questions.push(toBuyerPassQuestionItem(rootRow, 1));
  }
  if (q2Row && q2Row.question.trim().length >= 12) {
    questions.push(toBuyerPassQuestionItem(q2Row, 2));
  }
  if (q3Row && q3Row.question.trim().length >= 12) {
    questions.push(toBuyerPassQuestionItem(q3Row, 3));
  }

  const now = opts.nowMs ?? Date.now();
  const accessExpiresAt = rootRow.paid_at + QUESTION_ACCESS_WINDOW_MS;
  const windowOpen = now <= accessExpiresAt;
  const questionsUsed = questions.length;
  const questionsRemaining = Math.max(0, MAX_QUESTIONS_PER_ORDER - questionsUsed);
  const passToken = await signReadingPassToken(rootRow.id);

  return {
    orderId: rootRow.id,
    trackTitle: CARD_BLUEPRINT_READING_SPEC.title,
    priceDollars: CARD_BLUEPRINT_READING_SPEC.priceDollars,
    birth1: rootRow.birth1,
    name1: rootRow.name1,
    defaultBirth2: rootRow.birth2,
    defaultName2: rootRow.name2,
    defaultRel2: rootRow.rel2,
    deliveryChannel: rootRow.delivery_channel,
    destination:
      rootRow.delivery_channel === "sms"
        ? rootRow.buyer_phone || rootRow.buyer_email
        : rootRow.buyer_email || rootRow.buyer_phone,
    paidAt: rootRow.paid_at,
    accessExpiresAt,
    windowHours: QUESTION_ACCESS_WINDOW_HOURS,
    windowOpen,
    maxQuestions: MAX_QUESTIONS_PER_ORDER,
    questionsUsed,
    questionsRemaining,
    canSubmitQuestion: windowOpen && questionsRemaining > 0,
    suggestedQuestionsUrl: SUGGESTED_QUESTIONS_PDF_PATH,
    passUrl: `${SITE_URL}/reading-pass?token=${encodeURIComponent(passToken)}`,
    turnaround: QUESTION_SLA_PROSE,
    questions,
  };
}

export async function submitReadingPassQuestion(args: {
  rootOrderId: string;
  question: unknown;
  birth2?: unknown;
  name2?: unknown;
  rel2?: unknown;
  nowMs?: number;
  db?: QuestionOrderDB;
  llmChat?: Parameters<typeof generateThreeReadingAngles>[1] extends { llmChat?: infer F } ? F : never;
  emailSender?: typeof sendEmail;
  smsSender?: typeof sendSms;
}): Promise<{
  state: ReadingPassState;
  submittedQuestionNumber: 1 | 2 | 3;
  submittedOrderId: string;
}> {
  const store = args.db ?? (await getQuestionOrderDb());
  const rootRow = await getQuestionOrderById(args.rootOrderId, store);
  if (!rootRow) {
    throw new ReadingPassError(404, "ORDER_NOT_FOUND", "Reading Pass not found.");
  }
  if (!rootRow.paid_at || rootRow.status === "pending_payment" || rootRow.status === "expired") {
    throw new ReadingPassError(402, "ORDER_NOT_PAID", "This Reading Pass has not completed payment yet.");
  }

  const now = args.nowMs ?? Date.now();
  const accessExpiresAt = rootRow.paid_at + QUESTION_ACCESS_WINDOW_MS;
  if (now > accessExpiresAt) {
    throw new ReadingPassError(
      410,
      "WINDOW_EXPIRED",
      "Your 48-hour question window after purchase has closed. Your Suggested Questions PDF and delivered readings remain available below.",
    );
  }

  const q2Row = await findOrderByAttempt(`${rootRow.id}:q2`, store);
  const q3Row = await findOrderByAttempt(`${rootRow.id}:q3`, store);

  const q1Taken = rootRow.question.trim().length >= 12 && rootRow.status !== "awaiting_question";
  let slotNumber: 1 | 2 | 3;
  if (!q1Taken) {
    slotNumber = 1;
  } else if (!q2Row) {
    slotNumber = 2;
  } else if (!q3Row) {
    slotNumber = 3;
  } else {
    throw new ReadingPassError(
      409,
      "QUESTION_LIMIT_REACHED",
      `All ${MAX_QUESTIONS_PER_ORDER} questions included with this Reading Pass have been used.`,
    );
  }

  const qChecked = validateQuestionText(args.question, false);
  if (!qChecked.ok) {
    throw new ReadingPassError(qChecked.err.status, qChecked.err.code, qChecked.err.error);
  }

  let b2Iso = "";
  if (typeof args.birth2 === "string" && args.birth2.trim()) {
    const b2 = checkBirthdateOrJoker(args.birth2, "second person's birth date");
    if (!b2.ok) {
      throw new ReadingPassError(b2.err.status, b2.err.code, b2.err.error);
    }
    b2Iso = b2.iso;
  }

  const cleanShort = (v: unknown, max = 80) =>
    typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
  const name2 = b2Iso ? cleanShort(args.name2, 60) || rootRow.name2 : "";
  const rel2 = b2Iso ? cleanShort(args.rel2, 80) || rootRow.rel2 : "";

  const priorQuestions: PriorQuestionContext[] = [];
  if (q1Taken) {
    priorQuestions.push({
      number: 1,
      question: rootRow.question,
      answer: rootRow.approved_body,
    });
  }
  if (q2Row && q2Row.question.trim().length >= 12) {
    priorQuestions.push({
      number: 2,
      question: q2Row.question,
      answer: q2Row.approved_body,
    });
  }

  let facts: QuestionReadingFacts;
  try {
    facts = await buildQuestionReadingFacts({
      track: PRIMARY_QUESTION_TRACK,
      birth1: rootRow.birth1,
      name1: rootRow.name1,
      birth2: b2Iso,
      name2,
      rel2,
      question: qChecked.question,
    });
  } catch (err) {
    if (err instanceof JokerNotSupportedError) {
      throw new ReadingPassError(
        422,
        "JOKER_UNSUPPORTED",
        "December 31 resolves to the Joker — outside the 52-card spread.",
      );
    }
    throw err;
  }

  const drafted = await generateThreeReadingAngles(facts, {
    questionNumber: slotNumber,
    priorQuestions,
    llmChat: args.llmChat,
  });

  let targetRow: QuestionOrderRow;
  const readyAt = Date.now();

  if (slotNumber === 1) {
    await store
      .prepare(
        "UPDATE question_reading_orders SET question = ?, birth2 = ?, name2 = ?, rel2 = ?, engine_facts_json = ?, angles_json = ?, status = ?, angles_ready_at = ? WHERE id = ?",
      )
      .bind(
        qChecked.question,
        b2Iso,
        name2,
        rel2,
        JSON.stringify(facts),
        JSON.stringify(drafted.angles),
        "awaiting_approval",
        readyAt,
        rootRow.id,
      )
      .run();
    targetRow = (await getQuestionOrderById(rootRow.id, store))!;
  } else {
    const childId = `qro_${randomJti()}`;
    const childAttemptId = `${rootRow.id}:q${slotNumber}`;
    let baseAttr: Record<string, unknown> = {};
    try {
      baseAttr = JSON.parse(rootRow.attribution_json || "{}") as Record<string, unknown>;
    } catch {
      baseAttr = {};
    }
    const childAttr = {
      ...baseAttr,
      parentOrderId: rootRow.id,
      questionNumber: slotNumber,
    };

    try {
      await store
        .prepare(
          `INSERT INTO question_reading_orders (
            id, attempt_id, track, amount_cents, currency,
            birth1, name1, birth2, name2, rel2, question,
            delivery_channel, buyer_email, buyer_phone, sms_consent,
            placement, source_path, attribution_json,
            engine_facts_json, angles_json, created_at, paid_at, status, angles_ready_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          childId,
          childAttemptId,
          PRIMARY_QUESTION_TRACK,
          0,
          rootRow.currency || "usd",
          rootRow.birth1,
          rootRow.name1,
          b2Iso,
          name2,
          rel2,
          qChecked.question,
          rootRow.delivery_channel,
          rootRow.buyer_email,
          rootRow.buyer_phone,
          rootRow.sms_consent,
          `${rootRow.placement}:pass-q${slotNumber}`.slice(0, 60),
          rootRow.source_path,
          JSON.stringify(childAttr),
          JSON.stringify(facts),
          JSON.stringify(drafted.angles),
          readyAt,
          rootRow.paid_at,
          "awaiting_approval",
          readyAt,
        )
        .run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/UNIQUE constraint/i.test(msg)) {
        throw new ReadingPassError(
          409,
          "QUESTION_LIMIT_REACHED",
          `Question ${slotNumber} was already submitted for this Reading Pass.`,
        );
      }
      throw err;
    }

    targetRow = (await getQuestionOrderById(childId, store))!;
  }

  await notifyOperatorOfQuestion({
    row: targetRow,
    facts,
    angles: drafted.angles,
    source: drafted.source,
    questionNumber: slotNumber,
    emailSender: args.emailSender,
    smsSender: args.smsSender,
  });

  const state = await getReadingPassState(rootRow.id, { db: store, nowMs: now });
  return {
    state,
    submittedQuestionNumber: slotNumber,
    submittedOrderId: targetRow.id,
  };
}

export async function regenerateQuestionOrderAngles(args: {
  orderId: string;
  steeringNote?: string;
  db?: QuestionOrderDB;
  llmChat?: Parameters<typeof generateThreeReadingAngles>[1] extends { llmChat?: infer F } ? F : never;
}): Promise<HydratedQuestionOrder> {
  const store = args.db ?? (await getQuestionOrderDb());
  const row = await getQuestionOrderById(args.orderId, store);
  if (!row) throw new Error("order not found");

  const meta = parseRowAttributionMeta(row);
  const facts =
    row.engine_facts_json
      ? (JSON.parse(row.engine_facts_json) as QuestionReadingFacts)
      : await buildQuestionReadingFacts({
          track: row.track,
          birth1: row.birth1,
          name1: row.name1,
          birth2: row.birth2,
          name2: row.name2,
          rel2: row.rel2,
          question: row.question,
        });

  const note = typeof args.steeringNote === "string" ? args.steeringNote.trim().slice(0, 500) : row.steering_note;
  const drafted = await generateThreeReadingAngles(facts, {
    steeringNote: note,
    questionNumber: meta.questionNumber,
    llmChat: args.llmChat,
  });

  await store
    .prepare(
      "UPDATE question_reading_orders SET engine_facts_json = ?, angles_json = ?, steering_note = ?, status = ?, angles_ready_at = ? WHERE id = ?",
    )
    .bind(
      JSON.stringify(facts),
      JSON.stringify(drafted.angles),
      note,
      row.status === "sent" ? "sent" : "awaiting_approval",
      Date.now(),
      row.id,
    )
    .run();

  const updated = (await getQuestionOrderById(row.id, store))!;
  return hydrateQuestionOrder(updated);
}

export interface ApproveDispatchResult {
  order: HydratedQuestionOrder;
  emailSent: boolean;
  smsSent: boolean;
  requiresManualSmsTap: boolean;
  manualSmsHref: string | null;
  warnings: string[];
}

export async function approveAndSendQuestionOrder(args: {
  orderId: string;
  angle: 1 | 2 | 3;
  subject?: string;
  emailBody?: string;
  smsBody?: string;
  manualSmsDispatched?: boolean;
  db?: QuestionOrderDB;
  emailSender?: typeof sendEmail;
  smsSender?: typeof sendSms;
}): Promise<ApproveDispatchResult> {
  const store = args.db ?? (await getQuestionOrderDb());
  const row = await getQuestionOrderById(args.orderId, store);
  if (!row) throw new Error("order not found");

  const hydrated = hydrateQuestionOrder(row);
  const chosen = hydrated.angles.find((a) => a.angle === args.angle) ?? hydrated.angles[0];
  if (!chosen && !args.emailBody && !args.smsBody) {
    throw new Error("no drafted angle available to approve");
  }

  const finalSubject = (args.subject?.trim() || chosen?.subject || `Your ${hydrated.trackTitle}`).slice(0, 200);
  const finalEmailBody = (args.emailBody?.trim() || chosen?.emailBody || "").trim();
  const finalSmsBody = (args.smsBody?.trim() || chosen?.smsBody || finalEmailBody.slice(0, 900)).trim();

  const warnings: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let requiresManualSmsTap = false;

  const sendMailFn = args.emailSender ?? sendEmail;
  const sendSmsFn = args.smsSender ?? sendSms;

  // 1. If SMS delivery was chosen, try automated Twilio first (unless operator already clicked 1-tap manual SMS)
  if (row.delivery_channel === "sms" && row.buyer_phone) {
    if (args.manualSmsDispatched) {
      smsSent = true;
    } else {
      const smsRes = await sendSmsFn({ to: row.buyer_phone, body: finalSmsBody });
      if (smsRes.ok) {
        smsSent = true;
      } else if (smsRes.code === "not_configured") {
        requiresManualSmsTap = true;
        warnings.push("Twilio secrets not configured — tap 'Open in iMessage / SMS' to send text directly from your phone.");
      } else {
        requiresManualSmsTap = true;
        warnings.push(`Twilio error (${smsRes.message}) — use 'Open in iMessage / SMS' button to send manually.`);
      }
    }
  }

  // 2. Append private 48h Reading Pass footer to the email body when questions remain so the buyer can ask Q2/Q3 effortlessly
  let emailBodyWithPass = finalEmailBody;
  try {
    const passState = await getReadingPassState(hydrated.parentOrderId, { db: store });
    if (passState.canSubmitQuestion) {
      emailBodyWithPass = `${finalEmailBody}\n\n---\nReading Pass (${passState.questionsRemaining} of ${passState.maxQuestions} questions remaining in your 48-hour window):\n${passState.passUrl}`;
    }
  } catch {
    // Keep plain emailBody if parent pass lookup is unavailable
  }

  // 3. Send email whenever email is primary OR as backup on SMS orders when buyer supplied email
  if (row.buyer_email && emailBodyWithPass) {
    try {
      await sendMailFn({
        to: row.buyer_email,
        subject: finalSubject,
        text: emailBodyWithPass,
        replyTo: process.env.INTAKE_EMAIL || undefined,
        idempotencyKey: `qro-deliver/${row.id}/a${args.angle}`,
      });
      emailSent = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "email send failed";
      if (row.delivery_channel === "email") {
        throw new Error(`Email delivery failed: ${msg}`);
      }
      warnings.push(`Backup email skipped: ${msg}`);
    }
  }

  const manualHref = row.buyer_phone ? buildOperatorSmsHref(row.buyer_phone, finalSmsBody) : null;

  // Only mark 'sent' once the primary requested channel actually went out (or manual SMS confirmed)
  if (row.delivery_channel === "sms" && !smsSent && requiresManualSmsTap) {
    return {
      order: hydrated,
      emailSent,
      smsSent: false,
      requiresManualSmsTap: true,
      manualSmsHref: manualHref,
      warnings,
    };
  }

  const sentAt = Date.now();
  const logPayload = {
    sentAtIso: new Date(sentAt).toISOString(),
    angle: args.angle,
    questionNumber: hydrated.questionNumber,
    emailSent,
    smsSent,
    manualSmsDispatched: Boolean(args.manualSmsDispatched),
    warnings,
  };

  await store
    .prepare(
      "UPDATE question_reading_orders SET status = 'sent', approved_angle = ?, approved_subject = ?, approved_body = ?, approved_sms_body = ?, delivery_log_json = ?, sent_at = ? WHERE id = ?",
    )
    .bind(
      args.angle,
      finalSubject,
      finalEmailBody,
      finalSmsBody,
      JSON.stringify(logPayload),
      sentAt,
      row.id,
    )
    .run();

  const meta = parseRowAttributionMeta(row);
  recordFunnelEvent({
    name: "reading_delivered",
    source: "server",
    ...meta.funnel,
    eventId: `qro_sent:${row.id}`,
    path: "/api/ops/inbox",
    offerSlug: row.track,
    placement: row.placement,
    outcome: `${row.delivery_channel}:q${hydrated.questionNumber}:angle-${args.angle}`,
    currency: row.currency,
    valueCents: row.amount_cents,
  });

  const finalRow = (await getQuestionOrderById(row.id, store))!;
  return {
    order: hydrateQuestionOrder(finalRow),
    emailSent,
    smsSent,
    requiresManualSmsTap: false,
    manualSmsHref: manualHref,
    warnings,
  };
}
