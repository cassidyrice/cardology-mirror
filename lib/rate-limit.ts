// Best-effort edge rate limiter for sensitive API routes.
//
// Cloudflare Pages Workers do not share memory across isolates, so this is a
// soft brake (stops naive loops from a single hot isolate), not a global
// quota. Pair with Cloudflare WAF rate rules on /api/* for real protection.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterSec: number };

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Bucket key for a request. With an IP, key on it. Without one (a proxy
// stripped the headers), differentiate by cheap client hints so real visitors
// don't all share a single "unknown" bucket, while one naive loop from the
// same client still trips the limit.
export function rateLimitKey(req: Request, scope: string): string {
  const ip = clientIp(req);
  if (ip !== "unknown") return `${scope}:${ip}`;
  const ua = req.headers.get("user-agent") || "";
  const lang = req.headers.get("accept-language") || "";
  return `${scope}:ua:${ua.slice(0, 64)}:${lang.slice(0, 16)}`;
}

export function rateLimit(
  key: string,
  {
    limit,
    windowMs,
    now = Date.now(),
  }: { limit: number; windowMs: number; now?: number },
): RateLimitResult {
  const existing = buckets.get(key);

  // Opportunistic cleanup so the map does not grow forever in long-lived isolates.
  if (buckets.size > 2000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, remaining: 0, resetAt: existing.resetAt, retryAfterSec };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSec) }),
  };
}
