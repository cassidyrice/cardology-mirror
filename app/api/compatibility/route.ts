import { NextResponse } from "next/server";

import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  buildLifePathProfile,
  compareLifePathProfiles,
  type LifePathCard,
} from "@/lib/life-path";
import { JokerNotSupportedError } from "@/lib/reading";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Public, read-only, no credential — same justification as /api/reading. The
// glasses webview and the Even simulator are off-origin callers.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

// engineErrorResponse shapes one {error, code} with no room to say WHICH date
// failed, and a pair has two Joker positions — so this route reuses the typed
// error's message and code and adds `side` itself.
const JOKER = new JokerNotSupportedError();

const seat = (card: LifePathCard | null) =>
  card
    ? {
        position: card.shortTitle,
        card: card.card,
        label: card.label,
        reading: card.relationship,
      }
    : null;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// POST /api/compatibility  { a: "YYYY-MM-DD", b: "YYYY-MM-DD" }
// Both birthdays travel in the body, never the URL: middleware 301s away
// sensitive query keys, and a 301 makes the client drop the body anyway.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: CORS });
  }
  // `null`, a bare string and an array all parse cleanly, so the catch above
  // does not cover them; without this they reach `body.a` as a TypeError, which
  // is an uncaught 500 with no CORS headers on it.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: CORS });
  }
  const fields = body as { a?: unknown; b?: unknown };

  const a = sanitizeBirthdateISO(fields.a);
  const b = sanitizeBirthdateISO(fields.b);
  if (!a || !b) {
    return NextResponse.json(
      { error: "invalid birthdate", side: a ? "b" : "a" },
      { status: 400, headers: CORS },
    );
  }

  // sanitizeBirthdateISO already proved both are real calendar dates, so a null
  // profile here can only mean December 31 — the Joker has no Life Path board.
  const profileA = buildLifePathProfile(a, "A");
  const profileB = buildLifePathProfile(b, "B");
  if (!profileA || !profileB) {
    return NextResponse.json(
      { error: JOKER.message, code: JOKER.code, side: profileA ? "b" : "a" },
      { status: 422, headers: CORS },
    );
  }

  const { aSeesB, bSeesA, sharedCards } = compareLifePathProfiles(profileA, profileB);
  return NextResponse.json(
    {
      a: { card: profileA.birthCard, label: profileA.birthCardLabel },
      b: { card: profileB.birthCard, label: profileB.birthCardLabel },
      // One-way on purpose: landing on someone's board is not symmetric, and
      // merging the two directions would state a connection that isn't there.
      aSeesB: seat(aSeesB),
      bSeesA: seat(bSeesA),
      shared: sharedCards.map((s) => ({
        card: s.card,
        label: s.label,
        aPosition: s.aRoles.map((r) => r.shortTitle).join("/"),
        bPosition: s.bRoles.map((r) => r.shortTitle).join("/"),
      })),
    },
    { headers: CORS },
  );
}
