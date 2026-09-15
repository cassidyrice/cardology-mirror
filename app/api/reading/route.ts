import { NextRequest, NextResponse } from "next/server";
import { getReading, engineErrorResponse } from "@/lib/engine";

export const runtime = "edge";
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
    return NextResponse.json(reading);
  } catch (e) {
    const { status, body } = engineErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

// POST /api/reading  { birthdate: "YYYY-MM-DD", date?: "YYYY-MM-DD" }
// Same engine, same response — the birthday travels in the body, never the URL,
// so it stays out of logs, referrers, and analytics.
export async function POST(req: NextRequest) {
  let body: { birthdate?: unknown; date?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const birthdate = typeof body.birthdate === "string" ? body.birthdate : "";
  const date = typeof body.date === "string" ? body.date : undefined;
  try {
    const reading = await getReading(birthdate, date);
    return NextResponse.json(reading);
  } catch (e) {
    const { status, body: errorBody } = engineErrorResponse(e);
    return NextResponse.json(errorBody, { status });
  }
}
