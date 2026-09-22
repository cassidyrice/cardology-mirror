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
import { BLUEPRINT_REPORT_SLUG } from "@/lib/blueprint-report";
import { isJokerBirthdate } from "@/lib/deep-dive";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  DEEP_DIVE_REVIEW_PATH,
  deepDivePriceId,
  deepDiveSessionMetadata,
  sanitizeQuestion,
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

/** Cover name: plain text, one line, no control characters, never an email. */
function sanitizeCoverName(value: unknown): string {
  if (typeof value !== "string") return "";
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return clean.includes("@") ? "" : clean;
}
export const dynamic = "force-dynamic";

const CHECKOUT_LIMIT = 20;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

// POST /checkout/[offer]/session
// Creates a Stripe Checkout Session for active reports, downloads, and the
// One Question Reading (internal slug "deep-dive"): birth date + question in
// session metadata, fulfilled by hand from the intake email.
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
      new URL("/products/one-question-reading", req.url),
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
  let formQuestion = "";
  let formCoverName = "";
  let requestedSource = "";
  let requestedCardLabel = "";
  let requestedCardSlug = "";
  let analytics: FunnelContext = {};
  try {
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      formBirthdate = sanitizeBirthdateISO(body.birthdate ?? body.birthday);
      formQuestion = sanitizeQuestion(body.question);
      formCoverName = sanitizeCoverName(body.cover_name);
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
      formQuestion = sanitizeQuestion(form.get("question"));
      formCoverName = sanitizeCoverName(form.get("cover_name"));
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

  if (isInstantReport(product) && product.reportSlug === BLUEPRINT_REPORT_SLUG && formBirthdate > new Date().toISOString().slice(0, 10)) {
    if (wantsJson) return NextResponse.json({ error: "need-date" }, { status: 400 });
    return NextResponse.redirect(new URL(`/checkout/${product.slug}?status=need-date`, req.url), 303);
  }

  if (isInstantReport(product) && product.reportSlug === BLUEPRINT_REPORT_SLUG && isJokerBirthdate(formBirthdate)) {
    if (wantsJson) return NextResponse.json({ error: "unsupported-date", message: "The Blueprint Report does not support December 31. No payment was started." }, { status: 400 });
    return NextResponse.redirect(new URL(`/checkout/${product.slug}?status=unsupported-date`, req.url), 303);
  }

  if (isDeepDive(product) && !formBirthdate) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "need-date", message: "Birth date is required for the One Question Reading." },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL(`${DEEP_DIVE_REVIEW_PATH}?status=need-date`, req.url),
      303,
    );
  }
  if (isDeepDive(product) && !formQuestion) {
    if (wantsJson) {
      return NextResponse.json(
        { error: "need-question", message: "The question is required for the One Question Reading." },
        { status: 400 },
      );
    }
    return NextResponse.redirect(
      new URL(`${DEEP_DIVE_REVIEW_PATH}?status=need-question`, req.url),
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
    // app/report/route.ts prints this on the cover; Stripe billing name is the fallback.
    if (isInstantReport(product) && formCoverName) {
      metadata.cover_name = formCoverName;
    }

    const sharedMeta = { ...metadata, ...analyticsMetadata(analytics) };
    if (formBirthdate) {
      sharedMeta.birthdate = formBirthdate;
    }
    if (isDeepDive(product) && formBirthdate && formQuestion) {
      Object.assign(
        sharedMeta,
        deepDiveSessionMetadata({
          birthday: formBirthdate,
          question: formQuestion,
          source: requestedSource || "checkout-review",
          cardLabel: requestedCardLabel,
          cardSlug: requestedCardSlug,
        }),
      );
    }
    const lineItems: { price: string; quantity: number }[] = [
      { price: priceId, quantity: 1 },
    ];

    const subscription = isMembership(product);
    const cancelUrl = isDeepDive(product)
      ? `${SITE_URL}${DEEP_DIVE_REVIEW_PATH}`
      : `${SITE_URL}/checkout/${product.slug}`;
    const session = await getStripe().checkout.sessions.create(
      subscription
        ? {
            mode: "subscription",
            line_items: lineItems,
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
            allow_promotion_codes: false,
            billing_address_collection: "auto",
            automatic_tax: { enabled: false },
            payment_method_collection: "always",
            submit_type: "auto",
            origin_context: "web",
          }
        : {
            mode: "payment",
            line_items: lineItems,
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
            allow_promotion_codes: false,
            billing_address_collection: "auto",
            automatic_tax: { enabled: false },
            submit_type: "auto",
            origin_context: "web",
            customer_creation: "always",
            // No custom_text: Stripe rejects it while Managed Payments is on for this account
            // (live error 2026-09-02). The refund line lives under the CTA on the site instead.
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
      new URL(`${DEEP_DIVE_REVIEW_PATH}?status=unavailable`, req.url),
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
