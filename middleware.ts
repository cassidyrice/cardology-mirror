import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { legacyCardDestination } from "@/lib/legacy-card-redirects";
import { applySecurityHeaders } from "@/lib/security-headers";

const RETIRED_PUBLIC_REDIRECTS: Record<string, string> = {
  "/readings": "/products/one-question-reading",
  "/try": "/birth-card-calculator",
  "/cardology-chart": "/birth-card-calculator",
  "/birth-card-chart": "/birth-card-calculator",
  "/cards-of-destiny": "/destiny-cards",
  // The divination spokes were retired 2026-09-01: the hub now teaches the
  // system's real boards (Life, Spirit, 90 yearly spreads).
  "/playing-card-spreads/three-card": "/playing-card-spreads",
  "/playing-card-spreads/love": "/playing-card-spreads",
  "/playing-card-spreads/yes-or-no": "/playing-card-spreads",
  // Catalog collapsed to one product (2026-09-01); that product became the $47
  // Blueprint Breakdown Video with the $9 Deep Dive as a bonus (2026-09-07), then
  // the $19 52xSeven Blueprint year app (2026-09-08), then the $47 One Question
  // Reading (2026-09-13).
  // Fulfillment for past purchases (/blueprint, downloads, success) is untouched.
  "/products/52xseven-blueprint": "/products/one-question-reading",
  "/products/birth-card-deep-dive": "/products/one-question-reading",
  "/products/blueprint-breakdown-video": "/products/one-question-reading",
  "/products/personal-card-blueprint": "/products/one-question-reading",
  "/products/complete-card-blueprint": "/products/one-question-reading",
  "/products/analog-algorithm": "/products/one-question-reading",
  "/membership": "/birth-card-calculator",
  "/checkout/personal-card-blueprint": "/products/one-question-reading",
  "/checkout/complete-card-blueprint": "/products/one-question-reading",
  "/checkout/analog-algorithm": "/products/one-question-reading",
  "/checkout/cardology-membership": "/birth-card-calculator",
  // Consolidate the older blog explainer into the stronger evergreen guide.
  // This removes query overlap while preserving the blog URL's existing equity.
  "/blog/what-cardology-is-and-is-not": "/what-is-cardology",
  "/blog/reading-your-yearly-spread": "/52-day-period-meaning-tool",
  "/blog/why-some-birth-cards-clash": "/cardology-compatibility",
};

const SENSITIVE_QUERY_KEYS = new Set([
  "bd",
  "dob",
  "birthdate",
  "birth_date",
  "email",
]);

const WORKER_SLASH_PREFIXES = ["/born-on", "/compatibility"];

function isWorkerDirectory(pathname: string): boolean {
  return WORKER_SLASH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Canonical host enforcement: 301 any www.* request to the apex domain,
// preserving path and query. Everything else passes through with a shared
// security-header baseline (HSTS, frame deny, nosniff, etc.).
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const redirectUrl = new URL(request.url);
  let shouldRedirect = false;

  if (host.startsWith("www.")) {
    redirectUrl.host = host.slice(4);
    shouldRedirect = true;
  }

  const rawPath = request.nextUrl.pathname;
  let pathname = rawPath;
  if (
    pathname.length > 1 &&
    pathname.endsWith("/") &&
    !isWorkerDirectory(pathname)
  ) {
    pathname = pathname.replace(/\/+$/, "");
    redirectUrl.pathname = pathname;
    shouldRedirect = true;
  }

  const retiredDestination = RETIRED_PUBLIC_REDIRECTS[pathname];
  if (retiredDestination) {
    redirectUrl.pathname = retiredDestination;
    shouldRedirect = true;
  }

  const cardDestination = legacyCardDestination(pathname);
  if (cardDestination) {
    redirectUrl.pathname = cardDestination;
    shouldRedirect = true;
  }

  for (const key of [...redirectUrl.searchParams.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      redirectUrl.searchParams.delete(key);
      shouldRedirect = true;
    }
  }

  if (shouldRedirect) {
    const response = NextResponse.redirect(redirectUrl, 301);
    applySecurityHeaders(response.headers);
    return response;
  }

  // /card-of-the-day is edge-rendered per request and computes "today"
  // (America/Denver) at render time; deploys are manual and infrequent, so
  // no cache may hold the HTML or it serves yesterday's card. This header
  // MUST live here, not in next.config headers(): the build output's
  // middleware route carries override:true, which wipes any config-route
  // headers collected before the middleware runs (verified against the
  // compiled next-on-pages worker 2026-07-12) — headers set on the
  // middleware response itself are merged after that reset and do land.
  const response = NextResponse.next();
  applySecurityHeaders(response.headers);

  // A2A clients fetch this from other origins. Middleware header merge wins
  // over public/_headers, so CORS/CORP have to be set here.
  if (request.nextUrl.pathname === "/.well-known/agent-card.json") {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }

  if (request.nextUrl.pathname === "/card-of-the-day") {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  // Money + API surfaces should never be cached by shared caches.
  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/checkout/") ||
    request.nextUrl.pathname === "/access"
  ) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
