import Stripe from "stripe";

// Singleton Stripe client configured for the edge runtime.
// Cloudflare Pages / Next-on-Pages routes run on the Workers runtime, which
// supports `fetch` but not Node's `http`. Stripe's SDK ships an edge-friendly
// HTTP client we plug in here.

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and fill it in.");
  }
  cached = new Stripe(key, {
    apiVersion: "2025-08-27.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}
