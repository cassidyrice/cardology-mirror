import { NextRequest, NextResponse } from "next/server";

import {
  BLUEPRINT_REPORT_FALLBACK_NAME,
  BLUEPRINT_REPORT_SLUG,
} from "@/lib/blueprint-report";
import { verifyReportToken } from "@/lib/report-token";
import { getStripe } from "@/lib/stripe";
import { buildProfessionalReading } from "@/scripts/professional-reading/builder";
import { renderReport } from "@/scripts/professional-reading/render";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /report?token=…
// Serves the 22-page Blueprint Report for a valid signed report token. The
// document is fully computed by the engine (no model, no external service);
// the reading date is pinned to the purchase so the same link always yields
// the same document. Print-to-PDF is handled by the renderer's @page rules.
export async function GET(req: NextRequest) {
  const payload = await verifyReportToken(req.nextUrl.searchParams.get("token"));
  if (!payload || payload.slug !== BLUEPRINT_REPORT_SLUG) {
    return NextResponse.redirect(new URL("/blueprint", req.url), 303);
  }

  // Cover name and purchase date come from the Stripe session the token names.
  // Both fall back safely: the report never fails to render over a lookup.
  let name = BLUEPRINT_REPORT_FALLBACK_NAME;
  let readingDate = new Date().toISOString().slice(0, 10);
  try {
    const session = await getStripe().checkout.sessions.retrieve(payload.sessionId);
    const candidate = (session.metadata?.cover_name || session.customer_details?.name || "").trim();
    if (candidate && candidate.length <= 60 && !candidate.includes("@")) name = candidate;
    if (session.created) readingDate = new Date(session.created * 1000).toISOString().slice(0, 10);
  } catch (e) {
    console.error("[report] stripe session lookup failed; using fallbacks", e);
  }

  let html: string;
  try {
    html = renderReport(buildProfessionalReading(name, payload.birthdate, readingDate));
  } catch (e) {
    console.error("[report] render failed", e);
    return new NextResponse("This report could not be generated. Reply to your receipt email and we will fix it.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}
