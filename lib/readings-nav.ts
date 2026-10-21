// Manual reading prices and scope approved by Cass on 2026-10-18.
// 2026-10-20: three offers — Timing Map $39, Chemistry Check $52, Family Snapshot $65.
// 2026-10-21: Cass added the $13 Birth Card Blueprint as the entry-level offer (a generated 7-page PDF).
export const BIRTH_CARD_BLUEPRINT_URL = "https://stan.store/mycardblueprint/p/birth-card-blueprint";
export const CHEMISTRY_CHECK_URL = "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u";
export const TIMING_MAP_URL = "https://stan.store/mycardblueprint/p/your-12month-timing-map";
export const FAMILY_SNAPSHOT_URL = "https://stan.store/mycardblueprint/p/the-family-snapshot";

/** Chemistry Check link tagged with where on the site the click came from, so Stan sales can be traced. */
export function stanUrl(base: string, medium: string, campaign: string): string {
  return `${base}?utm_source=cardblueprints&utm_medium=${medium}&utm_campaign=${campaign}`;
}

export function chemistryCheckUrl(medium: string, campaign: string): string {
  return stanUrl(CHEMISTRY_CHECK_URL, medium, campaign);
}

export const READING_FOLLOW_UP = "Includes seven days of email follow-up. Every response is personally reviewed and approved by Cass.";
export const READING_SUPPORT_EMAIL = "52xseven@mail.grokbot.com";
export const READING_RESPONSE_TIME = "You’ll receive a response within 24 hours.";

type ManualReading = {
  id: string;
  title: string;
  price: string;
  href: string;
  checkoutHref: string | null;
  who: string;
  description: string;
  includes: readonly string[];
  /** Optional wide product mockup (1600x1000), shown above the card text when set. */
  image?: string;
  /** Delivery line under the includes list. Defaults to the personally prepared reading line. */
  delivery?: string;
  /** Optional sample PDF linked from the offer card. */
  sampleHref?: string;
};

export const READINGS_NAV: readonly ManualReading[] = [
  {
    id: "birth-card-blueprint",
    title: "Birth Card Blueprint",
    price: "$13",
    href: "/#birth-card-blueprint",
    checkoutHref: stanUrl(BIRTH_CARD_BLUEPRINT_URL, "homepage", "offer_card"),
    who: "Just you · Start here",
    description: "Your birth card and your ruling card, in plain words: what you run on, where it slips, and one thing to do about it this week.",
    includes: ["Your birth card and your planetary ruling card", "Your strengths, your shadow, and notes on love and work", "A seven-day practice and three questions to sit with"],
    image: "/brand/mockups/birth-card-blueprint-wide.webp",
    delivery: "A 7-page PDF made from your birth date and emailed to you.",
    sampleHref: "/samples/birth-card-blueprint-sample.pdf",
  },
  {
    id: "timing-map",
    title: "The 12-Month Timing Map",
    price: "$39",
    href: "/#timing-map",
    checkoutHref: stanUrl(TIMING_MAP_URL, "homepage", "offer_card"),
    who: "Just you",
    description: "Your card’s next twelve months: the seasons ahead, when to push and when to wait, and the dates worth circling.",
    includes: ["Your core cards", "Your seasons across the next 12 months", "Key dates and a question for each season"],
    image: "/brand/mockups/timing-map-wide.webp",
  },
  {
    id: "chemistry-check",
    title: "The Chemistry Check",
    price: "$52",
    href: "/#chemistry-check",
    checkoutHref: chemistryCheckUrl("homepage", "offer_card"),
    who: "You plus one person",
    description: "Explore both people’s cards: shared strengths, recurring friction, and a question worth bringing into your next conversation.",
    includes: ["Both people’s core cards", "Shared strengths and recurring friction", "Your current seasons and where your years cross"],
    image: "/brand/mockups/chemistry-check-wide.webp",
  },
  {
    id: "family-snapshot",
    title: "The Family Snapshot",
    price: "$65",
    href: "/#family-snapshot",
    checkoutHref: stanUrl(FAMILY_SNAPSHOT_URL, "homepage", "offer_card"),
    who: "You plus two people",
    description: "Three people’s cards side by side: who steadies whom, where friction repeats, and how your years line up together.",
    includes: ["All three people’s core cards", "Pairwise strengths and friction", "Where the three of your years cross"],
    image: "/brand/mockups/family-snapshot-wide.webp",
  },
];
