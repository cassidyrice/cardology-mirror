import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_URL, APP_URL, APP_PATHS, MARKETING_PATHS } from "./lib/site";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const pathname = url.pathname;

  // Development handling: skip subdomain routing on localhost
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return NextResponse.next();
  }

  const appHostname = new URL(APP_URL).hostname;
  const siteHostname = new URL(SITE_URL).hostname;

  // 1. Handle APP subdomain (app.cardologypro.com)
  if (hostname === appHostname) {
    // Root of app subdomain should go to /today or /onboarding
    if (pathname === "/") {
      url.pathname = "/today";
      return NextResponse.redirect(url);
    }

    // Redirect marketing paths back to the main site
    if (MARKETING_PATHS.includes(pathname) && pathname !== "/") {
      return NextResponse.redirect(new URL(pathname, SITE_URL));
    }

    return NextResponse.next();
  }

  // 2. Handle MAIN domain (cardologypro.com)
  if (hostname === siteHostname) {
    // Redirect app paths to the app subdomain
    const isAppPath = APP_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"));
    if (isAppPath) {
      return NextResponse.redirect(new URL(pathname, APP_URL));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
