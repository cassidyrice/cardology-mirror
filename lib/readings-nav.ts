// Canonical on-page personal question readings (Cass, 2026-11).
// Zero external Stan Store redirects; zero PDF products.
// Buyer submits their birth date(s) + real question inline, chooses Email or Text delivery,
// pays on-page via Stripe Embedded Checkout, and Cass personally approves 1 of 3 drafted angles.

export const TIMING_MAP_HREF = "/#timing-map";
export const CHEMISTRY_CHECK_HREF = "/#chemistry-check";

export const READING_FOLLOW_UP =
  "Every reading is drafted against your exact Cardology spread, personally reviewed and approved by Cass, and delivered privately by email or text message.";
export const READING_SUPPORT_EMAIL = "52xseven@mail.grokbot.com";
export const READING_RESPONSE_TIME =
  "48-hour response window — almost all readings arrive in under 24 hours.";

export type ManualReading = {
  id: "timing-map" | "chemistry-check";
  title: string;
  price: string;
  amountCents: 2600 | 3900;
  href: string;
  checkoutHref: string;
  who: string;
  description: string;
  includes: readonly string[];
  delivery: string;
};

export const READINGS_NAV: readonly ManualReading[] = [
  {
    id: "timing-map",
    title: "The 12-Month Timing Map",
    price: "$26",
    amountCents: 2600,
    href: TIMING_MAP_HREF,
    checkoutHref: TIMING_MAP_HREF,
    who: "Just you · One real question on your year",
    description:
      "Bring your birth date and the decision, move, or timing question you keep circling. Cass reads your active 52-day planetary windows, Pluto pressure card, and Result card, then answers you directly.",
    includes: [
      "Your birth card, ruling card, and current age spread",
      "Your active and next 52-day planetary date windows",
      "A direct answer to your question with exact dates to circle",
    ],
    delivery:
      "Delivered by email or text message within 48 hours — almost all under 24 hours.",
  },
  {
    id: "chemistry-check",
    title: "The Chemistry Check",
    price: "$39",
    amountCents: 3900,
    href: CHEMISTRY_CHECK_HREF,
    checkoutHref: CHEMISTRY_CHECK_HREF,
    who: "You plus the person you keep thinking about",
    description:
      "Bring both birthdays and what you actually want to know. Cass maps where each of you sits in the other’s permanent spread, whether the pull runs one way or both, and the exact calendar dates your charts cross.",
    includes: [
      "Permanent Life & Ruling Spread seats in both directions",
      "Shared cards and overlapping 52-day timing windows",
      "A plain-spoken answer to your question — no destiny fluff",
    ],
    delivery:
      "Delivered by email or text message within 48 hours — almost all under 24 hours.",
  },
];
