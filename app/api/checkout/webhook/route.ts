import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendIntakeEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /api/checkout/webhook
// Stripe webhook receiver. Verifies the signature (Web Crypto, edge-safe),
// notifies Cass on successful checkout so they have a record independent of
// whether the buyer ever lands on the post-purchase intake form.
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
    const offerName = session.metadata?.offer_name ?? session.metadata?.offer_slug ?? "(unknown offer)";
    const amount = session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`
      : "(no amount)";

    const to = process.env.INTAKE_EMAIL;
    if (to) {
      try {
        await sendIntakeEmail({
          to,
          subject: `Payment received: ${offerName} — ${email}`,
          text: [
            `Offer: ${offerName}`,
            `Amount: ${amount}`,
            `Customer email: ${email}`,
            `Stripe session: ${session.id}`,
            "",
            "The buyer should land on /checkout/success and submit intake.",
            "If you have not received an intake form yet, reach out to them.",
          ].join("\n"),
          replyTo: email !== "(no email)" ? email : undefined,
        });
      } catch (e) {
        console.error("[webhook] payment notification email failed", e);
        // Still 200 — Stripe doesn't need to retry for our email failure.
      }
    }
  }

  return NextResponse.json({ received: true });
}
