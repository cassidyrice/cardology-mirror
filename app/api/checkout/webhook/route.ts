import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { funnelContextFromMetadata } from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { birthdateFromCheckoutSession } from "@/lib/birthdate";
import { sendEmail as sendIntakeEmail } from "@/lib/email";
import { deliverReading } from "@/lib/reading-fulfill";
import { READER_PHONE_DISPLAY } from "@/lib/offers";
import {
  ALL_90_SPREADS_FILE,
  FIFTY_TWO_BY_SEVEN_ACCESS_DAYS,
  FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
  birthdayForCommand,
  isJokerBirthdate,
  isOneQuestionSession,
  questionFromCheckoutSession,
} from "@/lib/deep-dive";
import {
  productBySlug,
  isVoiceReading,
  isDigitalDownload,
  isInstantReport,
  isMembership,
  isDeepDive,
  MEMBERSHIP_SLUG,
} from "@/lib/products";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { mintToken } from "@/lib/gate";
import { mintDownloadToken } from "@/lib/download-token";
import { mintReportToken } from "@/lib/report-token";
import { mintMembershipToken } from "@/lib/membership-token";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const DEFAULT_ACCESS_DAYS = 30;

/** Buyer email block for the report + consultation tier. Two lines on how the
 *  call works, then the booking link. If the Cal.com link is not configured the
 *  buyer is told it follows by email and Cass is flagged in the intake email. */
