import { NextRequest, NextResponse } from "next/server";
import { getReading, engineErrorResponse } from "@/lib/engine";

export const runtime = "edge";
export const dynamic = "force-dynamic";

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
