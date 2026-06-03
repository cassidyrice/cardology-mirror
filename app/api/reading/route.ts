import { NextRequest, NextResponse } from "next/server";
import { getReading, EngineError } from "@/lib/engine";

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
    const msg = e instanceof EngineError ? e.message : "internal error";
    const status = e instanceof EngineError && msg.startsWith("invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
