import { NextRequest, NextResponse } from "next/server";

import { sanitizeBirthdateISO } from "@/lib/birthdate";
import { isJokerBirthdate } from "@/lib/deep-dive";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { buildYearBlueprint } from "@/lib/year-blueprint";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

// POST /api/year-preview  { birthdate: "YYYY-MM-DD" }
// Free preview for the 52xSeven Blueprint sales page. The birthday travels in
// the request body only (never a URL — middleware strips it) and is not stored
// or logged. Returns the same year model the purchased app renders.
export async function POST(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, "year-preview"), {
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  let birthdate = "";
  try {
    const body = (await req.json()) as { birthdate?: unknown };
    birthdate = sanitizeBirthdateISO(body.birthdate);
  } catch {
    birthdate = "";
  }
  if (!birthdate) {
    return NextResponse.json({ error: "need-date" }, { status: 400 });
  }
  if (isJokerBirthdate(birthdate)) {
    return NextResponse.json({ error: "joker" }, { status: 422 });
  }
  try {
    const year = await buildYearBlueprint(birthdate);
    return NextResponse.json(year, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "engine" }, { status: 422 });
  }
}
