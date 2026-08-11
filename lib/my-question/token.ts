export type OrderAccessScope = "fulfill" | "onboarding";

export type OrderAccessPayload = {
  orderId: string;
  scope: OrderAccessScope;
  expiresAt: string;
};

type VerificationResult =
  | { ok: true; payload: OrderAccessPayload }
  | {
      ok: false;
      code: "invalid_token" | "wrong_scope" | "expired_token";
    };

const encoder = new TextEncoder();

export async function signOrderAccess(
  payload: OrderAccessPayload,
  secret: string,
): Promise<string> {
  assertSigningSecret(secret);
  const encodedPayload = base64UrlEncode(
    encoder.encode(JSON.stringify(payload)),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSigningKey(secret, ["sign"]),
    encoder.encode(encodedPayload),
  );
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyOrderAccess(
  token: string,
  secret: string,
  expectedScope: OrderAccessScope,
  now = new Date(),
): Promise<VerificationResult> {
  try {
    assertSigningSecret(secret);
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) {
      return { ok: false, code: "invalid_token" };
    }

    const signature = base64UrlDecode(encodedSignature);
    const verified = await crypto.subtle.verify(
      "HMAC",
      await importSigningKey(secret, ["verify"]),
      signature.buffer as ArrayBuffer,
      encoder.encode(encodedPayload),
    );
    if (!verified) return { ok: false, code: "invalid_token" };

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encodedPayload)),
    ) as Partial<OrderAccessPayload>;
    if (
      typeof payload.orderId !== "string" ||
      !payload.orderId ||
      (payload.scope !== "fulfill" && payload.scope !== "onboarding") ||
      typeof payload.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(payload.expiresAt))
    ) {
      return { ok: false, code: "invalid_token" };
    }
    if (payload.scope !== expectedScope) {
      return { ok: false, code: "wrong_scope" };
    }
    if (Date.parse(payload.expiresAt) <= now.getTime()) {
      return { ok: false, code: "expired_token" };
    }

    return {
      ok: true,
      payload: payload as OrderAccessPayload,
    };
  } catch {
    return { ok: false, code: "invalid_token" };
  }
}

async function importSigningKey(
  secret: string,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

function assertSigningSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error("Signing secret must be at least 32 characters");
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
