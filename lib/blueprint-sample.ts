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
    "You're the resource negotiator. You understand value exchange and partnership in material terms. You're good at splitting bills, sharing assets, creating fair deals. Your mind works in reciprocity.",
  gifts: [
    "Natural understanding of fair exchange",
    "Ability to create balanced partnerships around resources",
    "Diplomatic skill in financial negotiations",
    "Talent for making partnerships feel equitable",
  ],
  shadow:
    "You lose yourself in material partnerships. You give too much to maintain the relationship. You track what you've contributed and build resentment when it's not reciprocated. The pattern: you're the financial giver, but nobody gives back to you. You enable financial dependence under the guise of partnership. You're exhausted from carrying the weight.",
  rulingIdentity:
    "You're the messenger who brings difficult truths. You have the gift of saying what needs to be said, even when it's hard. You're the one who speaks up when others stay silent.",
  rulingShadow:
    "You deliver truth and disappear. You speak hard things and don't stay for the integration. Your honesty feels like attack. The pattern: you're the truth-teller, but people feel hurt by you. You inspire honesty by being hurtfully direct. You're brave about speaking but cowardly about relationship repair.",
  currentChapter: {
    planet: "Venus",
    domain: "relationships, values, love",
    card: "8♦",
    meaning: "8 OF DIAMONDS",
    balanced:
      "You're commanding financial systems with authority and integrity.",
    under:
      "You're financially withdrawn, afraid of power while avoiding resource leadership.",
    over: "You're financially controlling and power-hungry, seeing money as a tool for domination.",
  },
  reflectionPrompts: [
    'Where in the last month did you catch yourself in the "The Financial Partner" over-drive — and what were you actually protecting?',
    "The 8♦ is governing this stretch of your year through relationships, values, love. What would its balanced version ask of you this week?",
    "Your ruling layer (J♠) shapes how others first experience you. When has that expression worked against what your core card (2♦) actually wanted?",
  ],
};
