// Signed download tokens for digital products (PDF e-books).
// Edge-compatible Web Crypto — same shape as lib/gate.ts, distinct payload.
//
// Token: base64url(payload).base64url(hmacSHA256(payload))
// Payload: { email, slug, exp, jti }
// Secret: DOWNLOAD_TOKEN_SECRET, falling back to GATE_SECRET.

import { b64urlEncode, b64urlDecode, hmac, safeEqual, randomJti } from "./token-crypto";

const enc = new TextEncoder();

const DEFAULT_TTL_DAYS = 30;

function getSecret(): string {
  return (
    process.env.DOWNLOAD_TOKEN_SECRET ||
    process.env.GATE_SECRET ||
    process.env.CARDOLOGY_GATE_SECRET ||
    ""
  );
}

export interface DownloadPayload {
  email: string;
  slug: string;
  exp: number; // epoch ms
  jti: string;
}

export async function mintDownloadToken(
  email: string,
  slug: string,
  ttlDays = DEFAULT_TTL_DAYS,
): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("missing DOWNLOAD_TOKEN_SECRET or GATE_SECRET");
  const payload: DownloadPayload = {
    email: email.trim().toLowerCase(),
    slug,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    jti: randomJti(),
  };
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyDownloadToken(
  token: string | null | undefined,
): Promise<DownloadPayload | null> {
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
    ) as DownloadPayload;
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Date.now() ||
      typeof payload.email !== "string" ||
      typeof payload.slug !== "string" ||
      typeof payload.jti !== "string"
    ) {
      return null;
    }
    return {
      email: payload.email.trim().toLowerCase(),
      slug: payload.slug,
      exp: payload.exp,
      jti: payload.jti,
    };
  } catch {
    return null;
  }
}
