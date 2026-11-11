// Canonical Suggested Questions Guide for The Card Blueprint Reading ($99).
// Buyers get an instant PDF download right after checkout plus 1-tap chips in
// their 48-hour Reading Pass (limit: 3 questions per order — any custom question welcome).

export const SUGGESTED_QUESTIONS_PDF_PATH =
  "/downloads/card-blueprint-suggested-questions.pdf" as const;

export const SUGGESTED_QUESTIONS_FILENAME =
  "Card-Blueprint-Suggested-Questions.pdf" as const;

export type SuggestedQuestionCategory = {
  id: "timing" | "chemistry" | "work-money" | "blind-spots";
  eyebrow: string;
  title: string;
  note: string;
  requiresSecondPerson?: boolean;
  questions: readonly string[];
};

export const SUGGESTED_QUESTION_CATEGORIES: readonly SuggestedQuestionCategory[] = [
  {
    id: "timing",
    eyebrow: "01 · Timing & Your Next 12 Months",
    title: "When to push, when to wait, and what season you are actually in",
    note: "Uses your birth card, ruling card, active 52-day planetary periods, Pluto, and Result card.",
    questions: [
      "Which 52-day window in the next year is the cleanest stretch to make my biggest move — and which stretch should I treat as maintenance instead?",
      "Why does my current season feel stalled right now, and what exact date does the pressure shift?",
      "What is my Result card actually asking me to finish before my next birthday turn?",
      "I am weighing two timelines (moving now vs. waiting a few months). What do my upcoming 52-day periods say about each window?",
      "Where is my Pluto card putting pressure on my year, and what stops me from wasting the whole season fighting it?",
    ],
  },
  {
    id: "chemistry",
    eyebrow: "02 · Relationships & Two-Person Chemistry",
    title: "You plus one other birthday — romantic, ex, creative partner, or family",
    note: "Add their birth date on any of your 3 questions so Cass reads both spreads and your overlapping dates.",
    requiresSecondPerson: true,
    questions: [
      "Where do we actually sit in each other's permanent spreads — is this pull mutual or mostly running one way?",
      "We keep hitting the exact same wall under stress. What are our two birth cards doing in the room, and what breaks the loop?",
      "When do our 52-day timing charts cross over the next few months for an honest conversation without the usual static?",
      "Should I reach out in this window or hold my boundary and let their current period play out first?",
      "What is the real friction between our cards that we keep mislabeling as bad timing?",
    ],
  },
  {
    id: "work-money",
    eyebrow: "03 · Work, Money & Concrete Decisions",
    title: "Launches, job changes, pricing, exits, and commitments",
    note: "Best when you name the real decision on your desk instead of asking about career in the abstract.",
    questions: [
      "When is the strongest 52-day window this year to launch, pitch, or raise my rates — and what habit undercuts me there?",
      "I am deciding between staying where I am or taking a riskier path. How do my Long Range, Pluto, and Result cards frame that trade?",
      "What money or work reflex does my birth card default to under stress, and what clean rule fixes it this season?",
      "Which planetary period ahead favors signing, negotiating, or locking in a partnership — and which one calls for patience?",
      "What am I over-engineering in my work right now that my current 52-day card wants simplified?",
    ],
  },
  {
    id: "blind-spots",
    eyebrow: "04 · Blind Spots, Karma & Self-Sabotage",
    title: "The pattern you keep calling coincidence",
    note: "Reads your Birth Card, Ruling Card, Environment gift, Displacement cost, and Karma pair.",
    questions: [
      "What is the exact defense habit my birth card and ruling card run when I feel cornered — and what does the healthy version look like in plain behavior?",
      "How are my Environment and Displacement cards showing up in my current age chart?",
      "Where do I confuse control with safety, and what one move interrupts that pattern this month?",
      "Why do I keep attracting the same dynamic with a specific type of person, based on my permanent spread seats?",
      "If you only gave me one rule to follow for the rest of this 52-day period, what does my chart say it is?",
    ],
  },
] as const;

export const ALL_SUGGESTED_QUESTIONS: readonly string[] =
  SUGGESTED_QUESTION_CATEGORIES.flatMap((c) => c.questions);
