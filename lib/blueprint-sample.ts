// Frozen, engine-generated sample for the Personal Card Blueprint sales page.
// Source birthdate used only to compute the sample: 1990-06-15 (fictional demo).
// Never present this as a real customer's report.

import type { BlueprintReport } from "./blueprint";

export const SAMPLE_BLUEPRINT_LABEL = "Sample Blueprint";
export const SAMPLE_BLUEPRINT_BIRTHDATE_DISPLAY = "Example birthday: June 15";

/** Public-safe sample: same structure as a paid report, clearly labeled sample. */
export const SAMPLE_BLUEPRINT: BlueprintReport = {
  birthdate: "sample",
  birthCard: "2♦",
  birthCardTitle: "The Financial Partner",
  birthCardSlug: "2-of-diamonds",
  rulingCard: "J♠",
  rulingCardTitle: "The Messenger of Truth",
  rulingCardSlug: "jack-of-spades",
  suitDomain: "Value/Resource Patterns",
  coreIdentity:
    "You name the exchange out loud and keep it fair for both sides. You understand value exchange and partnership in material terms. You're good at splitting bills, sharing assets, creating fair deals. Your mind works in reciprocity.",
  gifts: [
    "Natural understanding of fair exchange",
    "Ability to create balanced partnerships around resources",
    "Diplomatic skill in financial negotiations",
    "Talent for making partnerships feel equitable",
  ],
  shadow:
    "You give the better end of the deal to keep the partnership. The short end becomes a habit, then a grudge.",
  rulingIdentity:
    "You name what is actually happening and you remain after you have said it. You have the gift of saying what needs to be said, even when it's hard. You're the one who speaks up when others stay silent.",
  rulingShadow:
    "You say the hard thing and leave. The fact lands; the repair does not, because you are already gone.",
  currentChapter: {
    planet: "Venus",
    domain: "relationships, values, love",
    card: "8♦",
    meaning: "8 OF DIAMONDS",
    balanced:
      "You run the money system in the open and you can explain the call.",
    under:
      "You step back from resource leadership. Power looks dangerous, so you leave it on the table.",
    over: "You use money to keep people in line. The ledger becomes a hierarchy.",
  },
  yearAhead: [
    { planet: "Mercury", domain: "mind, communication, perception", card: "8♣", cardSlug: "8-of-clubs", meaning: "8 OF CLUBS", balanced: "You run a knowledge system other people can follow, and you stand behind the call.", active: false },
    { planet: "Venus", domain: "relationships, values, love", card: "8♦", cardSlug: "8-of-diamonds", meaning: "8 OF DIAMONDS", balanced: "You run the money system in the open and you can explain the call.", active: true },
    { planet: "Mars", domain: "action, drive, assertion, conflict", card: "A♥", cardSlug: "ace-of-hearts", meaning: "ACE OF HEARTS", balanced: "You start real connection on purpose: you say what you feel and leave room for the other person to answer.", active: false },
    { planet: "Jupiter", domain: "expansion, growth, opportunity, abundance", card: "4♠", cardSlug: "4-of-spades", meaning: "4 OF SPADES", balanced: "You build enough container that change can happen without the floor disappearing.", active: false },
    { planet: "Saturn", domain: "structure, limits, discipline, karma", card: "2♠", cardSlug: "2-of-spades", meaning: "2 OF SPADES", balanced: "You hold two pressures at once and still make a call that can live in the world.", active: false },
    { planet: "Uranus", domain: "disruption, innovation, sudden change", card: "8♥", cardSlug: "8-of-hearts", meaning: "8 OF HEARTS", balanced: "You hold the emotional room without taking it over. People know where they stand.", active: false },
    { planet: "Neptune", domain: "dissolution, dreams, spirituality, surrender", card: "K♥", cardSlug: "king-of-hearts", meaning: "KING OF HEARTS", balanced: "You hold emotional authority without hiding behind it.", active: false },
  ],
  yearlySignals: {
    longRange: { card: "9♣", cardSlug: "9-of-clubs" },
    pluto: { card: "2♣", cardSlug: "2-of-clubs", meaning: null },
    result: { card: "J♣", cardSlug: "jack-of-clubs", meaning: null },
    environment: { card: "A♦", cardSlug: "ace-of-diamonds" },
    displacement: { card: "6♣", cardSlug: "6-of-clubs" },
  },
  reflectionPrompts: [
    'Where did the "The Financial Partner" pattern take over last month, and what were you protecting?',
    "The 8♦ is governing this stretch of your year through relationships, values, love. What would the balanced version look like this week?",
    "Your ruling layer (J♠) is how people first meet you. When has that worked against what your core card (2♦) actually wanted?",
  ],
};
