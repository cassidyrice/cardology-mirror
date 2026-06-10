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
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
