import { NextRequest, NextResponse } from "next/server";

import { verifyReportToken } from "@/lib/report-token";
import {
  buildTimingMapModel,
  TIMING_MAP_SLUG,
  TimingMapJokerError,
} from "@/lib/timing-map/model";
import {
  renderTimingMapJokerSvg,
  renderTimingMapSvg,
} from "@/lib/timing-map/render";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /api/timing-map?token=…
// The Yearly Timing Map was a bonus of the retired video offer (Sep 2026);
// this route stays so those buyers' map links keep working. Drawn on request
// from the buyer's birthday (carried in the signed report token), so nothing
// is stored and the NOW marker is always today. Same token family and gate as
// /blueprint. The $13 One Question Reading does not link here.
export async function GET(req: NextRequest) {
  const payload = await verifyReportToken(req.nextUrl.searchParams.get("token"));
  if (!payload || payload.slug !== TIMING_MAP_SLUG) {
    return NextResponse.json(
      { error: "This map link is invalid or expired. Reply to your receipt email and we will resend it." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let svg: string;
  try {
    svg = renderTimingMapSvg(buildTimingMapModel(payload.birthdate));
  } catch (e) {
    if (e instanceof TimingMapJokerError) {
      svg = renderTimingMapJokerSvg(payload.birthdate);
    } else {
      console.error("[timing-map] render failed", e);
      return NextResponse.json(
        { error: "The map could not be drawn from the birthday on this order. Reply to your receipt email with your birth date (YYYY-MM-DD)." },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const fileName = `Yearly-Timing-Map-${payload.birthdate}.svg`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
