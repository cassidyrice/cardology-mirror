import { NextRequest, NextResponse } from "next/server";

import { normalizeChartSignup, subscribeChartLead } from "@/lib/chart-signup";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { readJsonObject } from "@/lib/request-body";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /api/chart-signup { email, source, slug } — saves the birthdate-chart lead
// to Buttondown. The chart itself is drawn in the browser; this never sees a birthday.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Please sign up from our site." }, { status: 403 });
  }
  if (!rateLimit(rateLimitKey(request, "chart-signup"), { limit: 8, windowMs: 600_000 }).ok) {
    return NextResponse.json({ error: "Please wait a few minutes, then retry." }, { status: 429 });
  }
  const raw = await readJsonObject(request);
  if (!raw || (typeof raw.company === "string" && raw.company.trim())) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  let signup;
  try {
    signup = normalizeChartSignup(raw);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Invalid request" },
      { status: 400 },
    );
  }
  try {
    await subscribeChartLead(
      signup,
      process.env.BUTTONDOWN_API_KEY || "",
      request.headers.get("referer") || request.nextUrl.origin,
      fetch,
      request.headers.get("cf-connecting-ip") || "",
    );
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    console.error("[chart-signup] save failed", cause);
    const message = cause instanceof Error ? cause.message : "";
    const reason = message.includes("not set")
      ? "config"
      : message.includes("subscriber_blocked")
        ? "blocked"
        : "upstream";
    return NextResponse.json({ error: "save_failed", reason }, { status: 502 });
  }
}
