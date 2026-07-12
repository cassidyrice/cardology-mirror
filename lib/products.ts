export type ReadingOffer = {
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  oneLine: string;
  bestFor: string;
  deliverable: string;
  turnaround: string;
  includes: string[];
  cta: string;
  href?: string;
  checkoutNote: string;
  stripePriceEnv: "STRIPE_PRICE_BASIC" | "STRIPE_PRICE_QUESTION" | "STRIPE_PRICE_DEEP";
};

export const READING_OFFERS: ReadingOffer[] = [
  {
    slug: "basic-birth-card-report",
    stripePriceEnv: "STRIPE_PRICE_BASIC",
    name: "Basic Birth Card Report",
    price: 29,
    priceLabel: "$29",
    oneLine: "A clean written report for one person's fixed birth card and ruling-card context.",
    bestFor: "New visitors who want the core Cardology structure for themselves or someone they are trying to understand.",
    deliverable: "Written PDF-style report with birth card, ruling card, suit, rank, balanced expression, shadow range, relational cues, and next-step links.",
    turnaround: "Delivered digitally after intake details are confirmed.",
    includes: [
      "Birth card and ruling-card calculation",
      "Plain-English meaning and shadow range",
      "Personal reflection prompts",
      "Links to matching Card Blueprints pages",
    ],
    cta: "Get the $29 report",
    checkoutNote: "Instant secure checkout · report prepared after payment",
  },
  {
    slug: "one-question-reading",
    stripePriceEnv: "STRIPE_PRICE_QUESTION",
    name: "AI Voice Reading + 90 Days",
    price: 99,
    priceLabel: "$99",
    oneLine: "An AI voice guide for a complete Cardology reading, follow-up questions, and daily cards by phone.",
    bestFor: "People who want to talk through their cards now and return with new questions over the next 90 days.",
    deliverable: "Phone access to an AI reading guide for the full reading, relationship lookups, timing questions, and daily cards.",
    turnaround: "Available by phone as soon as checkout is complete.",
    includes: [
      "Complete birth card and ruling-card reading",
      "Unlimited return calls for 90 days",
      "Relationship and compatibility lookups",
      "Current timing and daily-card questions",
    ],
    cta: "Unlock the AI voice guide",
    href: "/unlock",
    checkoutNote: "Instant secure checkout · call from the phone number used at checkout",
  },
  {
    slug: "full-deep-dive",
    stripePriceEnv: "STRIPE_PRICE_DEEP",
    name: "Full Deep Dive Reading",
    price: 199,
    priceLabel: "$199",
    oneLine: "The complete Cardology map: birth card, ruling card, timing, relationships, and recurring dynamics.",
    bestFor: "Clients who want the richest personal and relational map with a fuller explanation of how the system fits together.",
    deliverable: "Expanded written deep dive covering core pattern, ruling-card expression, timing, compatibility themes, work/love/money patterns, and integration prompts.",
    turnaround: "Delivered digitally after intake details are confirmed.",
    includes: [
      "Full birth card and ruling-card interpretation",
      "Shadow, alignment, support karma, and challenge karma",
      "Timing and relationship-pattern notes",
      "Integration practices and follow-up prompts",
    ],
    cta: "Book the $199 deep dive",
    checkoutNote: "Instant secure checkout · intake right after payment",
  },
];

export function readingOfferHref(offer: ReadingOffer): string {
  return offer.href ?? `/checkout/${offer.slug}`;
}

export function offerBySlug(slug: string): ReadingOffer | undefined {
  return READING_OFFERS.find((o) => o.slug === slug);
}
