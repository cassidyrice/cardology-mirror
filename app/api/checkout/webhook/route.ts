import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { sendIntakeEmail } from "@/lib/email";
import { mintToken } from "@/lib/gate";
import { READER_PHONE_DISPLAY } from "@/lib/offers";
import { offerBySlug } from "@/lib/products";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Fallback access window when the offer can't be resolved from metadata.
const DEFAULT_ACCESS_DAYS = 30;

// Checkout sessions minted before the repricing can still complete (sessions
// live 24h; Stripe retries webhooks ~3 days). Honor what those buyers were
// sold instead of the generic fallback.
const LEGACY_ACCESS_DAYS: Record<string, number> = {
  "one-question-reading": 90,
  "full-deep-dive": 90,
  "basic-birth-card-report": 30,
};

// POST /api/checkout/webhook
// Stripe webhook receiver. Verifies the signature (Web Crypto, edge-safe),
// mints a gate token for the site's reading tools, emails the buyer how to
// start their voice session, and notifies Cass so there is a record
// independent of whether the buyer ever calls.
//
// Access windows come from the canonical offer definition in lib/products.ts
// (quick-question 30d, complete-reading 30d, season-pass-90 90d) — metadata is
// informational; entitlement is always re-derived server-side.
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
    const phone = session.customer_details?.phone ?? "(no phone)";
    const offerSlug = session.metadata?.offer_slug ?? "";
    const offer = offerBySlug(offerSlug);
    const offerName = offer?.name ?? session.metadata?.offer_name ?? offerSlug ?? "(unknown offer)";
    const accessDays =
      offer?.accessDays ?? LEGACY_ACCESS_DAYS[offerSlug] ?? DEFAULT_ACCESS_DAYS;
    const amount = session.amount_total != null
      ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`
      : "(no amount)";
    const paymentSatisfied =
      session.payment_status === "paid" ||
      (session.payment_status === "no_payment_required" &&
        session.amount_total === 0);

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

    const sessionLine = offer
      ? offer.accessType === "season_pass"
        ? `Your pass covers unlimited personal return calls for ${offer.accessDays} days — up to ${offer.durationMinutes} minutes per session, no automatic renewal.`
        : `Your purchase covers one paid session of up to ${offer.durationMinutes} minutes. Call within ${offer.accessDays} days to begin.`
      : "";

    // Issue the buyer's access token for the site's reading tools and send
    // their start-here email. The token rides in the URL hash so it stays out
    // of server and CDN logs.
    let accessIssued = false;
    if (email !== "(no email)") {
      try {
        const token = await mintToken(email, accessDays);
        const link = `${SITE_URL}/access#token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
        await sendIntakeEmail({
          to: email,
          subject: "Your Card Blueprints reading is ready — here's how to start",
          text: [
            `Thank you — your ${offerName} is confirmed.`,
            "",
            `To begin, call ${READER_PHONE_DISPLAY} from the phone number you used at checkout.`,
            "The AI Cardology reader recognizes that number and starts your reading.",
            ...(sessionLine ? ["", sessionLine] : []),
            "",
            "You can also open the site's reading tools here:",
            link,
            "",
            `The link activates this browser for ${accessDays} days. Open it on the device you want to read on.`,
            "",
            "If anything doesn't work, just reply to this email.",
          ].join("\n"),
        });
        accessIssued = true;
      } catch (e) {
        // Token or email failure must not fail the webhook — Cass's
        // notification below flags it for manual follow-up.
        console.error("[webhook] access email issuance failed", e);
      }
    }

    const to = process.env.INTAKE_EMAIL;
    if (to) {
      try {
        await sendIntakeEmail({
          to,
          subject: `Payment received: ${offerName} — ${email}`,
          text: [
            `Offer: ${offerName} (${offerSlug || "unknown slug"})`,
            `Amount: ${amount}`,
            `Customer email: ${email}`,
            `Customer phone: ${phone}`,
            `Access window: ${accessDays} days`,
            `Stripe session: ${session.id}`,
            `Start-here email sent: ${accessIssued ? "yes" : "NO — send access manually"}`,
            "",
            "The buyer should call the reading line from their checkout number.",
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
