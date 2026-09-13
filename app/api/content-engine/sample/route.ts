import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "product_retired", message: "The Content Calendar experiment is no longer available." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
