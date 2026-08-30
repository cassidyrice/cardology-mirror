// Signed membership-access tokens for the recurring Cardology Membership.
// Payload: { email, slug, subscriptionId, birthdate, exp, jti }
// Re-minted on each Stripe billing cycle (invoice.paid) to push exp forward.
// Secret: MEMBERSHIP_TOKEN_SECRET, falling back to REPORT_TOKEN_SECRET, then GATE_SECRET.

const enc = new TextEncoder();
const DEFAULT_TTL_DAYS = 35; // billing period (~30d) + grace window for renewal email/webhook lag

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
  return (
    process.env.MEMBERSHIP_TOKEN_SECRET ||
    process.env.REPORT_TOKEN_SECRET ||
    process.env.DOWNLOAD_TOKEN_SECRET ||
    process.env.GATE_SECRET ||
    process.env.CARDOLOGY_GATE_SECRET ||
    ""
  );
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomJti(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

export interface MembershipPayload {
  email: string;
  slug: string;
  subscriptionId: string;
  birthdate: string;
  exp: number;
  jti: string;
}

export async function mintMembershipToken(
  email: string,
  slug: string,
  subscriptionId: string,
  birthdate: string,
  ttlDays = DEFAULT_TTL_DAYS,
): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("missing MEMBERSHIP_TOKEN_SECRET");
  const payload: MembershipPayload = {
    email: email.trim().toLowerCase(),
    slug,
    subscriptionId,
    birthdate,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    jti: randomJti(),
  };
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyMembershipToken(
  token: string | null | undefined,
): Promise<MembershipPayload | null> {
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
    ) as MembershipPayload;
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Date.now() ||
      typeof payload.email !== "string" ||
      typeof payload.slug !== "string" ||
      typeof payload.subscriptionId !== "string" ||
      typeof payload.birthdate !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
