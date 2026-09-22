// Shared browser security headers for every HTML/API response.
// Content-Security-Policy-Report-Only only. Do not rename that header to
// Content-Security-Policy here — enforcing is its own later change
// (docs/CAR-14-csp.md).
//
// report-uri only. Chrome 148 drops report-uri when report-to is also set,
// and did not deliver a Reporting API POST for Reporting-Endpoints or the
// legacy Report-To header in a same-origin probe. Do not add report-to here
// until that delivery is proven. Do not point this at Cloudflare's cf-nel group.

export const CSP_REPORT_PATH = "/api/csp-report";

export const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")'],
  ["X-XSS-Protection", "0"],
  ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
  ["Cross-Origin-Resource-Policy", "same-site"],
  [
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com https://buttondown.com https://buttondown.email",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://*.posthog.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://*.posthog.com",
      "img-src 'self' data: https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com https://*.posthog.com",
      "worker-src 'self' blob: data:",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      `report-uri ${CSP_REPORT_PATH}`,
    ].join("; "),
  ],
];

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of SECURITY_HEADERS) {
    headers.set(name, value);
  }
}
