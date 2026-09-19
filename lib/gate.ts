// Access-gate tokens for the AI deep-dive / story features.
// Edge-compatible (Web Crypto only — no node:crypto), so it runs on Cloudflare.
//
// A token is `base64url(payload).base64url(hmacSHA256(payload))` where payload is
// JSON {email, exp}. The secret is GATE_SECRET (a Cloudflare secret in prod).
//
// v1 unlock = a shared access code (CARDOLOGY_ACCESS_CODES). The mint/verify split
// leaves a clean seam to swap in Stripe/webhook-issued tokens later without
// touching the AI routes.

import { b64urlEncode, b64urlDecode, hmac, safeEqual } from "./token-crypto";

const enc = new TextEncoder();

const DEFAULT_TTL_DAYS = 30;

function getSecret(): string {
  return process.env.GATE_SECRET || process.env.CARDOLOGY_GATE_SECRET || "";
}

export interface GatePayload {
  email: string;
  exp: number; // epoch ms
}

export async function mintToken(
  email: string,
  ttlDays = DEFAULT_TTL_DAYS,
): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("missing GATE_SECRET");
  const payload: GatePayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyToken(token: string | null | undefined): Promise<GatePayload | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = await hmac(payloadB64, secret);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as GatePayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    // Legacy gate tokens contain email + exp. Product tokens carry a slug and
    // must not unlock the general AI gate when signing secrets share a fallback.
    if (typeof payload.email !== "string" || "slug" in payload) return null;
    return payload;
  } catch {
    return null;
  }
}

// The valid unlock codes (comma-separated env). Case-insensitive, trimmed.
export function isValidAccessCode(code: string): boolean {
  const raw = process.env.CARDOLOGY_ACCESS_CODES || process.env.ACCESS_CODE || "";
  const codes = raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  if (codes.length === 0) return false;
  return codes.includes(code.trim().toLowerCase());
}

// Pull a bearer token from a request's Authorization header.
export function bearerFrom(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
