// The single public offer: one personally-made video reading.
// Every marketing surface, checkout route, and webhook reads from here —
// the offer is defined once and validated server-side against this file.

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
  stripePriceEnv: "STRIPE_PRICE_VIDEO_READING";
  videoMinutes: number;
  deliveryHours: number;
};

export type ReadingOfferFact = {
  label: "Deliverable" | "Made from" | "Length" | "Delivery" | "Refund";
  value: string;
};

export const READING_OFFERS: ReadingOffer[] = [
  {
    slug: "video-reading",
    stripePriceEnv: "STRIPE_PRICE_VIDEO_READING",
    name: "Personal Video Reading",
    price: 99,
    priceLabel: "$99",
    badge: "Made for you",
    oneLine:
      "A personal Cardology reading you can watch — made for you, not generated live.",
    bestFor:
      "Anyone who wants the pattern behind a birth date read for them personally — and a video they can rewatch and keep.",
    deliverable:
      "One personalized video reading, delivered as a private link to your inbox.",
    turnaround: "Delivered by email within 48 hours of checkout.",
    includes: [
      "Your birth card and ruling card, read as one pattern",
      "Your question or focus woven through the reading",
      "A private video link you can rewatch anytime",
    ],
    cta: "Get My Video Reading — $99",
    checkoutNote:
      "One-time payment. Delivered by email — no subscription, no account.",
    videoMinutes: 5,
    deliveryHours: 48,
  },
];

// Customer-facing entitlement facts are derived from the same fields the
// checkout and delivery layers use. Keep the pricing card explicit without
// creating a second, hand-maintained version of the offer contract.
export function readingOfferFacts(offer: ReadingOffer): ReadingOfferFact[] {
  return [
    {
      label: "Deliverable",
      value: offer.deliverable,
    },
    {
      label: "Made from",
      value: "Your birth date — and your question, if you bring one.",
    },
    {
      label: "Length",
      value: `At least ${offer.videoMinutes} minutes of personal reading.`,
    },
    {
      label: "Delivery",
      value: `Private link emailed within ${offer.deliveryHours} hours.`,
    },
    {
      label: "Refund",
      value: "Full refund any time before your video is delivered.",
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
