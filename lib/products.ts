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
};

export const READING_OFFERS: ReadingOffer[] = [
  {
    slug: "basic-birth-card-report",
    name: "Basic Birth Card Report",
    price: 29,
    priceLabel: "$29",
    oneLine: "A clean written report for your fixed birth card and ruling-card context.",
    bestFor: "New visitors who want their core Cardology structure without a live reading.",
    deliverable: "Written PDF-style report with birth card, ruling card, suit, rank, balanced expression, shadow range, and next-step links.",
    turnaround: "Delivered digitally after intake details are confirmed.",
    includes: [
      "Birth card and ruling-card calculation",
      "Plain-English meaning and shadow range",
      "Personal reflection prompts",
      "Links to matching Cardology Pro pages",
    ],
    cta: "Request the $29 report",
  },
  {
    slug: "one-question-reading",
    name: "One-Question Personal Reading",
    price: 99,
    priceLabel: "$99",
    oneLine: "A focused Cardology reading around one real question.",
    bestFor: "People who already know the area they want clarity on: love, work, timing, money, or a decision point.",
    deliverable: "Personal written reading that ties one question to the birth card, ruling card, shadow range, and current timing layer.",
    turnaround: "Delivered digitally after question and birth details are confirmed.",
    includes: [
      "One focused client question",
      "Birth card and ruling-card synthesis",
      "Current timing context when relevant",
      "Practical reflection steps",
    ],
    cta: "Book the $99 reading",
  },
  {
    slug: "full-deep-dive",
    name: "Full Deep Dive Reading",
    price: 199,
    priceLabel: "$199",
    oneLine: "The complete personal Cardology map: birth card, ruling card, timing, relationships, and practice.",
    bestFor: "Clients who want the richest personal mirror and a fuller explanation of how the system fits together.",
    deliverable: "Expanded written deep dive covering core pattern, ruling-card expression, timing, compatibility themes, work/love/money reflection, and integration prompts.",
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
  return `/contact?offer=${offer.slug}`;
}
