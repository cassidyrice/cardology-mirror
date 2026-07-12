// Funnel offer state — single source of truth for the free teaser call and
// the $9 Deck Pass trial across every marketing surface.
//
// TRIAL LAUNCH SWITCH: while `trialAvailable` is false, every trial surface
// (/try, ReadingBridge, OfferCta) renders its "join the first callers"
// fallback — free teaser call + $99 full pass. Once the $9 Stripe price is
// live, flip `trialAvailable` to true and set `trialPriceId`; /try then
// sends buyers to `trialCheckoutPath` (which must resolve to a checkout —
// today /checkout/[offer] 303s unknown slugs to /readings as a safe
// fallback, so wire the trial offer there in the same change).

// The reading line. Authoritative source: the cardology-unlock Worker
// (src/index.js READER_TEL / READER_TEL_DISPLAY) — the AI voice agent that
// answers this number IS the product, and the free first-card teaser is the
// top of the funnel.
export const READER_PHONE_DISPLAY = "+1 (949) 368-2652";
export const READER_PHONE_TEL = "tel:+19493682652";

// Trial surfaces
export const TRIAL_PATH = "/try";
export const TRIAL_PRICE_LABEL = "$9";
export const TRIAL_NAME = "7-Day Deck Pass Trial";

export type TrialOffer = {
  trialAvailable: boolean;
  trialPriceId: string | null;
  trialCheckoutPath: string;
};

export const TRIAL_OFFER: TrialOffer = {
  trialAvailable: false,
  trialPriceId: null,
  trialCheckoutPath: "/checkout/trial",
};
