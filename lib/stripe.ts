import Stripe from "stripe";

// Singleton Stripe client configured for the edge runtime.
// Cloudflare Pages / Next-on-Pages routes run on the Workers runtime, which
// supports `fetch` but not Node's `http`. Stripe's SDK ships an edge-friendly
// HTTP client we plug in here.

let cached: Stripe | null = null;
let cachedKey = "";

export function getStripe(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and fill it in.");
  }
  if (cached && cachedKey === key) return cached;
  cached = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  cachedKey = key;
  return cached;
}
