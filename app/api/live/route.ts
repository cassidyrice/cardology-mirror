import { NextRequest, NextResponse } from "next/server";

import { fetchAnalytics, fetchStripe, LIVE_TIMEZONE, type LivePayload } from "@/lib/live-metrics";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Private JSON feed for /ops/live. Auth is a shared token (LIVE_DASH_TOKEN) passed as
 * ?t= or x-live-token. Reads Analytics Engine with CF_ANALYTICS_TOKEN (Account Analytics:
 * Read) and Stripe with the existing secret key. Nothing here is cached by the CDN.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.LIVE_DASH_TOKEN;
  const given = req.nextUrl.searchParams.get("t") ?? req.headers.get("x-live-token") ?? "";
  if (!expected || given.length < 16 || given !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const cfToken = process.env.CF_ANALYTICS_TOKEN;
  if (!cfToken) {
    return NextResponse.json({ error: "CF_ANALYTICS_TOKEN is not set" }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const now = new Date();
  try {
    const [analytics, stripe] = await Promise.all([
      fetchAnalytics(cfToken, now),
      process.env.STRIPE_SECRET_KEY
        ? fetchStripe(getStripe(), now)
        : Promise.resolve<LivePayload["stripe"]>({
            ok: false,
            error: "STRIPE_SECRET_KEY is not set",
            deepDive: { today: zero(), last7d: zero() },
            reading: { today: zero(), last7d: zero(), paidTotal: 0 },
          }),
    ]);
    const payload: LivePayload = { generatedAt: now.toISOString(), timezone: LIVE_TIMEZONE, ...analytics, stripe };
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "live metrics failed" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

function zero() {
  return { complete: 0, open: 0, expired: 0, revenueCents: 0 };
}
