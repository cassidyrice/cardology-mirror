// Shared browser security headers for every HTML/API response.
// Kept deliberately free of a strict Content-Security-Policy for now —
// Stripe Checkout, analytics, and next-on-pages inline scripts need a
// measured CSP pass later so we don't brick payment.

export const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"],
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com",
      "img-src 'self' data: https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "style-src 'self' 'unsafe-inline'",
    ].join("; "),
  ],
];

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of SECURITY_HEADERS) {
    headers.set(name, value);
  }
}
