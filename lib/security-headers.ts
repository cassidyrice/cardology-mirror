// Shared browser security headers for every HTML/API response.
// Kept deliberately free of a strict Content-Security-Policy for now —
// Stripe Checkout, analytics, and next-on-pages inline scripts need a
// measured CSP pass later so we don't brick payment.

export const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  // Force HTTPS for a year once a browser has seen us over TLS.
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  // Stop clickjacking of checkout / access pages.
  ["X-Frame-Options", "DENY"],
  // Don't let browsers MIME-sniff away from declared content types.
  ["X-Content-Type-Options", "nosniff"],
  // Send origin on cross-origin navigations; full URL only same-origin.
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  // Lock down powerful browser APIs we never use.
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
  // Older XSS filter hint (harmless; modern browsers ignore).
  ["X-XSS-Protection", "0"],
  // Reduce cross-origin leakage of window / resources.
  ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
  ["Cross-Origin-Resource-Policy", "same-site"],
];

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of SECURITY_HEADERS) {
    headers.set(name, value);
  }
}
