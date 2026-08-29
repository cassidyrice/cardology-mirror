import { NextRequest, NextResponse } from "next/server";

import {
  analyticsMetadata,
  FUNNEL_COOKIE_NAME,
  funnelContextFromCookie,
  funnelContextFromFormData,
  mergeFunnelContext,
  sanitizeAnalyticsId,
  sanitizeAnalyticsLabel,
  sanitizeAnalyticsPath,
  sanitizeHostname,
  sanitizeTrafficChannel,
  type FunnelContext,
} from "@/lib/analytics";
import { recordFunnelEvent } from "@/lib/analytics-server";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  DEEP_DIVE_OFFER_SLUG,
  deepDivePriceId,
  deepDiveSessionMetadata,
  sanitizeDeepDiveSource,
  stripePublishableKey,
} from "@/lib/deep-dive";
import {
  checkoutProductBySlug,
  isDeepDive,
  isDigitalDownload,
  isInstantReport,
} from "@/lib/products";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CHECKOUT_LIMIT = 20;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

// POST /checkout/[offer]/session
// Creates a Stripe Checkout Session for active reports, downloads, and Deep Dive.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ offer: string }> },
) {
  const limited = rateLimit(rateLimitKey(req, "checkout"), {
    limit: CHECKOUT_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
  });
  if (!limited.ok) {
    return checkoutError(req, "Too many checkout attempts. Try again shortly.", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  const { offer: slug } = await params;
  const product = checkoutProductBySlug(slug);
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
    return checkoutError(req, "Invalid checkout origin", { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  const wantsJson =
    contentType.includes("application/json") ||
    (req.headers.get("accept") || "").includes("application/json");

  let formBirthdate = "";
  let requestedSource = "";
  let requestedCardLabel = "";
  let requestedCardSlug = "";
  let analytics: FunnelContext = {};
  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      formBirthdate = sanitizeBirthdateISO(body.birthdate ?? body.birthday);
      requestedSource = typeof body.source === "string" ? body.source : "";
      requestedCardLabel = typeof body.cardLabel === "string" ? body.cardLabel : "";
      requestedCardSlug = typeof body.cardSlug === "string" ? body.cardSlug : "";
      const fromBody = funnelContextFromJson(body);
      const fromCookie = funnelContextFromCookie(
        req.cookies.get(FUNNEL_COOKIE_NAME)?.value,
      );
      analytics = mergeFunnelContext(fromBody, fromCookie, {
        path: `/checkout/${product.slug}`,
        offerSlug: product.slug,
      });
    } else {
      const form = await req.formData();
      formBirthdate = sanitizeBirthdateISO(form.get("birthdate"));
      const sourceField = form.get("source");
      requestedSource = typeof sourceField === "string" ? sourceField : "";
      const fromForm = funnelContextFromFormData(form);
      const fromCookie = funnelContextFromCookie(
        req.cookies.get(FUNNEL_COOKIE_NAME)?.value,
      );
      analytics = mergeFunnelContext(fromForm, fromCookie, {
        path: `/checkout/${product.slug}`,
        offerSlug: product.slug,
      });
    }
  } catch {
    const fromCookie = funnelContextFromCookie(
      req.cookies.get(FUNNEL_COOKIE_NAME)?.value,
    );
    analytics = mergeFunnelContext({}, fromCookie, {
      path: `/checkout/${product.slug}`,
      offerSlug: product.slug,
    });
  }

  const priceId = isDeepDive(product)
    ? deepDivePriceId()
    : process.env[product.stripePriceEnv];
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return checkoutUnavailable(req, product.slug);
  }
  if (isDeepDive(product) && !stripePublishableKey()) {
    console.error("[checkout] deep dive publishable key env missing");
    return checkoutUnavailable(req, product.slug);
  }

  if (isInstantReport(product) && !formBirthdate) {
    if (wantsJson) {
      return NextResponse.json({ error: "need-date" }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/checkout/${product.slug}?status=need-date`, req.url),
      303,
    );
  }

  if (isDeepDive(product) && !formBirthdate) {
    return NextResponse.json(
      { error: "Birthday is required for Deep Dive checkout." },
      { status: 400 },
    );
  }

  try {
    const metadata: Record<string, string> = {
      offer_slug: product.slug,
      offer_name: product.name,
      product_kind: product.kind,
    };

    if (isDigitalDownload(product) && !isDeepDive(product)) {
      metadata.redownload_days = String(product.redownloadDays);
      metadata.download_asset_key = product.downloadAssetKey;
    }
    if (isInstantReport(product)) {
      metadata.report_slug = product.reportSlug;
    }

    const sharedMeta = { ...metadata, ...analyticsMetadata(analytics) };
    if (formBirthdate) {
      sharedMeta.birthdate = formBirthdate;
    }
    if (isDeepDive(product) && formBirthdate) {
      Object.assign(
        sharedMeta,
        deepDiveSessionMetadata({
          birthday: formBirthdate,
          source: requestedSource || "birth-card-calculator",
          cardLabel: requestedCardLabel,
          cardSlug: requestedCardSlug,
        }),
      );
    }

    // Deep Dive must stay on-page: always embed + JSON. Never 303 to checkout.stripe.com.
    const embedded = isDeepDive(product);
    const session = await getStripe().checkout.sessions.create(
      embedded
        ? {
            mode: "payment",
            ui_mode: "embedded_page",
            redirect_on_completion: "never",
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: sharedMeta,
            payment_intent_data: { metadata: sharedMeta },
            branding_settings: {
              display_name: SITE_NAME,
            },
            phone_number_collection: {
              enabled: false,
            },
            allow_promotion_codes: true,
            billing_address_collection: "auto",
            customer_creation: "always",
          }
        : {
            mode: "payment",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE_URL}/checkout/${product.slug}`,
            metadata: sharedMeta,
            payment_intent_data: { metadata },
            branding_settings: {
              display_name: SITE_NAME,
            },
            phone_number_collection: {
              enabled: false,
            },
            allow_promotion_codes: true,
            billing_address_collection: "auto",
            customer_creation: "always",
          },
    );

    recordFunnelEvent({
      name: "checkout_started",
      source: "server",
      ...analytics,
      eventId: `checkout:${session.id}`,
      path: `/checkout/${product.slug}`,
      offerSlug: product.slug,
      outcome: embedded ? "stripe-embedded-session-created" : "stripe-session-created",
      currency: session.currency ?? "usd",
      valueCents: session.amount_total ?? product.price * 100,
    });

    if (embedded) {
      if (!session.client_secret) {
        console.error("[checkout] embedded session missing client_secret", {
          offer: product.slug,
        });
        return checkoutUnavailable(req, product.slug);
      }
      return NextResponse.json({
        clientSecret: session.client_secret,
        publishableKey: stripePublishableKey(),
        offerSlug: DEEP_DIVE_OFFER_SLUG,
        source: sanitizeDeepDiveSource(
          requestedSource || "birth-card-calculator",
        ),
      });
    }

    // Deep Dive already returned JSON above. Never 303 to hosted Stripe.
    if (isDeepDive(product)) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }

    if (session.url) {
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

function funnelContextFromJson(body: Record<string, unknown>): FunnelContext {
  return {
    sessionId: sanitizeAnalyticsId(body.analytics_session_id),
    landingPath: sanitizeAnalyticsPath(body.analytics_landing_path),
    referrerHost: sanitizeHostname(body.analytics_referrer_host),
    trafficChannel: sanitizeTrafficChannel(body.analytics_traffic_channel),
    utmSource: sanitizeAnalyticsLabel(body.analytics_utm_source),
    utmMedium: sanitizeAnalyticsLabel(body.analytics_utm_medium),
    utmCampaign: sanitizeAnalyticsLabel(body.analytics_utm_campaign),
  };
}

function checkoutUnavailable(req: NextRequest, slug: string) {
  if (wantsJsonResponse(req) || isDeepDive({ slug })) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.redirect(
    new URL(`/checkout/${slug}?status=unavailable`, req.url),
    303,
  );
}

function checkoutError(
  req: NextRequest,
  message: string,
  init: { status: number; headers?: Record<string, string> },
) {
  if (wantsJsonResponse(req) || req.nextUrl.pathname.includes("/deep-dive/")) {
    return NextResponse.json(
      { error: message },
      { status: init.status, headers: init.headers },
    );
  }
  return new NextResponse(message, init);
}

function wantsJsonResponse(req: NextRequest): boolean {
  const contentType = req.headers.get("content-type") || "";
  const accept = req.headers.get("accept") || "";
  return contentType.includes("application/json") || accept.includes("application/json");
}
