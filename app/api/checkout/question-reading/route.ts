import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  analyticsMetadata,
  inferTrafficChannel,
  sanitizeAnalyticsId,
  sanitizeAnalyticsLabel,
  sanitizeAnalyticsPath,
  sanitizeHostname,
  sanitizeTrafficChannel,
  type FunnelContext,
} from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import {
  CARD_BLUEPRINT_READING_SPEC,
  attachStripeSessionToOrder,
  createPendingQuestionOrder,
  validateQuestionIntake,
} from "@/lib/question-reading-service";
import { rateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limit";
import { readJsonObject } from "@/lib/request-body";
import { APP_URL, SITE_URL } from "@/lib/site";
import { getStripe, hasQuestionTestStripe, verifyCardBlueprintsMerchant } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const LIMIT = 15;
const WINDOW_MS = 60_000;

function isAllowedOrigin(req: NextRequest): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const allowedHosts = new Set<string>([
      new URL(SITE_URL).hostname,
      new URL(APP_URL).hostname,
      "cardblueprints.com",
      "www.cardblueprints.com",
      "localhost",
      "127.0.0.1",
    ]);
    return allowedHosts.has(parsed.hostname) || parsed.hostname.endsWith(".pages.dev");
  } catch {
    return false;
  }
}

function extractAttribution(req: NextRequest, body: Record<string, unknown>, offerSlug: string, sourcePath: string): FunnelContext {
  const raw = (body.attribution && typeof body.attribution === "object" && !Array.isArray(body.attribution)
    ? body.attribution
    : {}) as Record<string, unknown>;

  const referrerHost = sanitizeHostname(raw.referrerHost);
  const utmSource = sanitizeAnalyticsLabel(raw.utmSource);
  const utmMedium = sanitizeAnalyticsLabel(raw.utmMedium);
  const utmCampaign = sanitizeAnalyticsLabel(raw.utmCampaign);
  const explicitChannel = sanitizeTrafficChannel(raw.trafficChannel);

  return {
    sessionId: sanitizeAnalyticsId(raw.sessionId),
    landingPath: sanitizeAnalyticsPath(raw.landingPath) || sourcePath,
    referrerHost,
    trafficChannel:
      explicitChannel !== "unknown"
        ? explicitChannel
        : inferTrafficChannel({
            referrerHost,
            currentHost: req.nextUrl.hostname || "cardblueprints.com",
            utmSource,
            utmMedium,
          }),
    utmSource,
    utmMedium,
    utmCampaign,
    path: sourcePath,
    offerSlug,
  };
}

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden origin" }, { status: 403 });
  }

  const rl = rateLimit(rateLimitKey(req, "checkout-question"), { limit: LIMIT, windowMs: WINDOW_MS });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Wait a moment and try again." },
      { status: 429, headers: rateLimitHeaders(rl, LIMIT) },
    );
  }

  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const checked = validateQuestionIntake(body);
  if (!checked.ok) {
    return NextResponse.json(
      { error: checked.err.error, code: checked.err.code },
      { status: checked.err.status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const intake = checked.value;
  const spec = CARD_BLUEPRINT_READING_SPEC;

  const publishableKey = (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    ""
  ).trim();
  if (!hasQuestionTestStripe() && (!process.env.STRIPE_SECRET_KEY || !publishableKey)) {
    return NextResponse.json(
      { error: "Inline checkout keys are not configured yet." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
    await verifyCardBlueprintsMerchant(stripe);
  } catch (err) {
    console.error("[checkout/question-reading] Stripe setup/merchant guard error", err);
    return NextResponse.json(
      { error: "Payment service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const attribution = extractAttribution(req, body, intake.track, intake.sourcePath);
  const orderRow = await createPendingQuestionOrder(intake, attribution);

  // Reuse an already-open embedded checkout session for the same attemptId
  if (orderRow.stripe_session_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(orderRow.stripe_session_id);
      if (existing.status === "open" && existing.client_secret) {
        return NextResponse.json(
          {
            orderId: orderRow.id,
            sessionId: existing.id,
            clientSecret: existing.client_secret,
            publishableKey: publishableKey || "pk_test_mock",
            amountCents: spec.amountCents,
          },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
    } catch {
      // Fall through and create a fresh session
    }
  }

  const configuredPriceId = (process.env.STRIPE_PRICE_CARD_BLUEPRINT_READING || "").trim();

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = configuredPriceId
    ? { price: configuredPriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: spec.amountCents,
          product_data: {
            name: spec.title,
            description:
              intake.deliveryChannel === "sms"
                ? `Instant Suggested Questions Guide (.pdf) + 48-hour Reading Pass (up to 3 questions) — delivered by text message within 48h (almost all under 24h).`
                : `Instant Suggested Questions Guide (.pdf) + 48-hour Reading Pass (up to 3 questions) — delivered by email within 48h (almost all under 24h).`,
          },
        },
      };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      allow_promotion_codes: true,
      ...(intake.buyerEmail ? { customer_email: intake.buyerEmail } : {}),
      line_items: [lineItem],
      metadata: {
        question_order_id: orderRow.id,
        offer_slug: intake.track,
        offer_name: spec.title,
        delivery_channel: intake.deliveryChannel,
        birth1: intake.birth1,
        ...(intake.birth2 ? { birth2: intake.birth2 } : {}),
        question_preview: intake.question.slice(0, 450),
        placement: intake.placement,
        ...analyticsMetadata(attribution),
      },
    });

    await attachStripeSessionToOrder(orderRow.id, session.id);

    recordFunnelEvent({
      name: "checkout_started",
      source: "server",
      ...attribution,
      eventId: `qro_start:${session.id}`,
      path: intake.sourcePath,
      offerSlug: intake.track,
      placement: intake.placement,
      outcome: `embedded:${intake.deliveryChannel}`,
      currency: "usd",
      valueCents: spec.amountCents,
    });

    return NextResponse.json(
      {
        orderId: orderRow.id,
        sessionId: session.id,
        clientSecret: session.client_secret,
        publishableKey: publishableKey || "pk_test_mock",
        amountCents: spec.amountCents,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    console.error("[checkout/question-reading] failed to create embedded session", err);
    return NextResponse.json(
      { error: "Could not start inline checkout right now. Please try again in a moment." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