function consultationLines(consult: { minutes: number; bookingUrl: string }): string[] {
  return [
    "",
    `Your ${consult.minutes}-minute consultation with Cass, live:`,
    "Bring the report and your questions. Cass brings the deck and walks the boards with you.",
    consult.bookingUrl
      ? `Pick a time here: ${consult.bookingUrl}`
      : "The booking link follows in a separate email from Cass.",
  ];
}

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

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
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

    // Every fulfillment branch requires confirmed payment, including delayed methods.
    if (!paymentSatisfied) return NextResponse.json({ received: true });
    if (isOneQuestionSession(session)) {
      try {
        const reading = await deliverReading({
          sessionId: session.id, sessionCreated: session.created,
          birthday: birthdateFromCheckoutSession(session),
          question: questionFromCheckoutSession(session),
          email: session.customer_details?.email ?? session.customer_email ?? "",
        });
        // Stripe retries storage/delivery failures; the durable reservation prevents
        // a second generation. A stuck generation needs operator reconciliation.
        if (reading.status === "failed" || reading.delivery === "review") throw new Error("operator review required");
        if (reading.status !== "ready" || reading.delivery !== "sent") {
          return NextResponse.json({ error: "fulfillment pending" }, { status: 503 });
        }
        return NextResponse.json({ received: true });
      } catch {
        console.error("[webhook] reading requires retry or operator review");
        if (process.env.INTAKE_EMAIL) {
          const birthday = birthdateFromCheckoutSession(session);
          const question = questionFromCheckoutSession(session);
          const quote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'";
          try {
            await sendIntakeEmail({
              to: process.env.INTAKE_EMAIL,
              subject: "Reading fulfillment needs review",
              idempotencyKey: `reading-review/${session.id}`,
              text: [
                `Stripe session: ${session.id}`,
                "ACTION: inspect reading_orders and provider history before running any generation or send.",
                "If text is stored, retry delivery of that text. Do not regenerate it.",
                "If a provider call ended ambiguously, reconcile it before using the manual fallback.",
                `Buyer: ${email}`,
                `Birthday: ${birthday}`,
                `Question: ${question}`,
                "Verified manual tool (only after reconciliation):",
                birthday && question && email !== "(no email)"
                  ? `reading ${birthdayForCommand(birthday)} ${quote(question)} --send ${quote(email)}`
                  : "Ask the buyer for missing details before using reading.",
              ].join("\n"),
            });
          } catch {
            console.error("[webhook] review notification not sent; webhook remains retryable");
          }
        }
        return NextResponse.json({ error: "fulfillment unavailable" }, { status: 503 });
      }
    }

    // ---- BRANCH: retired year-app SKUs on the deep-dive slug ($19 52xSeven
    // Blueprint, $13 Blueprint Breakdown, $9 Deep Dive). Sessions opened before
    // the switch still fulfill: mint the 12-month sign-in token for the year app
    // at /blueprint and email it. ----
    const deepDivePaid =
      paymentSatisfied &&
      !isOneQuestionSession(session) &&
      (isDeepDive(product) ||
        session.metadata?.sku === "52xseven-blueprint-19" ||
        session.metadata?.sku === "blueprint-breakdown-47" ||
        session.metadata?.sku === "deep-dive-9" ||
        session.metadata?.offer_slug === "deep-dive");
    if (deepDivePaid) {
      let buyerEmailed = false;
      let yearUrl = "";
      const birthday = birthdateFromCheckoutSession(session);
      const joker = isJokerBirthdate(birthday);
      const birthdayValid = /^\d{4}-\d{2}-\d{2}$/.test(birthday);
      if (email !== "(no email)") {
        try {
          if (birthdayValid && !joker) {
            const token = await mintReportToken(
              email,
              FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
              session.id,
              birthday,
              FIFTY_TWO_BY_SEVEN_ACCESS_DAYS,
            );
            yearUrl = `${SITE_URL}/blueprint?token=${encodeURIComponent(token)}`;
          }
          const body = [
            "Thank you — your 52xSeven Blueprint is confirmed.",
            "",
            "Your year is unlocked. Your sign-in link is in this email and works for 12 months.",
            "",
          ];
          if (yearUrl) {
            body.push(
              "Your year is unlocked right now — open it and save it to your phone:",
              yearUrl,
              "",
              "Keep this link — it's your sign-in and re-opens your year anytime for 12 months.",
            );
          } else if (!joker) {
            body.push(
              "We could not read a birth date from this checkout. Reply to this email with your birth date (YYYY-MM-DD) and we will unlock your year.",
            );
          }
          body.push("", "If anything doesn't work, just reply to this email.");
          await sendIntakeEmail({
            to: email,
            subject: "Your 52xSeven Blueprint is ready — your year, unlocked",
            text: body.join("\n"),
          });
          buyerEmailed = true;
        } catch (e) {
          console.error("[webhook] 52xseven buyer email failed", e);
        }
      }

      const to = process.env.INTAKE_EMAIL;
      if (to) {
        try {
          await sendIntakeEmail({
            to,
            subject: `Payment received (retired year-app SKU): ${offerName} — ${email}`,
            text: [
              yearUrl
                ? "Fulfilled automatically: the 12-month sign-in link was emailed to the buyer."
                : joker
                  ? "ACTION: December 31 (Joker) — no year to draw. Offer a full refund or a corrected date."
                  : "ACTION: no valid birth date on this order — ask the buyer for YYYY-MM-DD and mint the link.",
              `Birthday: ${birthday || "(missing — ask the buyer)"}`,
              "",
              `Offer: ${offerName} (${offerSlug || "deep-dive"})`,
              `Type: 52xseven blueprint (instant year app)`,
              `SKU: ${session.metadata?.sku || "(none)"}`,
              `Amount: ${amount}`,
              `Customer email: ${email}`,
              `Birthday supplied: ${birthdayValid ? "yes" : "NO"}`,
              `Source: ${session.metadata?.source || "(none)"}`,
              `Buyer confirmation emailed: ${buyerEmailed ? "yes" : "NO — send manually"}`,
              `Sign-in link minted: ${yearUrl ? "yes" : "no"}`,
              `Stripe session: ${session.id}`,
            ].join("\n"),
            replyTo: email !== "(no email)" ? email : undefined,
          });
        } catch (e) {
          console.error("[webhook] 52xseven notification email failed", e);
        }
      }
      return NextResponse.json({ received: true });
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
              `Ask one question: ${SITE_URL}/products/one-question-reading`,
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

    // ---- BRANCH: membership (recurring Cardology Membership) ----
    if (product && isMembership(product)) {
      const birthdate = birthdateFromCheckoutSession(session);
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription?.id ?? "");
      let membershipIssued = false;
      if (
        email !== "(no email)" &&
        subscriptionId &&
        /^\d{4}-\d{2}-\d{2}$/.test(birthdate)
      ) {
        try {
          const token = await mintMembershipToken(
            email,
            product.reportSlug,
            subscriptionId,
            birthdate,
          );
          const membershipUrl = `${SITE_URL}/membership?token=${encodeURIComponent(token)}`;
          await sendIntakeEmail({
            to: email,
            subject: "Your Cardology Membership is active",
            text: [
              `Thank you — your ${product.name} is confirmed.`,
              "",
              "Your dashboard is ready right now:",
              membershipUrl,
              "",
              "It refreshes with a new link each month when your membership renews — keep the latest one from your email.",
              "",
              "Cancel anytime by replying to this email.",
            ].join("\n"),
          });
          membershipIssued = true;
        } catch (e) {
          console.error("[webhook] membership email issuance failed", e);
        }
      } else {
        console.error("[webhook] membership missing email/subscription/birthdate", {
          hasEmail: email !== "(no email)",
          hasSubscription: Boolean(subscriptionId),
          birthdateValid: /^\d{4}-\d{2}-\d{2}$/.test(birthdate),
        });
      }

      const to = process.env.INTAKE_EMAIL;
      if (to) {
        try {
          await sendIntakeEmail({
            to,
            subject: `Payment received (membership): ${offerName} — ${email}`,
            text: [
              `Offer: ${offerName} (${offerSlug || MEMBERSHIP_SLUG})`,
              `Type: membership (subscription)`,
              `Amount: ${amount}`,
              `Customer email: ${email}`,
              `Birthdate supplied: ${/^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? "yes" : "NO"}`,
              `Subscription: ${subscriptionId || "(missing)"}`,
              `Welcome email sent: ${membershipIssued ? "yes" : "NO — send manually"}`,
              `Stripe session: ${session.id}`,
            ].join("\n"),
            replyTo: email !== "(no email)" ? email : undefined,
          });
        } catch (e) {
          console.error("[webhook] membership notification email failed", e);
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
          // reportSlug names the document; two price tiers share blueprint-report.
          // personal-card-blueprint's reportSlug equals its slug, so legacy tokens are unchanged.
          const token = await mintReportToken(
            email,
            product.reportSlug,
            session.id,
            birthdate,
          );
          const reportUrl = `${SITE_URL}/blueprint?token=${encodeURIComponent(token)}`;
          // Bundled download: The 90 Spreads PDF ships with the Blueprint.
          let spreadsLine = "";
          try {
            const dl = await mintDownloadToken(email, ALL_90_SPREADS_FILE.slug, 30);
            spreadsLine = `${ALL_90_SPREADS_FILE.label} (PDF, link good for 30 days): ${SITE_URL}/api/download/${ALL_90_SPREADS_FILE.slug}?token=${encodeURIComponent(dl)}`;
          } catch (e) {
            console.error("[webhook] 90 spreads token mint failed", e);
          }
          await sendIntakeEmail({
            to: email,
            subject: `Your ${product.name} is ready`,
            text: [
              `Thank you — your ${product.name} is confirmed.`,
              "",
              "Your personalized report is ready right now:",
              reportUrl,
              "",
              "Keep this link — it re-opens your report anytime.",
              ...(spreadsLine
                ? ["", "Your bundled download — every yearly map, ages 0–89:", spreadsLine]
                : []),
              ...(product.consultation ? consultationLines(product.consultation) : []),
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
          const consult = product.consultation;
          await sendIntakeEmail({
            to,
            subject: consult
              ? `ACTION: confirm the ${consult.minutes}-minute consult for ${email}`
              : `Payment received (report): ${offerName} — ${email}`,
            text: [
              `Offer: ${offerName} (${offerSlug || "unknown slug"})`,
              `Type: instant report${consult ? " + consultation" : ""}`,
              `Amount: ${amount}`,
              `Customer email: ${email}`,
              `Birthdate supplied: ${/^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? "yes" : "NO"}`,
              `Report email sent: ${reportIssued ? "yes" : "NO — send manually"}`,
              `Stripe session: ${session.id}`,
              ...(consult
                ? [
                    "",
                    `ACTION: confirm the ${consult.minutes}-minute consult.`,
                    `Buyer: ${email}`,
                    `Birthdate: ${birthdate || "(missing)"}`,
                    `Stripe session: ${session.id}`,
                    consult.bookingUrl
                      ? `Booking link sent to buyer: ${consult.bookingUrl}`
                      : "BOOKING LINK NOT CONFIGURED: email the buyer the Cal.com link by hand.",
                  ]
                : []),
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

  // ---- Membership renewal: push the token's exp forward each billing cycle ----
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionDetails = invoice.parent?.subscription_details;
    const subscriptionId =
      typeof subscriptionDetails?.subscription === "string"
        ? subscriptionDetails.subscription
        : (subscriptionDetails?.subscription?.id ?? "");
    if (invoice.billing_reason === "subscription_cycle" && subscriptionId) {
      try {
        const meta = subscriptionDetails?.metadata || {};
        const email = invoice.customer_email || "";
        const birthdate = meta.birthdate || "";
        const reportSlug = meta.report_slug || MEMBERSHIP_SLUG;
        if (email && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
          const token = await mintMembershipToken(email, reportSlug, subscriptionId, birthdate);
          const membershipUrl = `${SITE_URL}/membership?token=${encodeURIComponent(token)}`;
          await sendIntakeEmail({
            to: email,
            subject: "Your Cardology Membership renewed",
            text: [
              "Your membership just renewed — here's your fresh dashboard link:",
              "",
              membershipUrl,
              "",
              "Cancel anytime by replying to this email.",
            ].join("\n"),
          });
        } else {
          console.error("[webhook] membership renewal missing email/birthdate", {
            subscriptionId,
            hasEmail: Boolean(email),
          });
        }
      } catch (e) {
        console.error("[webhook] membership renewal token mint failed", e);
      }
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}