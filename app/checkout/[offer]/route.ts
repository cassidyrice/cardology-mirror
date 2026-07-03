import { NextRequest, NextResponse } from "next/server";

import { offerBySlug } from "@/lib/products";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /checkout/[offer]
// Creates a Stripe Checkout Session for the requested offer and 303-redirects
// the visitor to Stripe's hosted checkout. Each click creates a fresh session.
//
// Graceful fallback: if Stripe is not configured yet (env keys missing) or
// session creation fails (e.g. payment capabilities still paused during
// account review), we fall back to /contact so the production site never
// serves a 500 to a buyer.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ offer: string }> },
) {
  const { offer: slug } = await params;
  const offer = offerBySlug(slug);
  if (!offer) {
    return NextResponse.redirect(new URL("/readings", SITE_URL), 303);
  }

  const priceId = process.env[offer.stripePriceEnv];
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.redirect(
      new URL(`/contact?offer=${offer.slug}`, SITE_URL),
      303,
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Request card explicitly. Without this, Checkout resolves methods from
      // the dashboard's automatic-payment-methods config; if none are enabled
      // Stripe throws "No valid payment method types for this Checkout Session".
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&offer=${offer.slug}`,
      cancel_url: `${SITE_URL}/readings`,
      metadata: { offer_slug: offer.slug, offer_name: offer.name },
      payment_intent_data: {
        metadata: { offer_slug: offer.slug, offer_name: offer.name },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
    });
    if (session.url) {
      return NextResponse.redirect(session.url, 303);
    }
    console.error("[checkout] stripe session missing url", { offer: offer.slug });
  } catch (e) {
    console.error("[checkout] stripe session creation failed", e);
  }
  return NextResponse.redirect(
    new URL(`/contact?offer=${offer.slug}`, SITE_URL),
    303,
  );
}
