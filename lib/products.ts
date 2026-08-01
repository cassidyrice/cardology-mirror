// The public paid ladder: three voice readings, one recommended middle.
// Every marketing surface, checkout route, and webhook reads from here —
// entitlements are defined once and validated server-side against this file.

export type ReadingAccessType = "single_session" | "season_pass";

export type ReadingOffer = {
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  badge?: string;
  oneLine: string;
  bestFor: string;
  deliverable: string;
  turnaround: string;
  includes: string[];
  cta: string;
  href?: string;
  checkoutNote: string;
  stripePriceEnv:
    | "STRIPE_PRICE_QUICK_QUESTION"
    | "STRIPE_PRICE_COMPLETE_READING"
    | "STRIPE_PRICE_SEASON_PASS";
  accessType: ReadingAccessType;
  durationMinutes: number;
  accessDays: number;
  maxCompletedCalls?: number;
};

export type ReadingOfferFact = {
  label: "Deliverable" | "Session" | "Calls" | "Access" | "Renewal";
  value: string;
};

export const READING_OFFERS: ReadingOffer[] = [
  {
    slug: "quick-question",
    stripePriceEnv: "STRIPE_PRICE_QUICK_QUESTION",
    name: "Quick Question",
    price: 19,
    priceLabel: "$19",
    oneLine: "Get clarity on one real question.",
    bestFor:
      "A focused question about one person, relationship, decision, or immediate situation.",
    deliverable: "One live phone session with the AI Cardology reader.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "One personalized Cardology question",
      "Up to 5 minutes with the AI reader",
      "Phone access after checkout and recognition",
    ],
    cta: "Ask My Question — $19",
    checkoutNote: "One-time purchase. Call within 30 days. One paid session.",
    accessType: "single_session",
    durationMinutes: 5,
    accessDays: 30,
    maxCompletedCalls: 1,
  },
  {
    slug: "complete-reading",
    stripePriceEnv: "STRIPE_PRICE_COMPLETE_READING",
    name: "Complete Reading",
    price: 39,
    priceLabel: "$39",
    badge: "Most Popular",
    oneLine: "Hear the complete pattern behind your cards.",
    bestFor:
      "A fuller personal or relationship reading with room to connect the cards to real life.",
    deliverable: "One live phone session with the AI Cardology reader.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "Birth card and ruling-card interpretation",
      "Love, work, money, timing, or relationship focus",
      "Up to 15 minutes with the AI reader",
    ],
    cta: "Get My Complete Reading — $39",
    checkoutNote: "One-time purchase. Call within 30 days. One paid session.",
    accessType: "single_session",
    durationMinutes: 15,
    accessDays: 30,
    maxCompletedCalls: 1,
  },
  {
    slug: "season-pass-90",
    stripePriceEnv: "STRIPE_PRICE_SEASON_PASS",
    name: "90-Day Season Pass",
    price: 199,
    priceLabel: "$199",
    badge: "Best Value",
    oneLine: "Keep your Cardology reader available through an entire season.",
    bestFor:
      "Ongoing questions, changing situations, relationship dynamics, timing, and daily cards.",
    deliverable:
      "Unlimited personal return calls with the AI Cardology reader for 90 days.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "Unlimited return calls for 90 days",
      "Compatibility, timing, and daily-card questions",
      "One payment with no automatic renewal",
    ],
    cta: "Open My 90-Day Pass — $199",
    checkoutNote: "One payment. No automatic renewal. Personal fair use applies.",
    accessType: "season_pass",
    durationMinutes: 15,
    accessDays: 90,
  },
];

// Customer-facing entitlement facts are derived from the same fields the
// checkout and access layers use. Keep the pricing cards explicit without
// creating a second, hand-maintained version of the offer contract.
export function readingOfferFacts(offer: ReadingOffer): ReadingOfferFact[] {
  const isSeasonPass = offer.accessType === "season_pass";

  return [
    {
      label: "Deliverable",
      value: offer.deliverable,
    },
    {
      label: "Session",
      value: `Up to ${offer.durationMinutes} minutes${isSeasonPass ? " per session" : ""}.`,
    },
    {
      label: "Calls",
      value: isSeasonPass
        ? "Unlimited personal return calls under fair use."
        : `${offer.maxCompletedCalls === 1 ? "One" : offer.maxCompletedCalls} completed call${
            offer.maxCompletedCalls === 1 ? "" : "s"
          }.`,
    },
    {
      label: "Access",
      value: isSeasonPass
        ? `${offer.accessDays} days from purchase.`
        : `Use within ${offer.accessDays} days.`,
    },
    {
      label: "Renewal",
      value: "No automatic renewal.",
    },
  ];
}

export function readingOfferHref(offer: ReadingOffer): string {
  return offer.href ?? `/checkout/${offer.slug}`;
}

/**
 * Public, indexable link for an offer — the /readings anchor, not the noindex
 * checkout route. Matches the Offer.url emitted in app/layout.tsx so sitewide
 * chrome and structured data point at the same place. Use this in the footer
 * and other always-present navigation; use readingOfferHref for real intent.
 */
export function readingOfferPublicHref(offer: ReadingOffer): string {
  return `/readings#${offer.slug}`;
}

export function offerBySlug(slug: string): ReadingOffer | undefined {
  return READING_OFFERS.find((o) => o.slug === slug);
}
