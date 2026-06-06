import { NextRequest, NextResponse } from "next/server";
import { runCardologyCliJson } from "@/lib/server/cardology-cli";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/daily-card?birthdate=YYYY-MM-DD&date=YYYY-MM-DD
// Uses the Cardology CLI as the source of truth for the daily card feature.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const birthdate = sp.get("birthdate")?.trim();
  const date = sp.get("date")?.trim();

  if (!birthdate) {
    return NextResponse.json({ error: "missing birthdate" }, { status: 400 });
  }

  const args = ["daily-card", "--birthdate", birthdate, "--json"];
  if (date) args.push("--target-date", date);

  try {
    const daily = await runCardologyCliJson(args);
    return NextResponse.json(daily);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "daily card CLI failed";
    const status = msg.startsWith("invalid") || msg.includes("birthdate") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
