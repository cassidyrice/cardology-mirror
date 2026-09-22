import {
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
  DEEP_DIVE_PRODUCT_PATH,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";
import { CONTACT_EMAIL } from "@/lib/site";

export const FAQ_PATH = "/faq" as const;

export type FaqLink = {
  href: string;
  label: string;
};

export type FaqItem = {
  id: string;
  question: string;
  /** Plain text. The visible answer and the FAQPage acceptedAnswer are this same string. */
  answer: string;
  links: readonly FaqLink[];
};

export type FaqSection = {
  id: string;
  title: string;
  items: readonly FaqItem[];
};

function readingAnswer(): string {
  if (
    !DEEP_DIVE_FULFILLMENT.includes(ONE_QUESTION_TURNAROUND) ||
    !DEEP_DIVE_FULFILLMENT.includes(DEEP_DIVE_PRICE_LABEL)
  ) {
    throw new Error("One Question Reading fulfillment drifted from the public price and minute SLA");
  }
  return DEEP_DIVE_FULFILLMENT;
}

export const FAQ_SECTIONS: readonly FaqSection[] = [
  {
    id: "cardology",
    title: "Cardology, cardiology, and tarot",
    items: [
      {
        id: "what-is-cardology",
        question: "What is Cardology?",
        answer:
          "Cardology maps a birthday to one card in a standard 52-card playing deck (not tarot). That card is pattern language for personality, compatibility, and timing. The same birthday always returns the same card. It is not cardiology, and it is not a fate prediction.",
        links: [{ href: "/what-is-cardology", label: "What is Cardology" }],
      },
      {
        id: "cardology-vs-cardiology",
        question: "Is Cardology the same as cardiology?",
        answer:
          "No. Cardiology is heart medicine. Cardology is a birthday-to-playing-card map (52-card deck, not tarot). The same birthday always yields the same card.",
        links: [{ href: "/what-is-cardology", label: "What is Cardology" }],
      },
      {
        id: "cardology-vs-tarot",
        question: "How is Cardology different from tarot?",
        answer:
          "Cardology uses a 52-card playing deck and locks your birth card to your birthday with fixed math. Tarot uses a 78-card deck and usually starts with a shuffle. A tarot birth-card pair is not the same object as a Cardology playing-card birth card.",
        links: [
          { href: "/cardology-vs-tarot", label: "Cardology vs tarot" },
          { href: "/cartomancy-vs-tarot", label: "Cartomancy vs tarot" },
        ],
      },
      {
        id: "cardology-and-cartomancy",
        question: "Is Cardology a form of cartomancy?",
        answer:
          "Yes. Cartomancy is the umbrella for reading cards. Tarot is one branch; playing-card reading is another. Cardology is the deterministic birthday branch of playing-card cartomancy.",
        links: [
          { href: "/cardology-vs-tarot", label: "Cardology vs tarot" },
          { href: "/cartomancy-vs-tarot", label: "Cartomancy vs tarot" },
        ],
      },
      {
        id: "does-cardology-predict",
        question: "Does Cardology predict the future?",
        answer:
          "No. Timing language describes pressure, focus, and chapter themes, not guaranteed events. The mapping is exact: the same birthday always produces the same card. The interpretations are pattern language for self-reflection, not a forecast.",
        links: [
          { href: "/what-is-cardology", label: "What is Cardology" },
          { href: "/methodology", label: "Methodology" },
        ],
      },
    ],
  },
  {
    id: "lookup",
    title: "Birth card lookup",
    items: [
      {
        id: "find-birth-card",
        question: "How do I find my birth card?",
        answer:
          "Enter a birthday in the free calculator. It returns the playing-card birth card and the planetary ruling card. The calculation runs in your browser. The calculator tracks anonymous start and completion events, but it does not send the birthday itself in those events.",
        links: [
          { href: "/birth-card-calculator", label: "Birth card calculator" },
          { href: "/birth-card", label: "All 52 card meanings" },
        ],
      },
      {
        id: "birth-year",
        question: "Does the year I was born change my birth card?",
        answer:
          "No. Your birth card depends only on month and day. The year is used for timing layers and yearly spreads, not for the birth card itself.",
        links: [{ href: "/birth-card-calculator", label: "Birth card calculator" }],
      },
      {
        id: "birth-vs-ruling",
        question: "What is the difference between a birth card and a ruling card?",
        answer:
          "The birth card is the core, lifelong significator, set by the birthday. The planetary ruling card is a second card, tied to the astrological sign, that colors how the birth card expresses. Some birthdays produce two ruling cards. Two people with the same birth card but different signs usually have different ruling cards.",
        links: [
          { href: "/birth-card-vs-ruling-card", label: "Birth card vs ruling card" },
          { href: "/planetary-ruling-card", label: "Planetary ruling card chart" },
        ],
      },
      {
        id: "leap-day-and-joker",
        question: "What card is February 29, and what about December 31?",
        answer:
          "February 29 maps to the 9 of Clubs. December 31 is the Joker, the one birthday outside the 52-card map.",
        links: [
          { href: "/birth-card-calculator", label: "Birth card calculator" },
          { href: "/birth-card/joker", label: "The Joker" },
        ],
      },
    ],
  },
  {
    id: "today",
    title: "Card of the day and /today",
    items: [
      {
        id: "card-of-the-day",
        question: "What is the card of the day?",
        answer:
          "It is calculated, not drawn. A fixed formula maps each month and day to one playing card, so the same date returns the same card every year, for every reader. December 31 is the formula's single exception and belongs to the Joker. The public page shows today's card.",
        links: [{ href: "/card-of-the-day", label: "Card of the day" }],
      },
      {
        id: "how-to-use-today",
        question: "How do I use /today?",
        answer:
          "Open /today. If this device has no saved birth date, the page asks you to create a local profile. With a profile, it calculates today's cards for that birthday: the active card, the birth-card lens, the ruling-card lens, the pressure pattern, and a grounded prompt. The public card of the day, which needs no profile, is a different page.",
        links: [
          { href: "/today", label: "Today" },
          { href: "/onboarding", label: "Create a local profile" },
          { href: "/card-of-the-day", label: "Card of the day" },
        ],
      },
    ],
  },
  {
    id: "products",
    title: "The reading, pricing, and turnaround",
    items: [
      {
        id: "one-question-reading",
        question: `What do I get for ${DEEP_DIVE_PRICE_LABEL}, and how fast does it arrive?`,
        answer: readingAnswer(),
        links: [{ href: DEEP_DIVE_PRODUCT_PATH, label: DEEP_DIVE_PRODUCT_NAME }],
      },
      {
        id: "good-question",
        question: "What makes a good question for the reading?",
        answer:
          "One decision, in real words. \"Should I take the job in Denver or stay put?\" reads better than \"career.\" \"Do I keep pushing this business or wind it down?\" reads better than \"money.\" A yes-or-no question is fine. The reading will not answer yes or no for you; it shows you which yes and which no you have been circling, and lets you pick.",
        links: [{ href: DEEP_DIVE_PRODUCT_PATH, label: DEEP_DIVE_PRODUCT_NAME }],
      },
      {
        id: "reading-is-not-a-forecast",
        question: "Will the reading tell me what to do, or what will happen?",
        answer:
          "No. It is a mirror, not a forecast. Same birthday, same cards, every time; what they mean beside your question is the part that takes a person. Nothing here predicts events, lucky days, or other people's choices.",
        links: [{ href: DEEP_DIVE_PRODUCT_PATH, label: DEEP_DIVE_PRODUCT_NAME }],
      },
      {
        id: "order-help",
        question: "How do I get help with an order?",
        answer: `Email ${CONTACT_EMAIL} for a purchase, a refund, or a correction, and include the purchase email. The contact page states how soon those emails are answered. The ${DEEP_DIVE_PRODUCT_NAME} itself is written within ${ONE_QUESTION_TURNAROUND} of payment.`,
        links: [
          { href: "/contact", label: "Contact" },
          { href: "/refund-policy", label: "Refund policy" },
        ],
      },
    ],
  },
  {
    id: "next",
    title: "Karma cards and a first step",
    items: [
      {
        id: "karma-cards",
        question: "What are karma cards in Cardology?",
        answer:
          "Each birth card sits in a fixed position in the Life Spread. Reading that position against the next spread returns two related cards: the Lifetime Gift, also called the Environment card, and the Lifetime Challenge, also called the Displacement card. Three Fixed cards (Jack of Hearts, 8 of Clubs, and King of Spades) have neither.",
        links: [{ href: "/karma-cards", label: "Karma cards" }],
      },
      {
        id: "where-to-start",
        question: "What do I need to start?",
        answer:
          "A birthday. You do not need a special deck to calculate a birth card; the free calculator does the math. After that, read the card meaning, then the ruling card, and test the language against a real week.",
        links: [
          { href: "/cardology-for-beginners", label: "Cardology for beginners" },
          { href: "/birth-card-calculator", label: "Birth card calculator" },
        ],
      },
    ],
  },
];

export function faqItems(sections: readonly FaqSection[] = FAQ_SECTIONS): readonly FaqItem[] {
  return sections.flatMap((section) => section.items);
}

export function buildFaqPageJsonLd(sections: readonly FaqSection[] = FAQ_SECTIONS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems(sections).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
