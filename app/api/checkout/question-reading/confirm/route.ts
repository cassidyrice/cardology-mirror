import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import {
  QUESTION_SLA_PROSE,
  fulfillPaidQuestionOrder,
  getQuestionOrderBySessionId,
} from "@/lib/question-reading-service";
import { readJsonObject } from "@/lib/request-body";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/question-reading/confirm
 * Called immediately by Embedded Checkout's client-side `onComplete()` callback so
 * D1 fulfillment + 3-angle AI drafting starts right away without waiting on webhook latency,
 * and returns in-place confirmation details so the buyer never leaves the page.
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
    offerSlug: session.metadata?.offer_slug ?? "",
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
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
