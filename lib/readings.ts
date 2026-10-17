// The two Card Blueprints readings, sold on Stan Store
// (https://stan.store/mycardblueprint). Each is a PDF emailed within 3 days;
// nothing here is fulfilled automatically.

export type ReadingItem = { label: string; text: string };
export type ReadingPart = { title: string; items: readonly ReadingItem[] };
export type Reading = {
  id: "card-blueprint-reading" | "chemistry-check";
  name: string;
  price: string;
  who: string;
  hook: string;
  parts: readonly ReadingPart[];
  delivery: string;
  url: string;
};

export const STAN_STORE_URL = "https://stan.store/mycardblueprint";

export const READINGS: readonly Reading[] = [
  {
    id: "card-blueprint-reading",
    name: "The Card Blueprint Reading",
    price: "$300",
    who: "You + one important person",
    hook: "Your birth card, your year ahead, and one relationship, read from the cards of your birthday. A personal 20–30 page PDF made from your own birth date, not a template with your name dropped in.",
    parts: [
      {
        title: "What’s included",
        items: [
          { label: "Your Blueprint", text: "Your birth card, your ruling card, your lifetime Gift and Challenge cards, and your King card." },
          { label: "Your 12-Month Map", text: "This year’s spread, read across your seven 52-day planetary periods, with the dates for each one, plus the year’s Pluto and Result cards." },
          { label: "One relationship chemistry check", text: "A partner, a parent or a child: where your cards meet, where they pull, and how to work with it." },
          { label: "One week of follow-up questions", text: "For seven days after delivery, email any question about your reading, as often as you like." },
        ],
      },
    ],
    delivery: "Emailed as a PDF within 3 days of purchase, with the Deal Your Own Blueprint bonus guide attached.",
    url: STAN_STORE_URL,
  },
  {
    id: "chemistry-check",
    name: "The Chemistry Check",
    price: "$27",
    who: "For two people",
    hook: "Two birthdays. Two cards. How you really fit. A one-page reading of you and one other person: a partner, crush, friend, parent or child.",
    parts: [
      {
        title: "What’s included",
        items: [
          { label: "Both birth cards", text: "What each says about how you love and connect." },
          { label: "How your cards connect", text: "The core link between you." },
          { label: "One strength and one friction point", text: "What to lean into together, what to watch, and how to work with it." },
        ],
      },
    ],
    delivery: "Your one-page Chemistry Check is emailed within 3 days of purchase.",
    url: STAN_STORE_URL,
  },
];
