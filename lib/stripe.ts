import Stripe from "stripe";
import { CARD_BLUEPRINTS_STRIPE_ACCOUNT } from "./question-reading-tracks";

// Singleton Stripe client configured for the edge runtime.
// Cloudflare Pages / Next-on-Pages routes run on the Workers runtime, which
// supports `fetch` but not Node's `http`. Stripe's SDK ships an edge-friendly
// HTTP client we plug in here.

let cached: Stripe | null = null;
let testStripeOverride: Stripe | null = null;
let verifiedLiveAccountUntil = 0;

export function setQuestionTestStripe(client: Stripe | null): void {
  testStripeOverride = client;
  verifiedLiveAccountUntil = 0;
}

export function hasQuestionTestStripe(): boolean {
  return testStripeOverride !== null;
}

export function getStripe(): Stripe {
  if (testStripeOverride) return testStripeOverride;
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and fill it in.");
  }
  cached = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}

export async function verifyCardBlueprintsMerchant(stripe: Stripe): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const isLiveKey = secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_");
  if (!isLiveKey && !testStripeOverride) return;
  if (verifiedLiveAccountUntil > Date.now() && !testStripeOverride) return;

  if (typeof stripe.accounts?.retrieve === "function") {
    const acct = await stripe.accounts.retrieve(null);
    if (acct?.id && acct.id !== CARD_BLUEPRINTS_STRIPE_ACCOUNT) {
      throw new Error(
        `Stripe merchant mismatch (${acct.id}); expected Card Blueprint (${CARD_BLUEPRINTS_STRIPE_ACCOUNT}).`,
      );
    }
    verifiedLiveAccountUntil = Date.now() + 10 * 60_000;
  }
}
