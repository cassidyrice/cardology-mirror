// Manual reading prices and scope approved by Cass on 2026-10-18.
// 2026-10-20: three offers — Timing Map $39, Chemistry Check $52, Family Snapshot $65.
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
};

export const READINGS_NAV: readonly ManualReading[] = [
  {
    id: "timing-map",
    title: "The 12-Month Timing Map",
    price: "$39",
    href: "/#timing-map",
    checkoutHref: stanUrl(TIMING_MAP_URL, "homepage", "offer_card"),
    who: "Just you",
    description: "Your card’s next twelve months: the seasons ahead, when to push and when to wait, and the dates worth circling.",
    includes: ["Your core cards", "Your seasons across the next 12 months", "Key dates and a question for each season"],
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
  },
];
