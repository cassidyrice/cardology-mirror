import { NextResponse } from "next/server";

import { sanitizeBirthdateISO } from "@/lib/birthdate";
import { CARD_APP_SLUG } from "@/lib/card-app";
import { buildConnection } from "@/lib/card-app-connection";
import { JokerNotSupportedError } from "@/lib/reading";
import { verifyReportToken } from "@/lib/report-token";
import { readJsonObject } from "@/lib/request-body";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /api/card-app/connection  { token, birthdate: "YYYY-MM-DD", name? }
// Buyers only: the owner's birthdate comes from the signed token, never the
// body. The other person's birthday travels in the body, never the URL.
export async function POST(req: Request) {
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });

  const payload = await verifyReportToken(typeof body.token === "string" ? body.token : "");
  if (!payload || payload.slug !== CARD_APP_SLUG) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const birthdate = sanitizeBirthdateISO(body.birthdate);
  if (!birthdate) return NextResponse.json({ error: "invalid birthdate" }, { status: 400 });
  const name = typeof body.name === "string" ? body.name.slice(0, 40) : "";

  try {
    return NextResponse.json(buildConnection(payload.birthdate, birthdate, name), {
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    if (e instanceof JokerNotSupportedError) {
      return NextResponse.json(
        { error: "December 31 has no card board yet, so it can't be compared.", code: e.code },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "could not compare these birthdays" }, { status: 422 });
  }
}
