/** Sample-path cache key + input normalization. Cache key = date + sha256 of
 *  normalized business text (whitespace collapsed, trimmed, lowercased). */

export const SAMPLE_RATE_SCOPE = "content-engine-sample";
export const SAMPLE_LIMIT = 5;
export const SAMPLE_WINDOW_MS = 60 * 60 * 1000;
export const MAX_BUSINESS = 240;
export const SAMPLE_CACHE_PREFIX = "content-engine-sample";

export function normalizeBusiness(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_BUSINESS);
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sampleCacheKey(
  startDate: string,
  business: string,
): Promise<string> {
  const normalized = normalizeBusiness(business);
  const hash = await sha256Hex(normalized.toLowerCase());
  return `${SAMPLE_CACHE_PREFIX}:${startDate}:${hash}`;
}
