// GET /api/one-question?session_id=cs_...[&start=1]
//
// The buyer's success page asks this for the reading it should show. The webhook
// normally writes it seconds after payment; `start=1` is the fallback the page uses
// if nothing has appeared, so a missed webhook still delivers the product.

import { NextRequest, NextResponse } from "next/server";

import { birthdateFromCheckoutSession } from "@/lib/birthdate";
import { isOneQuestionSession, questionFromCheckoutSession } from "@/lib/deep-dive";
import { deliverReading } from "@/lib/reading-fulfill";
import { getStoredReading } from "@/lib/reading-service";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "bad session" }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "unknown session" }, { status: 404 });
  }
  const paid =
    session.payment_status === "paid" ||
    (session.payment_status === "no_payment_required" &&
      session.amount_total === 0);
  if (!paid || !isOneQuestionSession(session)) {
    return NextResponse.json({ error: "not a paid reading" }, { status: 403 });
  }

  try {
    const stored = req.nextUrl.searchParams.get("start") === "1"
      ? await deliverReading({
          sessionId, sessionCreated: session.created, birthday: birthdateFromCheckoutSession(session),
          question: questionFromCheckoutSession(session),
          email: session.customer_details?.email ?? session.customer_email ?? "",
        })
      : await getStoredReading(sessionId);
    return NextResponse.json({
      status: stored?.status ?? "pending",
      ...(stored?.status === "ready" ? { text: stored.text, words: stored.words, question: stored.question } : {}),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ status: "failed" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
