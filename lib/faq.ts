import { READINGS_NAV, READING_FOLLOW_UP, READING_RESPONSE_TIME, READING_SUPPORT_EMAIL } from "./readings-nav";
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

export const FAQ_SECTIONS: readonly FaqSection[] = [
  {
    id: "cardology",
    title: "Cardology vs cardiology vs tarot",
    items: [
      {
        id: "what-is-cardology",
        question: "What is Cardology?",
        answer:
          "Cardology maps a birthday to one card in a standard 52-card playing deck. Playing cards, not tarot. That card is pattern language for personality, compatibility, and timing. Same birthday, same card. Every time. It is not cardiology. It is not a forecast either. Sorry.",
        links: [{ href: "/what-is-cardology", label: "What is Cardology" }],
      },
      {
        id: "cardology-vs-cardiology",
        question: "Is Cardology the same as cardiology?",
        answer:
          "No. Cardiology is heart medicine. Cardology is a birthday-to-playing-card map: 52-card deck, not tarot. One letter apart. Very different waiting rooms. The same birthday always yields the same card.",
        links: [{ href: "/what-is-cardology", label: "What is Cardology" }],
      },
      {
        id: "cardology-vs-tarot",
        question: "Cardology vs tarot: how are they different?",
        answer:
          "Cardology uses a 52-card playing deck. It locks your birth card to your birthday with fixed math. No shuffle. No redrawing until you like the answer. Tarot uses a 78-card deck and usually starts with a shuffle. A tarot birth-card pair is not the same object as a Cardology playing-card birth card.",
        links: [
          { href: "/cardology-vs-tarot", label: "Cardology vs tarot" },
          { href: "/cartomancy-vs-tarot", label: "Cartomancy vs tarot" },
        ],
      },
      {
        id: "cardology-and-cartomancy",
        question: "Is Cardology a form of cartomancy?",
        answer:
          "Yes. Cartomancy is the umbrella for reading cards. Tarot is one branch. Playing-card reading is another. Cardology is the deterministic birthday branch of playing-card cartomancy. The branch that does math instead of vibes.",
        links: [
          { href: "/cardology-vs-tarot", label: "Cardology vs tarot" },
          { href: "/cartomancy-vs-tarot", label: "Cartomancy vs tarot" },
        ],
      },
      {
        id: "does-cardology-predict",
        question: "Does Cardology predict the future?",
        answer:
          "No. Timing language describes pressure, focus, and chapter themes. Not promised events. The mapping is exact: the same birthday always produces the same card. The interpretation is pattern language for self-reflection. A mirror, not a forecast. You still make the choice.",
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
          "Type a birthday into the free calculator. Yours, or the one you keep checking. It returns the playing-card birth card and the planetary ruling card. The calculation runs in your browser. The calculator tracks anonymous start and completion events, but it does not send the birthday itself in those events.",
        links: [
          { href: "/birth-card-calculator", label: "Birth card calculator" },
          { href: "/birth-card", label: "All 52 card meanings" },
        ],
      },
      {
        id: "birth-year",
        question: "Does the year I was born change my birth card?",
        answer:
          "No. Your birth card depends only on month and day. Stop typing the year. The year is used for timing layers and yearly spreads. Not for the birth card itself.",
        links: [{ href: "/birth-card-calculator", label: "Birth card calculator" }],
      },
      {
        id: "birth-vs-ruling",
        question: "What is the difference between a birth card and a ruling card?",
        answer:
          "The birth card is the significator. Core. Lifelong. Set by the birthday. The planetary ruling card is a second card, tied to the astrological sign. It colors how the birth card shows up. Some birthdays produce two ruling cards. Two people with the same birth card but different signs usually have different ruling cards. Same core. Different outfit.",
        links: [
          { href: "/birth-card-vs-ruling-card", label: "Birth card vs ruling card" },
          { href: "/planetary-ruling-card", label: "Planetary ruling card chart" },
        ],
      },
      {
        id: "leap-day-and-joker",
        question: "What card is February 29, and what about December 31?",
        answer:
          "February 29 maps to the 9 of Clubs. December 31 is the Joker. The one birthday outside the 52-card map. Of course it is.",
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
          "It is calculated, not drawn. A fixed formula maps each month and day to one playing card. Same date, same card, every year, for every reader. You cannot reshuffle it. You can only read it. December 31 is the formula's single exception. It belongs to the Joker. The public page shows today's card.",
        links: [{ href: "/card-of-the-day", label: "Card of the day" }],
      },
      {
        id: "how-to-use-today",
        question: "How do I use /today?",
        answer:
          "Open /today. No saved birth date on this device? The page asks you to create a local profile. With a profile, it calculates today's cards for that birthday: the active card, the birth-card lens, the ruling-card lens, the pressure pattern, and one grounded prompt. Read the prompt. Then actually do it. The public card of the day needs no profile. It is a different page.",
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
    title: "Personal readings and support",
    items: [
      {
        id: "personal-readings",
        question: "What personal readings do you offer?",
        answer: "There are four. The Birth Card Blueprint ($13) is a 7-page PDF of your birth card and ruling card. It is made from your birth date and emailed to you. Cass personally prepares the other three. The 12-Month Timing Map ($19): just you. The Chemistry Check ($24): you plus one person. The Family Snapshot ($30): you plus two people. All delivered by email. Check the spam folder before you panic.",
        links: READINGS_NAV.map(reading => ({ href: reading.href, label: `${reading.title} · ${reading.price}` })),
      },
      {
        id: "personal-reading-follow-up",
        question: "Can I ask questions after my personal reading?",
        answer: `${READING_FOLLOW_UP} Email ${READING_SUPPORT_EMAIL} with questions about your reading. Even the one you think is dumb. ${READING_RESPONSE_TIME}`,
        links: [{ href: "/contact", label: "Reading support" }],
      },
      {
        id: "order-help",
        question: "How do I get help with an order or a past purchase?",
        answer: `For order administration, refunds, delivery issues, or corrections, email ${CONTACT_EMAIL} and include the purchase email. Questions about the content of your Chemistry Check go to ${READING_SUPPORT_EMAIL}. ${READING_RESPONSE_TIME}`,
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
          "Each birth card sits in a fixed position in the Life Spread. Read that position against the next spread and you get two related cards. The Lifetime Gift, also called the Environment card. The Lifetime Challenge, also called the Displacement card. Three Fixed cards have neither: Jack of Hearts, 8 of Clubs, and King of Spades. Fixed means fixed.",
        links: [{ href: "/karma-cards", label: "Karma cards" }],
      },
      {
        id: "where-to-start",
        question: "What do I need to start?",
        answer:
          "A birthday. That is the whole list. You do not need a special deck to calculate a birth card. The free calculator does the math. Then read the card meaning. Then the ruling card. Then test the language against a real week. Not the imaginary one where you answer every text.",
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
