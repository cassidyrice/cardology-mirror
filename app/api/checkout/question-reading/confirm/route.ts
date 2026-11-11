import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import {
  QUESTION_SLA_PROSE,
  SUGGESTED_QUESTIONS_PDF_PATH,
  fulfillPaidQuestionOrder,
  getQuestionOrderBySessionId,
  getReadingPassState,
  signReadingPassToken,
} from "@/lib/question-reading-service";
import { readJsonObject } from "@/lib/request-body";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/question-reading/confirm
 * Called immediately by Embedded Checkout's client-side `onComplete()` callback so
 * D1 fulfillment + Reading Pass token minting (+ 3-angle AI drafting when Q1 was entered)
 * starts right away without waiting on webhook latency, returning the Suggested Questions PDF
 * download URL and 48-hour 3-question Reading Pass state inline without leaving the page.
 */
export async function POST(req: NextRequest) {
  const body = await readJsonObject(req);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
  }

  const paid =
    session.payment_status === "paid" ||
    (session.payment_status === "no_payment_required" && session.amount_total === 0);

  if (!paid) {
    return NextResponse.json(
      { status: "processing", message: "Payment is still confirming." },
      { status: 202, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const orderIdFromMeta = session.metadata?.question_order_id ?? "";
  const existingRow = orderIdFromMeta
    ? { id: orderIdFromMeta }
    : await getQuestionOrderBySessionId(session.id);

  if (!existingRow) {
    return NextResponse.json({ error: "Matching reading order not found." }, { status: 404 });
  }

  const stripeEmail = session.customer_details?.email ?? session.customer_email ?? "";

  recordFunnelEvent({
    name: "purchase_completed",
    source: "server",
    ...funnelContextFromMetadata(session.metadata),
    eventId: `stripe:${session.id}`,
    path: "/api/checkout/question-reading/confirm",
    offerSlug: session.metadata?.offer_slug ?? "card-blueprint-reading",
    placement: session.metadata?.placement ?? "inline-drawer",
    outcome: "embedded-confirmed",
    currency: session.currency ?? "usd",
    valueCents: session.amount_total ?? 0,
  });

  const hydrated = await fulfillPaidQuestionOrder({
    orderId: existingRow.id,
    stripeSessionId: session.id,
    stripeBuyerEmail: stripeEmail,
  });

  const passToken = await signReadingPassToken(hydrated.id);
  const passState = await getReadingPassState(hydrated.id);

  return NextResponse.json(
    {
      ok: true,
      orderId: hydrated.id,
      track: hydrated.track,
      trackTitle: hydrated.trackTitle,
      deliveryChannel: hydrated.deliveryChannel,
      destination:
        hydrated.deliveryChannel === "sms"
          ? hydrated.buyerPhone
          : hydrated.buyerEmail || stripeEmail,
      turnaround: QUESTION_SLA_PROSE,
      status: hydrated.status,
      passToken,
      passUrl: passState.passUrl,
      suggestedQuestionsUrl: SUGGESTED_QUESTIONS_PDF_PATH,
      accessExpiresAt: passState.accessExpiresAt,
      windowHours: passState.windowHours,
      maxQuestions: passState.maxQuestions,
      questionsUsed: passState.questionsUsed,
      questionsRemaining: passState.questionsRemaining,
      canSubmitQuestion: passState.canSubmitQuestion,
      questions: passState.questions,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
