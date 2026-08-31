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
  deepDivePriceId,
  deepDiveSessionMetadata,
} from "@/lib/deep-dive";
import {
  checkoutProductBySlug,
  isDeepDive,
  isDigitalDownload,
  isInstantReport,
  isMembership,
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
      const labelField = form.get("cardLabel");
      requestedCardLabel = typeof labelField === "string" ? labelField : "";
      const slugField = form.get("cardSlug");
      requestedCardSlug = typeof slugField === "string" ? slugField : "";
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
  if ((isInstantReport(product) || isMembership(product)) && !formBirthdate) {
    if (wantsJson) {
      return NextResponse.json({ error: "need-date" }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL(`/checkout/${product.slug}?status=need-date`, req.url),
      303,
    );
  }

  if (isDeepDive(product) && !formBirthdate) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "Birthday is required for Deep Dive checkout." },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL("/birth-card-calculator?status=need-date", req.url),
      303,
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
    if (isInstantReport(product) || isMembership(product)) {
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

    const subscription = isMembership(product);
    const cancelUrl = isDeepDive(product)
      ? `${SITE_URL}/birth-card-calculator`
      : `${SITE_URL}/checkout/${product.slug}`;
    const session = await getStripe().checkout.sessions.create(
      subscription
        ? {
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: sharedMeta,
            subscription_data: { metadata: sharedMeta },
            branding_settings: {
              display_name: SITE_NAME,
            },
            phone_number_collection: {
              enabled: false,
            },
            allow_promotion_codes: true,
            billing_address_collection: "auto",
          }
        : {
            mode: "payment",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
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
          },
    );

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

    if (session.url) {
      if (wantsJson) {
        return NextResponse.json({ url: session.url });
      }
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
  if (wantsJsonResponse(req)) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (isDeepDive({ slug })) {
    return NextResponse.redirect(
      new URL("/birth-card-calculator?status=unavailable", req.url),
      303,
    );
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
  if (wantsJsonResponse(req)) {
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
