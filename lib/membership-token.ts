// Signed membership-access tokens for the recurring Cardology Membership.
// Payload: { email, slug, subscriptionId, birthdate, exp, jti }
// Re-minted on each Stripe billing cycle (invoice.paid) to push exp forward.
// Secret: MEMBERSHIP_TOKEN_SECRET, falling back to REPORT_TOKEN_SECRET, then GATE_SECRET.

import { b64urlEncode, b64urlDecode, hmac, safeEqual, randomJti } from "./token-crypto";

const enc = new TextEncoder();
const DEFAULT_TTL_DAYS = 35; // billing period (~30d) + grace window for renewal email/webhook lag

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
