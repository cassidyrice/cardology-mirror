import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCode, mintToken } from "@/lib/gate";
import {
  clientIp,
  rateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Soft per-IP brake. Cloudflare WAF should own the hard global quota.
const GATE_LIMIT = 10;
const GATE_WINDOW_MS = 10 * 60 * 1000;

// POST {email, code} -> {token} on success. Unlocks the AI deep-dive features.
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limited = rateLimit(`gate:${ip}`, {
    limit: GATE_LIMIT,
    windowMs: GATE_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429, headers: rateLimitHeaders(limited, GATE_LIMIT) },
    );
  }

  let body: { email?: string; code?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  const email = (body.email ?? "").trim();
  const code = (body.code ?? "").trim();

  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email." },
      { status: 400, headers: rateLimitHeaders(limited, GATE_LIMIT) },
    );
  }
  if (!code) {
    return NextResponse.json(
      { error: "Enter your access code." },
      { status: 400, headers: rateLimitHeaders(limited, GATE_LIMIT) },
    );
  }
  if (!process.env.GATE_SECRET && !process.env.CARDOLOGY_GATE_SECRET) {
    return NextResponse.json(
      { error: "Access isn't configured yet. Check back soon." },
      { status: 503, headers: rateLimitHeaders(limited, GATE_LIMIT) },
    );
  }
  if (!isValidAccessCode(code)) {
    // Constant-ish slowdown on failure to blunt online guessing.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { error: "That code didn't work." },
      { status: 403, headers: rateLimitHeaders(limited, GATE_LIMIT) },
    );
  }

  const token = await mintToken(email);
  return NextResponse.json(
    { token, email: email.toLowerCase() },
    { headers: rateLimitHeaders(limited, GATE_LIMIT) },
  );
}
