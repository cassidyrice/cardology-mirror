// Signed report-access tokens for instant personalized reports.
// Payload: { email, slug, sessionId, birthdate, exp, jti }
// Secret: REPORT_TOKEN_SECRET, falling back to DOWNLOAD_TOKEN_SECRET, then GATE_SECRET.

import { b64urlEncode, b64urlDecode, hmac, safeEqual, randomJti } from "./token-crypto";

const enc = new TextEncoder();
const DEFAULT_TTL_DAYS = 365;

function getSecret(): string {
  return (
    process.env.REPORT_TOKEN_SECRET ||
    process.env.DOWNLOAD_TOKEN_SECRET ||
    process.env.GATE_SECRET ||
    process.env.CARDOLOGY_GATE_SECRET ||
    ""
  );
}

export interface ReportPayload {
  email: string;
  slug: string;
  sessionId: string;
  birthdate: string;
  exp: number;
  jti: string;
}

export async function mintReportToken(
  email: string,
  slug: string,
  sessionId: string,
  birthdate: string,
  ttlDays = DEFAULT_TTL_DAYS,
): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("missing REPORT_TOKEN_SECRET");
  const payload: ReportPayload = {
    email: email.trim().toLowerCase(),
    slug,
    sessionId,
    birthdate,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    jti: randomJti(),
  };
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyReportToken(
  token: string | null | undefined,
): Promise<ReportPayload | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = await hmac(payloadB64, secret);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64)),
    ) as ReportPayload;
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Date.now() ||
      typeof payload.email !== "string" ||
      typeof payload.slug !== "string" ||
      typeof payload.sessionId !== "string" ||
      typeof payload.birthdate !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
