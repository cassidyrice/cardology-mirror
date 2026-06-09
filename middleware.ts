import { NextResponse } from "next/server";

// App and marketing pages are served from a single host (cardologypro.com),
// so no host-based redirecting is needed. Kept as a pass-through.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
