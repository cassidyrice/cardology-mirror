// Canonical on-page personal reading offer (Cass, 2026-11):
// Single unified product: The Card Blueprint Reading ($99).
// Zero external Stan Store redirects. Once paid on-page via Stripe Embedded Checkout,
// the buyer receives an instant Suggested Questions Guide download plus 48-hour access
// to ask up to 3 questions (solo timing, work, blind spots, or two-person compatibility),
// each personally reviewed by Cass and delivered by email or text message.

export const CARD_BLUEPRINT_READING_HREF = "/#readings";
// Aliases kept so any caller importing these constants lands on the unified reading section.
export const TIMING_MAP_HREF = CARD_BLUEPRINT_READING_HREF;
export const CHEMISTRY_CHECK_HREF = CARD_BLUEPRINT_READING_HREF;

export const READING_FOLLOW_UP =
  "Every question is drafted against your exact Cardology spread, personally reviewed and approved by Cass, and delivered privately by email or text message.";
export const READING_SUPPORT_EMAIL = "52xseven@mail.grokbot.com";
export const READING_RESPONSE_TIME =
  "48-hour response window per question — almost all readings arrive in under 24 hours.";

export type ManualReading = {
  id: "card-blueprint-reading";
  title: string;
  price: string;
  amountCents: 9900;
  href: string;
  checkoutHref: string;
  who: string;
  description: string;
  includes: readonly string[];
  delivery: string;
};

export const READINGS_NAV: readonly ManualReading[] = [
  {
    id: "card-blueprint-reading",
    title: "The Card Blueprint Reading",
    price: "$99",
    amountCents: 9900,
    href: CARD_BLUEPRINT_READING_HREF,
    checkoutHref: CARD_BLUEPRINT_READING_HREF,
    who: "Up to 3 questions over 48 hours · Solo or two birthdays",
    description:
      "Pay once on this page, get an instant download of Suggested Questions, and ask any question you want — right at checkout or anytime during your 48-hour Reading Pass (up to 3 questions per order). Bring your own birthday for timing and career, or add a second birthday on any question for relationship chemistry.",
    includes: [
      "Instant Suggested Questions Guide (.pdf) right after payment",
      "48-hour access pass after purchase to ask up to 3 questions (any topic or second person)",
      "Cass personally reviews your Life, Ruling, and 52-day spreads for every answer",
    ],
    delivery:
      "Delivered by email or text message within 48 hours — almost all under 24 hours.",
  },
];
