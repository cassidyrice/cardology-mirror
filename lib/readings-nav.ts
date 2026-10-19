// Manual reading prices and scope approved by Cass on 2026-10-18.
// 2026-10-18: stripped down to the Chemistry Check, the one reading the report builder can make.
export const CHEMISTRY_CHECK_URL = "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u";

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
    checkoutHref: CHEMISTRY_CHECK_URL,
    who: "For two people",
    description: "Explore both people’s cards: shared strengths, recurring friction, and a question worth bringing into your next conversation.",
    includes: ["Both people’s core cards", "Shared strengths and recurring friction", "Your current seasons and where your years cross"],
  },
];
