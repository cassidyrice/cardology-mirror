// Manual reading prices and scope approved by Cass on 2026-10-18.
// 2026-10-20: three offers: Timing Map $19, Chemistry Check $24, Family Snapshot $30.
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
    description: "Your birth card and your ruling card, in plain words. What you run on. Where it slips. One thing to actually do about it this week.",
    includes: ["Your birth card and your planetary ruling card", "Your strengths. Your shadow. Notes on love and work.", "A seven-day practice and three questions you can’t scroll past"],
    image: "/brand/mockups/birth-card-blueprint-wide.webp",
    delivery: "A 7-page PDF built from your birth date. Emailed to you. No small talk.",
    sampleHref: "/samples/birth-card-blueprint-sample.pdf",
  },
  {
    id: "timing-map",
    title: "The 12-Month Timing Map",
    price: "$19",
    href: "/#timing-map",
    checkoutHref: stanUrl(TIMING_MAP_URL, "homepage", "offer_card"),
    who: "Just you",
    description: "Your card’s next twelve months. The seasons ahead. When to push. When to sit down. The dates worth circling.",
    includes: ["Your core cards", "Your seasons across the next 12 months", "Key dates, and one question per season you’ll want to dodge"],
    image: "/brand/mockups/timing-map-wide.webp",
  },
  {
    id: "chemistry-check",
    title: "The Chemistry Check",
    price: "$24",
    href: "/#chemistry-check",
    checkoutHref: chemistryCheckUrl("homepage", "offer_card"),
    who: "You plus the one you keep thinking about",
    description: "Both people’s cards, side by side. What you’re good at together. The fight you keep having. One question worth asking out loud next time.",
    includes: ["Both people’s core cards", "Shared strengths and the friction that keeps coming back", "Your current seasons and where your years cross"],
    image: "/brand/mockups/chemistry-check-wide.webp",
  },
  {
    id: "family-snapshot",
    title: "The Family Snapshot",
    price: "$30",
    href: "/#family-snapshot",
    checkoutHref: stanUrl(FAMILY_SNAPSHOT_URL, "homepage", "offer_card"),
    who: "You plus two people (yes, those two)",
    description: "Three people’s cards side by side. Who steadies whom. Where the same argument repeats. How your years line up, like it or not.",
    includes: ["All three people’s core cards", "Every pair: strengths and friction", "Where the three of your years cross"],
    image: "/brand/mockups/family-snapshot-wide.webp",
  },
];
