import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Canonical host enforcement: 301 any www.* request to the apex domain,
// preserving path and query. Everything else passes through.
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = new URL(request.url);
    url.host = host.slice(4);
    return NextResponse.redirect(url, 301);
  }

  // /card-of-the-day is edge-rendered per request and computes "today"
  // (America/Denver) at render time; deploys are manual and infrequent, so
  // no cache may hold the HTML or it serves yesterday's card. This header
  // MUST live here, not in next.config headers(): the build output's
  // middleware route carries override:true, which wipes any config-route
  // headers collected before the middleware runs (verified against the
  // compiled next-on-pages worker 2026-07-12) — headers set on the
  // middleware response itself are merged after that reset and do land.
  if (request.nextUrl.pathname === "/card-of-the-day") {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
