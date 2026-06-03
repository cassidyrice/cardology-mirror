// Access-gate tokens for the AI deep-dive / story features.
// Edge-compatible (Web Crypto only — no node:crypto), so it runs on Cloudflare.
//
// A token is `base64url(payload).base64url(hmacSHA256(payload))` where payload is
// JSON {email, exp}. The secret is GATE_SECRET (a Cloudflare secret in prod).
//
// v1 unlock = a shared access code (CARDOLOGY_ACCESS_CODES). The mint/verify split
// leaves a clean seam to swap in Stripe/webhook-issued tokens later without
// touching the AI routes.

const enc = new TextEncoder();

const DEFAULT_TTL_DAYS = 30;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string {
  return process.env.GATE_SECRET || process.env.CARDOLOGY_GATE_SECRET || "";
}

async function hmac(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return b64urlEncode(new Uint8Array(sig));
}

// Constant-time-ish string compare.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
