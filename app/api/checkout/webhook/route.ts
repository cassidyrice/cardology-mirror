import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendIntakeEmail } from "@/lib/email";
import { mintToken } from "@/lib/gate";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Access window per offer. The $99 tier is sold as 90 days of access; the
// $199 deep dive should never get less than the cheaper tier.
const TOKEN_TTL_DAYS: Record<string, number> = {
  "one-question-reading": 90,
  "full-deep-dive": 90,
  "basic-birth-card-report": 30,
};

// POST /api/checkout/webhook
// Stripe webhook receiver. Verifies the signature (Web Crypto, edge-safe),
// mints a gate token and emails the buyer their access link, and notifies
// Cass so they have a record independent of whether the buyer ever lands on
// the post-purchase intake form.
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
    const offerName = session.metadata?.offer_name ?? offerSlug ?? "(unknown offer)";
    const amount = session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`
      : "(no amount)";

    // Issue the buyer's access token and send their magic link. The token
    // rides in the URL hash so it stays out of server and CDN logs.
    let accessIssued = false;
    if (email !== "(no email)") {
      try {
        const ttlDays = TOKEN_TTL_DAYS[offerSlug] ?? 30;
        const token = await mintToken(email, ttlDays);
        const link = `${SITE_URL}/access#token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
        await sendIntakeEmail({
          to: email,
          subject: "Your Card Blueprints access is ready",
          text: [
            `Thank you — your ${offerName} is confirmed.`,
            "",
            "Open your reading access here:",
            link,
            "",
            `The link activates this browser for ${ttlDays} days. Open it on the device you want to read on.`,
            "",
            "If anything doesn't work, just reply to this email.",
          ].join("\n"),
        });
        accessIssued = true;
      } catch (e) {
        // Token or email failure must not fail the webhook — Cass's
        // notification below flags it for manual follow-up.
        console.error("[webhook] access link issuance failed", e);
      }
    }

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
            `Access link emailed: ${accessIssued ? "yes" : "NO — send access manually"}`,
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
