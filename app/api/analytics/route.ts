import { NextRequest, NextResponse } from "next/server";

import {
  isClientFunnelEventName,
  sanitizeAnalyticsId,
  sanitizeAnalyticsLabel,
  sanitizeAnalyticsPath,
  sanitizeEventId,
  sanitizeHostname,
  sanitizeOfferSlug,
  sanitizeTrafficChannel,
} from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const origin = req.headers.get("origin");
  const allowedOrigins = new Set([req.nextUrl.origin, new URL(SITE_URL).origin]);
  const requestHost = req.headers.get("host");
  const fetchSite = req.headers.get("sec-fetch-site");
  let sameRequestHost = false;
  try {
    sameRequestHost = Boolean(
      origin && requestHost && new URL(origin).host === requestHost,
    );
  } catch {
    sameRequestHost = false;
  }
  if (
    !origin ||
    (fetchSite && fetchSite !== "same-origin") ||
    (!allowedOrigins.has(origin) && !sameRequestHost)
  ) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const body = parsed as Record<string, unknown>;

  if (!isClientFunnelEventName(body.eventName)) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }

  const sessionId = sanitizeAnalyticsId(body.sessionId);
  const eventId = sanitizeEventId(body.eventId);
  if (!sessionId || !eventId) {
    return NextResponse.json({ error: "invalid identifiers" }, { status: 400 });
  }

  recordFunnelEvent({
    name: body.eventName,
    source: "browser",
    sessionId,
    eventId,
    path: sanitizeAnalyticsPath(body.path),
    landingPath: sanitizeAnalyticsPath(body.landingPath),
    referrerHost: sanitizeHostname(body.referrerHost),
    trafficChannel: sanitizeTrafficChannel(body.trafficChannel),
    utmSource: sanitizeAnalyticsLabel(body.utmSource),
    utmMedium: sanitizeAnalyticsLabel(body.utmMedium),
    utmCampaign: sanitizeAnalyticsLabel(body.utmCampaign),
    offerSlug: sanitizeOfferSlug(body.offerSlug),
    placement: sanitizeAnalyticsLabel(body.placement),
    outcome: sanitizeAnalyticsLabel(body.outcome),
  });

  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
