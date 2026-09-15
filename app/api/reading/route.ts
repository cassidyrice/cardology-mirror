import { NextRequest, NextResponse } from "next/server";
import { getReading, engineErrorResponse } from "@/lib/engine";

export const runtime = "edge";

// The engine is public and read-only, and no cookie or credential is involved,
// so any origin may call it: the glasses webview and the Even Hub simulator are
// not served from cardblueprints.com and would otherwise be blocked by CORS.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
export const dynamic = "force-dynamic";

// Middleware strips `birthdate` from every URL (it is a sensitive query key),
// so the GET form only works for callers that keep the date out of the query —
// clients with a real birthdate should POST it in the body instead.

// GET /api/reading?birthdate=YYYY-MM-DD&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const birthdate = sp.get("birthdate") ?? "";
  const date = sp.get("date") ?? undefined;
  try {
    const reading = await getReading(birthdate, date);
    return NextResponse.json(reading, { headers: CORS });
  } catch (e) {
    const { status, body } = engineErrorResponse(e);
    return NextResponse.json(body, { status, headers: CORS });
  }
}

// POST /api/reading  { birthdate: "YYYY-MM-DD", date?: "YYYY-MM-DD" }
// Same engine, same response — the birthday travels in the body, never the URL,
// so it stays out of logs, referrers, and analytics.
export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: CORS });
  }
  // `null`, a bare string and an array all parse cleanly, so the catch above
  // does not cover them; body.birthdate on a null body is a TypeError, which
  // would surface as an uncaught 500 with no CORS headers.
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: CORS });
  }
  const body = parsed as { birthdate?: unknown; date?: unknown };
  const birthdate = typeof body.birthdate === "string" ? body.birthdate : "";
  const date = typeof body.date === "string" ? body.date : undefined;
  try {
    const reading = await getReading(birthdate, date);
    return NextResponse.json(reading, { headers: CORS });
  } catch (e) {
    const { status, body: errorBody } = engineErrorResponse(e);
    return NextResponse.json(errorBody, { status, headers: CORS });
  }
}
