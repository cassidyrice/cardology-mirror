// POST /api/review: stores a buyer review (first name, rating, comment, consent). No email, no photo.
import { NextRequest, NextResponse } from "next/server";

import { REVIEW_DISCOUNT_CODE, validateReview } from "@/lib/review-offer";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type D1 = {
  prepare(sql: string): { bind(...v: unknown[]): { run(): Promise<unknown> }; run(): Promise<unknown> };
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const checked = validateReview(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { firstName, rating, comment, reading, consent } = checked.review;

  try {
    const { getOptionalRequestContext } = await import("@cloudflare/next-on-pages");
    const db = (getOptionalRequestContext()?.env as { READING_ORDERS?: D1 } | undefined)?.READING_ORDERS;
    if (!db) throw new Error("database not configured");
    await db.prepare(
      "CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT NOT NULL, reading TEXT NOT NULL, consent INTEGER NOT NULL, created_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new')",
    ).run();
    await db
      .prepare("INSERT INTO reviews (first_name, rating, comment, reading, consent, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(firstName, rating, comment, reading, consent ? 1 : 0, Date.now())
      .run();
  } catch {
    return NextResponse.json({ error: "That didn't save. Try once more." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, code: REVIEW_DISCOUNT_CODE });
}
