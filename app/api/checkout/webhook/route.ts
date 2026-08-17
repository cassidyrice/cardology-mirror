import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { birthdateFromCheckoutSession } from "@/lib/birthdate";
import { sendIntakeEmail } from "@/lib/email";
import { READER_PHONE_DISPLAY } from "@/lib/offers";
import {
  productBySlug,
  isVoiceReading,
  isDigitalDownload,
  isInstantReport,
} from "@/lib/products";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { mintToken } from "@/lib/gate";
import { mintDownloadToken } from "@/lib/download-token";
import { mintReportToken } from "@/lib/report-token";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_ACCESS_DAYS = 30;

const LEGACY_ACCESS_DAYS: Record<string, number> = {
  "one-question-reading": 90,
  "full-deep-dive": 90,
  "basic-birth-card-report": 30,
};

// POST /api/checkout/webhook
// Stripe webhook receiver. Verifies the signature (Web Crypto, edge-safe).
// Voice products: mints gate token + emails call instructions.
// Digital products: mints download token + emails secure link.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "webhook not configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      raw,
      signature,
      secret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_details?.email ??
      session.customer_email ??
      "(no email)";
    const phone = session.customer_details?.phone ?? "(no phone)";
    const offerSlug = session.metadata?.offer_slug ?? "";
    const product = productBySlug(offerSlug);
    const offerName =
      product?.name ??
      session.metadata?.offer_name ??
      offerSlug ??
      "(unknown offer)";

    const amount =
      session.amount_total != null
        ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}`
        : "(no amount)";
    const paymentSatisfied =
      session.payment_status === "paid" ||
      (session.payment_status === "no_payment_required" &&
        session.amount_total === 0);

    // Funnel event for canonical offers
    if (paymentSatisfied && product) {
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

    // ---- BRANCH: digital download ----
    if (product && isDigitalDownload(product)) {
      let downloadIssued = false;
      if (email !== "(no email)") {
        try {
          const token = await mintDownloadToken(
            email,
            product.slug,
            product.redownloadDays,
          );
          const downloadUrl = `${SITE_URL}/checkout/success?session_id=${session.id}`;

          await sendIntakeEmail({
            to: email,
            subject: `Your copy of "${product.name}" is ready`,
            text: [
              `Thank you — your purchase of ${product.name} is confirmed.`,
              "",
              `Your secure download link is on the confirmation page:`,
              downloadUrl,
              "",
              `Your download window: ${product.redownloadDays} days.`,
              `Save the PDF somewhere safe after downloading.`,
              "",
              `Explore your personalized report: ${SITE_URL}/products/personal-card-blueprint`,
              "",
              "If anything doesn't work, just reply to this email.",
            ].join("\n"),
          });
          downloadIssued = true;
        } catch (e) {
          console.error(
            "[webhook] digital download email issuance failed",
            e,
          );
        }
      }

      // Notify founder
      const to = process.env.INTAKE_EMAIL;
      if (to) {
        try {
          await sendIntakeEmail({
            to,
            subject: `Payment received (digital): ${offerName} — ${email}`,
            text: [
              `Offer: ${offerName} (${offerSlug || "unknown slug"})`,
              `Type: digital download`,
              `Amount: ${amount}`,
              `Customer email: ${email}`,
              `Download email sent: ${downloadIssued ? "yes" : "NO — send manually"}`,
              `Stripe session: ${session.id}`,
              "",
              "Buyer receives a time-limited download link on the success page.",
            ].join("\n"),
            replyTo: email !== "(no email)" ? email : undefined,
          });
        } catch (e) {
          console.error(
            "[webhook] payment notification email failed",
            e,
          );
        }
      }

      return NextResponse.json({ received: true });
    }

    // ---- BRANCH: instant report (Personal Card Blueprint) ----
    if (product && isInstantReport(product)) {
      // The buyer's birth date arrives from our review-page date picker
      // (session metadata) or, for older sessions, the Stripe text field.
      const birthdate = birthdateFromCheckoutSession(session);
      let reportIssued = false;
      if (email !== "(no email)" && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
        try {
          const token = await mintReportToken(
            email,
            product.slug,
            session.id,
            birthdate,
          );
          const reportUrl = `${SITE_URL}/blueprint?token=${encodeURIComponent(token)}`;
          await sendIntakeEmail({
            to: email,
            subject: `Your Personal Card Blueprint is ready`,
            text: [
              `Thank you — your ${product.name} is confirmed.`,
              "",
              "Your personalized report is ready right now:",
              reportUrl,
              "",
              "Keep this link — it re-opens your report anytime.",
              "",
              "If anything doesn't work, just reply to this email.",
            ].join("\n"),
          });
          reportIssued = true;
        } catch (e) {
          console.error("[webhook] report email issuance failed", e);
        }
      } else {
        console.error("[webhook] instant report missing/invalid birthdate", {
          hasEmail: email !== "(no email)",
          birthdateValid: /^\d{4}-\d{2}-\d{2}$/.test(birthdate),
        });
      }

      const to = process.env.INTAKE_EMAIL;
      if (to) {
        try {
          await sendIntakeEmail({
            to,
            subject: `Payment received (report): ${offerName} — ${email}`,
            text: [
              `Offer: ${offerName} (${offerSlug || "unknown slug"})`,
              `Type: instant report`,
              `Amount: ${amount}`,
              `Customer email: ${email}`,
              `Birthdate supplied: ${/^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? "yes" : "NO"}`,
              `Report email sent: ${reportIssued ? "yes" : "NO — send manually"}`,
              `Stripe session: ${session.id}`,
            ].join("\n"),
            replyTo: email !== "(no email)" ? email : undefined,
          });
        } catch (e) {
          console.error("[webhook] report notification email failed", e);
        }
      }
      return NextResponse.json({ received: true });
    }

    // ---- BRANCH: voice reading (existing flow) ----
    const accessDays =
      product && isVoiceReading(product)
        ? product.accessDays
        : LEGACY_ACCESS_DAYS[offerSlug] ?? DEFAULT_ACCESS_DAYS;

    const sessionLine =
      product && isVoiceReading(product)
        ? product.accessType === "season_pass"
          ? `Your pass covers unlimited personal return calls for ${product.accessDays} days — up to ${product.durationMinutes} minutes per session, no automatic renewal.`
          : `Your purchase covers one paid session of up to ${product.durationMinutes} minutes. Call within ${product.accessDays} days to begin.`
        : "";

    let accessIssued = false;
    if (email !== "(no email)") {
      try {
        const token = await mintToken(email, accessDays);
        const link = `${SITE_URL}/access#token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
        await sendIntakeEmail({
          to: email,
          subject:
            "Your Card Blueprints reading is ready — here's how to start",
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
        console.error("[webhook] access email issuance failed", e);
      }
    }

    const notifyTo = process.env.INTAKE_EMAIL;
    if (notifyTo) {
      try {
        await sendIntakeEmail({
          to: notifyTo,
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
      }
    }
  }

  return NextResponse.json({ received: true });
}