// Manual reading prices and scope approved by Cass on 2026-10-18.
// The latest owner decision confirms Timing is for one person.
// All three URLs/prices were verified on their published Stan pages.
// Timing ordering stays disabled until Stan's one-person scope/intake update is approved.
export const STAN_STORE_URL = "https://stan.store/mycardblueprint";

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
};

export const READINGS_NAV: readonly ManualReading[] = [
  {
    id: "chemistry-check",
    title: "The Chemistry Check",
    price: "$39",
    href: "/#chemistry-check",
    checkoutHref: "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u",
    who: "For two people",
    description: "Explore both people’s cards: shared strengths, recurring friction, and a question worth bringing into your next conversation.",
    includes: ["Both people’s core cards", "Shared strengths and recurring friction", "Your current seasons and where your years cross"],
  },
  {
    id: "timing-map",
    title: "Your 12-Month Timing Map",
    price: "$49",
    href: "/#timing-map",
    checkoutHref: null,
    who: "For one person",
    description: "Your next twelve months, laid out in dated seasons, with your core cards, yearly themes, and questions to bring into your own life.",
    includes: ["Your core cards and yearly themes", "Dated seasons across the next twelve months", "Reflection prompts for the year ahead"],
  },
  {
    id: "family-snapshot",
    title: "The Family Snapshot",
    price: "$59",
    href: "/#family-snapshot",
    checkoutHref: "https://stan.store/mycardblueprint/p/the-family-snapshot",
    who: "Up to three people total",
    description: "Look at your family’s main dynamics through each person’s cards: where you find common ground, what keeps repeating, and what you might try differently.",
    includes: ["Core cards for up to three people", "Shared strengths, friction, and recurring family patterns", "Your current seasons and prompts for a different conversation"],
  },
];
