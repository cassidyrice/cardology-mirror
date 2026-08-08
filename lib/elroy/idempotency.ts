const enc = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Short-window idempotency key: no raw email/date in the key itself. */
export async function buildElroyIdempotencyKey(
  email: string,
  birthdate: string,
  now = new Date(),
): Promise<string> {
  const bucket = Math.floor(now.getTime() / (10 * 60 * 1000));
  const material = `${email.trim().toLowerCase()}|${birthdate}|${bucket}`;
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(material));
  return `elroy-${toHex(digest).slice(0, 40)}`;
}
