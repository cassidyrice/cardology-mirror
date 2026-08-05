import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { sendIntakeEmail } from "@/lib/email";
import { offerBySlug } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /api/checkout/webhook
// Stripe webhook receiver. Verifies the signature (Web Crypto, edge-safe),
// emails the buyer their delivery expectations, and emails Cass the
// fulfillment details — the birth date and focus question from checkout —
// so the personal video can be made. That owner email is the production
// queue: every paid session must land there even if the buyer email fails.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email ?? "(no email)";
    const offerSlug = session.metadata?.offer_slug ?? "";
    const offer = offerBySlug(offerSlug);
    const offerName = offer?.name ?? session.metadata?.offer_name ?? offerSlug ?? "(unknown offer)";
    const deliveryHours = offer?.deliveryHours ?? 48;
    const amount = session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`
      : "(no amount)";
    const paymentSatisfied =
      session.payment_status === "paid" ||
      (session.payment_status === "no_payment_required" &&
        session.amount_total === 0);

    // The video's raw material, collected as Stripe custom fields.
    const customField = (key: string) =>
      session.custom_fields?.find((f) => f.key === key)?.text?.value?.trim() ?? "";
    const birthDate = customField("birth_date") || "(not provided)";
    const focusQuestion = customField("focus_question") || "(none)";

    // This webhook can receive account-level Stripe events. Only canonical
    // Card Blueprints offers belong in this site's conversion funnel.
    if (paymentSatisfied && offer) {
      recordFunnelEvent({
        name: "purchase_completed",
        source: "server",
        ...funnelContextFromMetadata(session.metadata),
        eventId: `stripe:${event.id}`,
        path: "/api/checkout/webhook",
        offerSlug,
        outcome: "payment-confirmed",
        currency: session.currency ?? "usd",
        valueCents: session.amount_total ?? 0,
      });
    }

    // Tell the buyer what to expect. Delivery expectations come from the
    // canonical offer in lib/products.ts, not from session metadata.
    let buyerEmailed = false;
    if (email !== "(no email)") {
      try {
        await sendIntakeEmail({
          to: email,
          subject: "Your Card Blueprints video reading is being made",
          text: [
            `Thank you — your ${offerName} is confirmed.`,
            "",
            "Your video is being made personally for you from the birth date you entered at checkout.",
            "",
            `A private video link will arrive at this email within ${deliveryHours} hours. There is nothing to schedule and nothing to call — the reading comes to you.`,
            "",
            "If that window passes and no video has arrived, check spam and promotions, then reply to this email and we'll make it right.",
          ].join("\n"),
        });
        buyerEmailed = true;
      } catch (e) {
        // Buyer-email failure must not fail the webhook — Cass's notification
        // below flags it for manual follow-up.
        console.error("[webhook] buyer confirmation email failed", e);
      }
    }

    const to = process.env.INTAKE_EMAIL;
    if (to) {
      try {
        await sendIntakeEmail({
          to,
          subject: `Video reading to make: ${offerName} — ${email}`,
          text: [
            `Offer: ${offerName} (${offerSlug || "unknown slug"})`,
            `Amount: ${amount}`,
            `Customer email: ${email}`,
            "",
            `Birth date for the reading: ${birthDate}`,
            `Focus question: ${focusQuestion}`,
            "",
            `Delivery promised: private video link by email within ${deliveryHours} hours of purchase`,
            `Stripe session: ${session.id}`,
            `Buyer confirmation email sent: ${buyerEmailed ? "yes" : "NO — email the buyer manually"}`,
          ].join("\n"),
          replyTo: email !== "(no email)" ? email : undefined,
        });
      } catch (e) {
        console.error("[webhook] fulfillment notification email failed", e);
        // Still 200 — Stripe doesn't need to retry for our email failure.
      }
    }
  }

  return NextResponse.json({ received: true });
}
