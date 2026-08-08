import { NextRequest, NextResponse } from "next/server";

import {
  analyticsMetadata,
  funnelContextFromFormData,
  type FunnelContext,
} from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import {
  publicProductBySlug,
  isDigitalDownload,
  isInstantReport,
} from "@/lib/products";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// POST /checkout/[offer]/session
// Creates a Stripe Checkout Session for active reports and digital downloads.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ offer: string }> },
) {
  const { offer: slug } = await params;
  const product = publicProductBySlug(slug);
  if (!product) {
    return NextResponse.redirect(
      new URL("/products/personal-card-blueprint", req.url),
      303,
    );
  }
  if (isDigitalDownload(product) && !product.available) {
    return checkoutUnavailable(req, product.slug);
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

  const priceId = process.env[product.stripePriceEnv];
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return checkoutUnavailable(req, product.slug);
  }

  try {
    const metadata: Record<string, string> = {
      offer_slug: product.slug,
      offer_name: product.name,
      product_kind: product.kind,
    };

    if (isDigitalDownload(product)) {
      metadata.redownload_days = String(product.redownloadDays);
      metadata.download_asset_key = product.downloadAssetKey;
    } else if (isInstantReport(product)) {
      metadata.report_slug = product.reportSlug;
    }

    const sharedMeta = { ...metadata, ...analyticsMetadata(analytics) };

    const instantReport = isInstantReport(product);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/${product.slug}`,
      metadata: sharedMeta,
      payment_intent_data: { metadata },
      phone_number_collection: {
        enabled: false,
      },
      // instant reports need the buyer's birth date to generate the report
      ...(instantReport
        ? {
            custom_fields: [
              {
                key: "birthdate",
                label: {
                  type: "custom" as const,
                  custom: "Your birth date (YYYY-MM-DD)",
                },
                type: "text" as const,
                optional: false,
              },
            ],
          }
        : {}),
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
        path: `/checkout/${product.slug}`,
        offerSlug: product.slug,
        outcome: "stripe-session-created",
        currency: session.currency ?? "usd",
        valueCents: session.amount_total ?? product.price * 100,
      });
      return NextResponse.redirect(session.url, 303);
    }
    console.error("[checkout] stripe session missing url", {
      offer: product.slug,
    });
  } catch (error) {
    console.error("[checkout] stripe session creation failed", error);
  }

  return checkoutUnavailable(req, product.slug);
}

function checkoutUnavailable(req: NextRequest, slug: string) {
  return NextResponse.redirect(
    new URL(`/checkout/${slug}?status=unavailable`, req.url),
    303,
  );
}
