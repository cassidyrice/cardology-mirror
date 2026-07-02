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
      "Links to matching Cardology Pro pages",
    ],
    cta: "Get the $29 report",
  },
  {
    slug: "one-question-reading",
    stripePriceEnv: "STRIPE_PRICE_QUESTION",
    name: "One-Question Personal Reading",
    price: 99,
    priceLabel: "$99",
    oneLine: "A focused Cardology reading around one real person, relationship, or question.",
    bestFor: "People who already know the area they want clarity on: love, family, work, timing, money, compatibility, or a decision point.",
    deliverable: "Personal written reading that ties one question to the birth card, ruling card, shadow range, relationship pattern, and current timing layer.",
    turnaround: "Delivered digitally after question and birth details are confirmed.",
    includes: [
      "One focused client question about a person, relationship, or situation",
      "Birth card and ruling-card synthesis",
      "Current timing context when relevant",
      "Practical reflection steps",
    ],
    cta: "Book the $99 reading",
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
  },
];

export function readingOfferHref(offer: ReadingOffer): string {
  return `/checkout/${offer.slug}`;
}

export function offerBySlug(slug: string): ReadingOffer | undefined {
  return READING_OFFERS.find((o) => o.slug === slug);
}
