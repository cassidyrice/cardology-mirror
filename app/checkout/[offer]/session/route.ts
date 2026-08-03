import { NextRequest, NextResponse } from "next/server";

import {
  analyticsMetadata,
  funnelContextFromFormData,
  type FunnelContext,
} from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { offerBySlug } from "@/lib/products";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CHECKOUT_LIMIT = 20;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

// POST /checkout/[offer]/session
// A deliberate customer action creates the Stripe Checkout Session. The
// stable GET review page is safe for crawlers, previews, and link validators.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ offer: string }> },
) {
  const limited = rateLimit(`checkout:${clientIp(req)}`, {
    limit: CHECKOUT_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
  });
  if (!limited.ok) {
    return new NextResponse("Too many checkout attempts. Try again shortly.", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  const { offer: slug } = await params;
  const offer = offerBySlug(slug);
  if (!offer) {
    return NextResponse.redirect(new URL("/readings", req.url), 303);
  }

  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = new Set([req.nextUrl.origin, new URL(SITE_URL).origin]);
  if (requestOrigin && !allowedOrigins.has(requestOrigin)) {
    return new NextResponse("Invalid checkout origin", { status: 403 });
  }

  let analytics: FunnelContext = {};
  try {
    analytics = funnelContextFromFormData(await req.formData());
  } catch {
    // Attribution is optional and must never block checkout.
  }

  const priceId = process.env[offer.stripePriceEnv];
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return checkoutUnavailable(req, offer.slug);
  }

  try {
    const entitlement: Record<string, string> = {
      offer_slug: offer.slug,
      offer_name: offer.name,
      access_type: offer.accessType,
      max_session_minutes: String(offer.durationMinutes),
      access_days: String(offer.accessDays),
      ...(offer.maxCompletedCalls != null
        ? { max_completed_calls: String(offer.maxCompletedCalls) }
        : {}),
    };
    const metadata = {
      ...entitlement,
      ...analyticsMetadata(analytics),
    };
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/${offer.slug}`,
      metadata,
      payment_intent_data: {
        metadata: entitlement,
      },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
    });
    if (session.url) {
      recordFunnelEvent({
        name: "checkout_started",
        source: "server",
        ...analytics,
        eventId: `checkout:${session.id}`,
        path: `/checkout/${offer.slug}`,
        offerSlug: offer.slug,
        outcome: "stripe-session-created",
        currency: session.currency ?? "usd",
        valueCents: session.amount_total ?? offer.price * 100,
      });
      return NextResponse.redirect(session.url, 303);
    }
    console.error("[checkout] stripe session missing url", { offer: offer.slug });
  } catch (error) {
    console.error("[checkout] stripe session creation failed", error);
  }

  return checkoutUnavailable(req, offer.slug);
}

function checkoutUnavailable(req: NextRequest, slug: string) {
  return NextResponse.redirect(
    new URL(`/checkout/${slug}?status=unavailable`, req.url),
    303,
  );
}
