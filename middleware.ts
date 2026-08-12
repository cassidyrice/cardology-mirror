import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { legacyCardDestination } from "@/lib/legacy-card-redirects";
import { applySecurityHeaders } from "@/lib/security-headers";

const RETIRED_PUBLIC_REDIRECTS: Record<string, string> = {
  "/readings": "/products/personal-card-blueprint",
  "/try": "/birth-card-calculator",
  // Consolidate the older blog explainer into the stronger evergreen guide.
  // This removes query overlap while preserving the blog URL's existing equity.
  "/blog/what-cardology-is-and-is-not": "/what-is-cardology",
};

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

  const retiredDestination = RETIRED_PUBLIC_REDIRECTS[request.nextUrl.pathname];
  if (retiredDestination) {
    redirectUrl.pathname = retiredDestination;
    shouldRedirect = true;
  }

  const cardDestination = legacyCardDestination(request.nextUrl.pathname);
  if (cardDestination) {
    redirectUrl.pathname = cardDestination;
    shouldRedirect = true;
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
