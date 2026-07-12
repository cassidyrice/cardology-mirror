import GENERATED_BLOG_POSTS from "./generated-blog-posts.json";

export type BlogPillarSlug =
  | "cardology-foundations"
  | "birth-card-meanings"
  | "timing-and-spreads"
  | "relationships-and-practice";

export type BlogLink = {
  label: string;
  href: string;
  note?: string;
};

export type BlogSection = {
  heading: string;
  body: string[];
  links?: BlogLink[];
};

export type BlogFaq = {
  q: string;
  a: string;
};

export type BlogGlossaryItem = {
  term: string;
  definition: string;
  href?: string;
};

export type BlogPillar = {
  slug: BlogPillarSlug;
  title: string;
  shortTitle: string;
  description: string;
  searchIntent: string;
  answer: string;
  definition: string;
  startHere: BlogLink[];
  relatedTools: BlogLink[];
  relatedVideos: BlogLink[];
  glossary: BlogGlossaryItem[];
  faqs: BlogFaq[];
  coreLinks: BlogLink[];
};

export type BlogPost = {
  slug: string;
  pillar: BlogPillarSlug;
  title: string;
  seoTitle?: string;
  description: string;
  dek: string;
  datePublished: string;
  dateModified: string;
  readTime: string;
  keywords: string[];
  answer: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
  related: string[];
  coreLinks: BlogLink[];
};

export const BLOG_UPDATED = "2026-07-12";

const GENERATED_POSTS = GENERATED_BLOG_POSTS as BlogPost[];

export const BLOG_PILLARS: BlogPillar[] = [
  {
    slug: "cardology-foundations",
    title: "Cardology Foundations",
    shortTitle: "Foundations",
    description:
      "Plain-English guides to the deck, suits, ranks, court cards, and the difference between Cardology, astrology, tarot, and fortune telling.",
    searchIntent: "People who are trying to understand what Cardology is before calculating a birth card.",
    answer:
      "Cardology maps a birthday to one playing card through fixed deck-calendar math. That card becomes a pattern language for people, relationships, timing, and recurring behavior.",
    definition:
      "Cardology is a 52-card symbolic system that connects birthdays, suits, ranks, and card positions into a language for reading people and dynamics.",
    startHere: [
      { label: "What Is Cardology?", href: "/what-is-cardology" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
    ],
    relatedTools: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "Methodology", href: "/methodology" },
    ],
    relatedVideos: [
      { label: "Cardology Video Library", href: "/videos", note: "Shadow-reading films and explainers." },
    ],
    glossary: [
      { term: "Birth card", definition: "The fixed playing card assigned to a birthday.", href: "/birth-card-calculator" },
      { term: "Suit", definition: "The life domain of a card: Hearts, Diamonds, Clubs, or Spades." },
      { term: "Rank", definition: "The movement or pattern of a card, from Ace through King." },
      { term: "Pattern language", definition: "Cardology vocabulary for behavior, relationships, timing, and repeating dynamics." },
    ],
    faqs: [
      { q: "Where should beginners start?", a: "Start with What Is Cardology, then calculate your birth card and read the matching card meaning page." },
      { q: "Is Cardology fortune telling?", a: "Cardology is strongest as pattern language for real people, relationship dynamics, and timing." },
      { q: "Do Cardology cards change every year?", a: "The birth card is fixed by birthday. Timing layers can change, but the birth card assignment does not." },
    ],
    coreLinks: [
      { label: "What Is Cardology?", href: "/what-is-cardology" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
    ],
  },
  {
    slug: "birth-card-meanings",
    title: "Birth Card Meanings",
    shortTitle: "Birth Cards",
    description:
      "Educational articles about life cards, birth cards, ruling cards, rank families, suits, and how to read a card without turning it into a fixed identity.",
    searchIntent: "People who know their card, or are searching card-by-card meanings and birthday meanings.",
    answer:
      "A birth card meaning explains how one fixed playing card combines rank, suit, and pattern language. Read it as a range: balanced, under-expressed, and over-expressed.",
    definition:
      "A birth card is the playing card assigned to a birthday in the Cardology calendar system.",
    startHere: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "How to Read a Birth Card Meaning", href: "/blog/how-to-read-birth-card-meaning" },
    ],
    relatedTools: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "Birth Card vs Ruling Card", href: "/birth-card-vs-ruling-card" },
      { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
    ],
    relatedVideos: [
      { label: "Cardology Birth-Card Videos", href: "/videos", note: "Watch card-specific shadow readings." },
    ],
    glossary: [
      { term: "Birth card", definition: "The fixed card assigned to a birthday.", href: "/birth-card" },
      { term: "Ruling card", definition: "A secondary card layer that colors the birth card expression.", href: "/birth-card-vs-ruling-card" },
      { term: "Sweet spot", definition: "The balanced expression of a card pattern." },
      { term: "Shadow", definition: "The distorted or protective expression of a card pattern.", href: "/shadow-karma-guide" },
    ],
    faqs: [
      { q: "How do I find my birth card?", a: "Use the birth card calculator, then open the matching card meaning page for deeper interpretation." },
      { q: "Can one card explain a whole person?", a: "No single card explains everything, but a birth card can give a strong pattern lens for behavior, relationship dynamics, and recurring choices." },
      { q: "Should I read my ruling card too?", a: "Yes. The birth card is the anchor; the ruling card can explain the way that anchor expresses." },
    ],
    coreLinks: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "Birth Card vs Ruling Card", href: "/birth-card-vs-ruling-card" },
      { label: "Queen of Hearts Meaning", href: "/birth-card/queen-of-hearts" },
    ],
  },
  {
    slug: "timing-and-spreads",
    title: "Timing and Spreads",
    shortTitle: "Timing",
    description:
      "Guides to 52-day periods, planetary stages, yearly spreads, daily card prompts, and timing language treated as reflection rather than prediction.",
    searchIntent: "People searching for current Cardology timing, yearly spreads, or how card periods work.",
    answer:
      "Cardology timing uses period cards, planetary stages, and daily cards as reflection prompts for a chapter of time. It should frame better questions, not predict events.",
    definition:
      "A Cardology timing page explains how a card can describe the theme of a current period, year, or spread position.",
    startHere: [
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
      { label: "52-Day Periods in Cardology", href: "/blog/52-day-periods-in-cardology" },
      { label: "Planetary Periods Without Prediction", href: "/blog/planetary-periods-without-prediction" },
    ],
    relatedTools: [
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
      { label: "Methodology", href: "/methodology" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
    ],
    relatedVideos: [
      { label: "Cardology Timing Videos", href: "/videos", note: "Video explainers connected to card periods and reflection." },
    ],
    glossary: [
      { term: "52-day period", definition: "A segment of the Cardology year used as timing language.", href: "/52-day-period-meaning-tool" },
      { term: "Planetary period", definition: "A timing layer that filters a card through a planet-like domain." },
      { term: "Life Spread", definition: "A card spread used to organize relationships between cards and timing positions." },
      { term: "Daily card", definition: "A one-day reflection prompt, not a guarantee of events." },
    ],
    faqs: [
      { q: "Do period cards predict what will happen?", a: "Period cards name the tone of a chapter: pressure, opportunity, friction, and what wants attention." },
      { q: "What is a 52-day period?", a: "It is a segment of the Cardology year associated with a card and used to frame a chapter of reflection." },
      { q: "Should I use timing without my birth card?", a: "You can, but timing is clearer when connected back to the birth card and ruling-card context." },
    ],
    coreLinks: [
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
      { label: "What Is Cardology?", href: "/what-is-cardology" },
    ],
  },
  {
    slug: "relationships-and-practice",
    title: "Relationships and Practice",
    shortTitle: "Practice",
    description:
      "Practical guides for compatibility, karma cards, work, money, love, journaling, and using Cardology as an honest pattern language.",
    searchIntent: "People who want Cardology applied to relationships, decisions, and real-life reflection.",
    answer:
      "Cardology compatibility compares two birth cards to name shared language, friction, attraction, and growth edges. It is a relationship-pattern tool, not a soulmate score.",
    definition:
      "A Cardology practice page applies card meanings to relationships, work, money, journaling, and real-world reflection.",
    startHere: [
      { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
      { label: "Cardology Compatibility", href: "/cardology-compatibility" },
      { label: "Compatibility Beginner Guide", href: "/blog/cardology-compatibility-beginner-guide" },
    ],
    relatedTools: [
      { label: "Birth Card Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
      { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
    ],
    relatedVideos: [
      { label: "Cardology Practice Videos", href: "/videos", note: "Videos for shadow, karma, compatibility, and reflection." },
    ],
    glossary: [
      { term: "Compatibility", definition: "A comparison of two card patterns and their shared language or friction.", href: "/cardology-compatibility" },
      { term: "Same suit", definition: "Two cards that lead from the same life domain." },
      { term: "Different suits", definition: "Two cards that lead from different domains and may need translation." },
      { term: "Karma card", definition: "A card relationship that can highlight support, challenge, repetition, or growth.", href: "/shadow-karma-guide" },
    ],
    faqs: [
      { q: "Can Cardology decide if two people belong together?", a: "No. Compatibility pages name patterns and friction points; real relationships require real-world context." },
      { q: "Does same suit mean better compatibility?", a: "No. Same suit can feel familiar, but it can also amplify similar blind spots." },
      { q: "Can Cardology be used for work or money questions?", a: "It can offer reflection prompts, but it should not replace professional financial, legal, career, or medical advice." },
    ],
    coreLinks: [
      { label: "Cardology Compatibility", href: "/cardology-compatibility" },
      { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
      { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
    ],
  },
];

export const CORE_BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-cardology-is-and-is-not",
    pillar: "cardology-foundations",
    title: "What Cardology Is and Is Not",
    description:
      "A clear guide to what Cardology means, how it differs from astrology and tarot, and how the 52-card system reads people, timing, and relationship dynamics.",
    dek: "Start here if you want the system without the fog: fixed birthday math, real-person interpretation, and practical use.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "6 min read",
    keywords: ["what is cardology", "cardology meaning", "cardology vs astrology", "cardology vs tarot"],
    answer:
      "Cardology is a symbolic system that maps each birthday to a playing card through fixed calendar math. The card becomes a pattern language for real people, relationship dynamics, timing, and recurring behavior.",
    sections: [
      {
        heading: "The simplest definition",
        body: [
          "Cardology reads the standard deck as a calendar. There are 52 cards, 52 weeks, four suits, and thirteen ranks in each suit. The system assigns a birth card to each date, then uses the card's rank, suit, and position as a vocabulary for personality, timing, relationship patterns, and recurring choices.",
          "The calculation layer is fixed. If two people enter the same birthday into the same Cardology system, they should get the same birth card. Interpretation begins after the card is known: suit, rank, ruling-card tone, shadow range, timing, and the people involved.",
        ],
        links: [
          { label: "Read the full method page", href: "/what-is-cardology" },
          { label: "Calculate a birth card", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "What it is not",
        body: [
          "Cardology is not medical cardiology, greeting-card collecting, or a tarot spread. It also does not need random draws to produce a birth card. The birthday is the input and the card is the output.",
          "A card is not proof of destiny. It is a structured pattern map: a specific description you can compare against actual behavior, relationship dynamics, and repeated choices.",
        ],
      },
      {
        heading: "Where it becomes useful",
        body: [
          "The system becomes useful when you apply it to a real person. A Queen of Hearts means more when you can see who mothers the room, who manages emotion, who gives too much, and who quietly expects love to be returned in a very specific form.",
          "Start with the card meaning, then compare it with the actual person: how they love, spend, communicate, work, lead, avoid pressure, and repeat the same dynamic with different people.",
        ],
        links: [
          { label: "Browse all card meanings", href: "/birth-card" },
          { label: "Learn 52-card astrology", href: "/52-card-astrology-explained" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is Cardology the same as astrology?",
        a: "No. Cardology and astrology both use birth data, but Cardology maps a birthday to a playing card through a fixed deck-calendar system.",
      },
      {
        q: "Does Cardology predict the future?",
        a: "Timing cards name the pressure, opportunity, friction, and focus of a season. They are strongest when they help you recognize the chapter you are already in.",
      },
      {
        q: "Do I need to believe in Cardology for it to be useful?",
        a: "No. You can treat a card meaning as a structured prompt and keep only what clarifies something real.",
      },
    ],
    related: [
      "four-suits-in-cardology",
      "birth-card-vs-ruling-card-how-to-read-both",
      "52-day-periods-in-cardology",
    ],
    coreLinks: [
      { label: "What Is Cardology?", href: "/what-is-cardology" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
    ],
  },
  {
    slug: "four-suits-in-cardology",
    pillar: "cardology-foundations",
    title: "The Four Suits in Cardology: Hearts, Diamonds, Clubs and Spades",
    seoTitle: "Four Suits in Cardology",
    description:
      "Learn what the four suits mean in Cardology and how hearts, diamonds, clubs, and spades shape a birth card reading.",
    dek: "The suit is the first domain signal: emotion, value, mind, or work.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "7 min read",
    keywords: ["cardology suits", "hearts diamonds clubs spades meaning", "cardology hearts", "cardology spades"],
    answer:
      "In Cardology, hearts describe emotion and relationship, diamonds describe value and resources, clubs describe mind and communication, and spades describe work, will, health, and transformation.",
    sections: [
      {
        heading: "Why suits matter",
        body: [
          "A card's rank tells you the type of movement. Its suit tells you where that movement tends to play out. A Five of Hearts and a Five of Spades can both carry change, but one tends to move through love and belonging while the other moves through work, health, pressure, and effort.",
          "This is why suit language is one of the fastest ways to make a card meaning practical. Before you ask whether a card is good or difficult, ask which domain it is asking you to notice.",
        ],
      },
      {
        heading: "The four domains",
        body: [
          "Hearts point to love, family, feeling, memory, and emotional exchange. Diamonds point to values, money, taste, security, and what a person treats as worth keeping. Clubs point to speech, ideas, learning, nervous energy, and interpretation. Spades point to labor, body, responsibility, endurance, and transformation.",
          "No suit is better than another. Each can be centered, under-expressed, or overplayed. The useful reading is not the label. It is where the label helps you catch a pattern.",
        ],
        links: [
          { label: "All hearts cards", href: "/birth-card#hearts" },
          { label: "All diamonds cards", href: "/birth-card#diamonds" },
          { label: "All clubs cards", href: "/birth-card#clubs" },
          { label: "All spades cards", href: "/birth-card#spades" },
        ],
      },
      {
        heading: "How to use suit language in a reading",
        body: [
          "Start with the suit as the arena, then let the rank narrow the question. For example, a Seven asks about trust, refinement, or spiritual pressure. In hearts, that question often appears through emotional safety. In diamonds, it often appears through worth. In clubs, it appears through mental certainty. In spades, it appears through discipline and surrender.",
          "This keeps Cardology from becoming vague. A suit turns a card meaning into a concrete area of life.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the most important suit in Cardology?",
        a: "There is no most important suit. The relevant suit is the one attached to the birth card, ruling card, period card, or compatibility pattern you are reading.",
      },
      {
        q: "Can two cards have the same rank but different meanings?",
        a: "Yes. The rank gives a shared pattern, but the suit changes the life domain where that pattern expresses.",
      },
      {
        q: "Are red cards easier than black cards?",
        a: "Not reliably. Red and black can describe polarity, but every card has balanced and distorted expressions.",
      },
    ],
    related: [
      "card-rank-meanings-aces-through-kings",
      "how-to-find-your-birth-card",
      "cardology-for-work-love-and-money",
    ],
    coreLinks: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
    ],
  },
  {
    slug: "card-rank-meanings-aces-through-kings",
    pillar: "birth-card-meanings",
    title: "Card Rank Meanings in Cardology: Aces Through Kings",
    description:
      "A practical guide to what Aces, Twos, Threes, Fours, Fives, Sixes, Sevens, Eights, Nines, Tens, Jacks, Queens, and Kings mean in Cardology.",
    dek: "Rank gives the pattern; suit gives the arena.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "8 min read",
    keywords: ["cardology ranks", "aces in cardology", "jacks queens kings cardology", "cardology face value"],
    answer:
      "In Cardology, rank describes the style of movement within a suit: Aces initiate, Twos relate, Threes diversify, Fours stabilize, Fives change, Sixes balance, Sevens refine, Eights intensify, Nines complete, Tens express, Jacks experiment, Queens mature, and Kings master.",
    sections: [
      {
        heading: "Aces through Tens",
        body: [
          "Aces start. Twos pair. Threes multiply options. Fours build structure. Fives move. Sixes answer for balance. Sevens refine and test faith. Eights concentrate power. Nines complete and release. Tens externalize the suit at scale.",
          "Those are starting points, not finished meanings. A Ten of Clubs is not simply a Ten plus clubs. It is a large public expression of mind, communication, and knowledge. A Ten of Hearts is large emotional visibility and group connection. The rank sets the motion and the suit tells you the field.",
        ],
        links: [
          { label: "Browse birth cards by suit", href: "/birth-card" },
          { label: "Calculate your card first", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "Court cards",
        body: [
          "Jacks, Queens, and Kings need special care because they can sound flattering and still be hard to live. Jacks are creative, youthful, flexible, and sometimes evasive. Queens carry refinement, service, influence, and emotional or intellectual stewardship. Kings carry mastery, authority, completion, and the pressure to use power cleanly.",
          "A useful court-card reading asks how the person handles influence. Does the card mature into service and clarity, or does it hide behind charm, control, or superiority?",
        ],
      },
      {
        heading: "How rank helps internal linking",
        body: [
          "Rank gives you a way to compare cards across suits. Someone reading the Five of Hearts may also want to compare the Five of Diamonds, Five of Clubs, and Five of Spades to understand what change looks like in love, money, mind, and work.",
          "That comparison is where the deck starts teaching itself. The same number repeats, but the life domain changes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is rank more important than suit?",
        a: "No. Rank and suit need each other. Rank gives the movement; suit gives the life domain.",
      },
      {
        q: "Why are court cards hard to interpret?",
        a: "Court cards describe mature social energies such as influence, service, creativity, and authority. Those can be gifts or distortions depending on how they are used.",
      },
      {
        q: "Should I read every card with the same rank?",
        a: "Yes, if you want pattern fluency. Comparing the same rank across suits is one of the fastest ways to understand Cardology.",
      },
    ],
    related: [
      "four-suits-in-cardology",
      "how-to-read-birth-card-meaning",
      "birth-card-vs-ruling-card-how-to-read-both",
    ],
    coreLinks: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "Ace of Spades Meaning", href: "/birth-card/ace-of-spades" },
      { label: "King of Diamonds Meaning", href: "/birth-card/king-of-diamonds" },
    ],
  },
  {
    slug: "how-to-find-your-birth-card",
    pillar: "birth-card-meanings",
    title: "How to Find Your Birth Card",
    description:
      "Use a birth card calculator or fixed Cardology birthday math to find the card assigned to your birthday.",
    dek: "A birth card is not chosen. It is calculated from the month and day.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "5 min read",
    keywords: ["find my birth card", "birth card calculator", "cardology birthday card", "what card am I"],
    answer:
      "The easiest way to find your Cardology birth card is to enter your birth date into a birth card calculator. The result is fixed by month and day, so the same birthday maps to the same card every year.",
    sections: [
      {
        heading: "Use the calculator first",
        body: [
          "Most people do not need to hand-calculate their birth card. A reliable calculator is faster and reduces simple arithmetic errors. Enter the month, day, and year if the tool also returns ruling-card context.",
          "The birth card itself is determined by the month and day. The year can matter for other timing layers, but the fixed birth-card assignment does not change from one year to the next.",
        ],
        links: [
          { label: "Open the Birth Card Calculator", href: "/birth-card-calculator" },
          { label: "Browse all birth-card meanings", href: "/birth-card" },
        ],
      },
      {
        heading: "Then read the card page",
        body: [
          "Finding the card is only the first step. The meaning page explains the card's suit, rank, balanced pattern, under-expression, over-expression, strengths, shadow, work themes, relationship themes, and birth dates.",
          "A calculator result by itself is thin. The meaning comes alive when you compare the card with behavior, relationships, and the other people in the pattern.",
        ],
      },
      {
        heading: "Common mistakes",
        body: [
          "The most common mistake is confusing birth card with ruling card. The birth card is the core birthday assignment. The ruling card is a secondary layer tied to astrological rulership and can change the tone of expression.",
          "Another mistake is reading the card as a fixed identity. Read it as a range of expression: centered, under-expressed, and over-expressed.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does my birth card change every year?",
        a: "No. Your birth card is calculated from your birth month and day, so it stays the same.",
      },
      {
        q: "Do I need my birth time?",
        a: "No. A Cardology birth card does not require birth time.",
      },
      {
        q: "What should I read after finding my card?",
        a: "Read the specific card meaning, then compare it with the ruling-card explanation and compatibility pages.",
      },
    ],
    related: [
      "birth-card-vs-ruling-card-how-to-read-both",
      "how-to-read-birth-card-meaning",
      "what-cardology-is-and-is-not",
    ],
    coreLinks: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
    ],
  },
  {
    slug: "birth-card-vs-ruling-card-how-to-read-both",
    pillar: "birth-card-meanings",
    title: "Birth Card vs Ruling Card: How to Read Both",
    description:
      "Understand the difference between a Cardology birth card and planetary ruling card, and learn how to use both without confusing them.",
    dek: "The birth card names the core pattern. The ruling card colors how that pattern expresses.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "6 min read",
    keywords: ["birth card vs ruling card", "planetary ruling card", "cardology ruling card", "birth card meaning"],
    answer:
      "A birth card is the fixed card assigned to your birthday. A planetary ruling card is a secondary card that colors the expression of that birth card through zodiac rulership.",
    sections: [
      {
        heading: "The core distinction",
        body: [
          "The birth card is the baseline. It describes the central pattern assigned to the birthday in the Cardology calendar. The ruling card is a modifier. It can explain why two people with the same birth card do not always feel or behave the same.",
          "A clean reading starts with the birth card, then checks the ruling card for tone, emphasis, and contradiction.",
        ],
        links: [
          { label: "Read the full comparison page", href: "/birth-card-vs-ruling-card" },
          { label: "Find both cards", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "How to read them together",
        body: [
          "Ask the birth card question first: what pattern keeps repeating? Then ask the ruling-card question: how does the person express, defend, or personalize that pattern?",
          "If the cards seem to disagree, do not force them into one sentence. The tension is often the point. One card may describe the deeper operating system while the other describes the social style or visible behavior.",
        ],
      },
      {
        heading: "Why this helps compatibility",
        body: [
          "Compatibility readings become more useful when you compare both layers. Two birth cards may share a suit while the ruling cards introduce friction. Or the birth cards may clash while the ruling cards make communication easier.",
          "That is why a compatibility reading needs both cards, not a single score.",
        ],
        links: [
          { label: "Compatibility guide", href: "/cardology-compatibility" },
          { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
        ],
      },
    ],
    faqs: [
      {
        q: "Which card is more important?",
        a: "Start with the birth card. Use the ruling card as a second layer, not a replacement.",
      },
      {
        q: "Can two people share a birth card but have different ruling cards?",
        a: "Yes. That is one reason two people with the same birth card can express it differently.",
      },
      {
        q: "Does the ruling card change over time?",
        a: "The natal planetary ruling card does not change, but timing cards and yearly cards can add temporary layers.",
      },
    ],
    related: [
      "how-to-find-your-birth-card",
      "cardology-compatibility-beginner-guide",
      "planetary-periods-without-prediction",
    ],
    coreLinks: [
      { label: "Birth Card vs Ruling Card", href: "/birth-card-vs-ruling-card" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
    ],
  },
  {
    slug: "how-to-read-birth-card-meaning",
    pillar: "birth-card-meanings",
    title: "How to Read a Birth Card Meaning Without Making It Fate",
    description:
      "A practical method for reading any Cardology birth card as a pattern map for people, behavior, and relationship dynamics.",
    dek: "Read the card as a range: centered, under-expressed, and over-expressed.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "7 min read",
    keywords: ["birth card meaning", "how to read cardology", "cardology interpretation", "cardology shadow"],
    answer:
      "Read a birth card meaning by separating the fixed card structure from the interpretation. Start with suit and rank, then test the balanced, under-expressed, and over-expressed patterns against real behavior.",
    sections: [
      {
        heading: "Start with the card structure",
        body: [
          "The structure is simple: rank, suit, and sometimes position in a spread. This part is stable. A Queen of Hearts is always a Queen in hearts. The interpretation can be broad or narrow depending on the reader.",
          "A good reading explains the structure before it interprets the person. First the card, then the behavior.",
        ],
      },
      {
        heading: "Use three positions",
        body: [
          "Use three positions because they make a card practical. The sweet spot is the centered expression. Under-expression is where the pattern is withheld, avoided, or dimmed. Over-expression is where the same pattern becomes too loud or controlling.",
          "This is more useful than asking whether a card is positive or negative. Every card can clarify or distort depending on how it is lived.",
        ],
        links: [
          { label: "All birth-card meanings", href: "/birth-card" },
          { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
        ],
      },
      {
        heading: "Turn the meaning into a test",
        body: [
          "After reading the meaning, ask three grounded questions: where does this pattern repeat, which people bring it out, and where does it become too much or not enough? If the answer is specific, the card is useful. If the answer is vague, keep reading or set it down.",
          "The reader should leave with language they can test in a real week: who brings the pattern out, where it helps, and where it starts running the room.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I accept every birth card description?",
        a: "No. Treat the description as a prompt. Keep what clarifies and discard what does not match lived behavior.",
      },
      {
        q: "Why do some card meanings sound intense?",
        a: "Card meanings often describe both gifts and distortions. Intensity usually comes from the over-expressed side of a card.",
      },
      {
        q: "Can a card meaning change?",
        a: "The card does not change, but the way a person lives the card can mature over time.",
      },
    ],
    related: [
      "card-rank-meanings-aces-through-kings",
      "four-suits-in-cardology",
      "daily-card-reading-as-journal-prompt",
    ],
    coreLinks: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
    ],
  },
  {
    slug: "52-day-periods-in-cardology",
    pillar: "timing-and-spreads",
    title: "52-Day Periods in Cardology",
    description:
      "Learn what a 52-day period means in Cardology and how to use period cards as timing language without turning them into predictions.",
    dek: "A period card frames a chapter. It should not pretend to know the ending.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "6 min read",
    keywords: ["52-day period cardology", "cardology period meaning", "yearly spread cardology", "current card period"],
    answer:
      "A 52-day period is a segment of the Cardology year associated with a timing card. It can be used as a reflective frame for the current chapter, not as certainty about what will happen.",
    sections: [
      {
        heading: "What a period card does",
        body: [
          "A period card narrows attention. Instead of asking what your whole life means, it asks what kind of pattern might be active in this part of the year. That makes timing language more useful and less grandiose.",
          "Period meanings work like chapter titles. They help you notice the terrain: what is active, what is pressured, and what keeps asking for attention.",
        ],
        links: [
          { label: "Use the 52-Day Period Tool", href: "/52-day-period-meaning-tool" },
          { label: "Learn the 52-card system", href: "/52-card-astrology-explained" },
        ],
      },
      {
        heading: "How to read a period",
        body: [
          "Start with the card's suit. That tells you the life domain likely asking for attention. Then read the rank as the type of movement: beginning, pairing, choice, structure, change, balance, refinement, power, completion, expression, experiment, stewardship, or mastery.",
          "Then ask what is actually happening. The point is not to bend reality to fit the card. The point is to see whether the card gives you a cleaner question.",
        ],
      },
      {
        heading: "The no-forecast rule",
        body: [
          "A period card can say, 'this is a useful time to examine values.' It should not say, 'you will receive money on Thursday.' The first statement is a reflective frame. The second is false certainty.",
          "Keep it practical. A timing card should give you a cleaner question, not a fake promise.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long is a Cardology period?",
        a: "A common Cardology yearly rhythm divides the year into seven 52-day periods.",
      },
      {
        q: "Can a period card predict events?",
        a: "Period cards describe timing themes: pressure, focus, opportunity, friction, and what wants attention.",
      },
      {
        q: "Should I read my birth card before period cards?",
        a: "Yes. The birth card gives baseline context. Period cards add temporary timing language.",
      },
    ],
    related: [
      "planetary-periods-without-prediction",
      "daily-card-reading-as-journal-prompt",
      "what-cardology-is-and-is-not",
    ],
    coreLinks: [
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
    ],
  },
  {
    slug: "planetary-periods-without-prediction",
    pillar: "timing-and-spreads",
    title: "Planetary Periods Without Prediction",
    description:
      "A grounded way to understand Cardology planetary periods, yearly spreads, and timing stages without using them as fortune telling.",
    dek: "Timing language is strongest when it gives a question, not a verdict.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "6 min read",
    keywords: ["cardology planetary periods", "planetary stages cardology", "yearly spread cardology", "cardology timing"],
    answer:
      "Planetary periods in Cardology are timing stages that add tone and emphasis to a card reading. They are best used to name the pressure, relationship theme, or chapter a person is moving through.",
    sections: [
      {
        heading: "What planetary language adds",
        body: [
          "Planetary language gives timing cards a second layer. A card in a Venus-like period may raise questions about attraction, values, and relationship. A Saturn-like period may raise questions about discipline, consequence, structure, and repair.",
          "The planet is not the event. It is the lens through which the period card may become easier to understand.",
        ],
      },
      {
        heading: "Why timing works better as pattern context",
        body: [
          "The useful question is not whether a page can promise a specific event. The useful question is whether the timing card helps you recognize the chapter sooner: the pressure, the person, the attachment, the choice, or the pattern trying to repeat.",
          "Keep the language practical: what is the pressure, where is the choice, and which pattern is trying to repeat?",
        ],
        links: [
          { label: "Read about 52-day periods", href: "/blog/52-day-periods-in-cardology" },
          { label: "Use the period tool", href: "/52-day-period-meaning-tool" },
        ],
      },
      {
        heading: "A practical reading sequence",
        body: [
          "First, identify the birth card. Second, identify the active period card. Third, read the planetary tone as a question. Fourth, write down what is actually happening. Fifth, compare the card language against the week instead of forcing the week to obey the card.",
          "This sequence keeps timing useful and emotionally clean.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are planetary periods the same as astrology transits?",
        a: "No. Cardology planetary periods are part of the card system's timing language, not a live sky transit calculation.",
      },
      {
        q: "Why use planets at all?",
        a: "Planet names give shorthand for recurring life themes such as value, structure, drive, communication, and growth.",
      },
      {
        q: "Can planetary periods help with journaling?",
        a: "Yes. They can give a focused question for the current chapter.",
      },
    ],
    related: [
      "52-day-periods-in-cardology",
      "daily-card-reading-as-journal-prompt",
      "birth-card-vs-ruling-card-how-to-read-both",
    ],
    coreLinks: [
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
      { label: "What Is Cardology?", href: "/what-is-cardology" },
    ],
  },
  {
    slug: "daily-card-reading-as-journal-prompt",
    pillar: "timing-and-spreads",
    title: "Using a Daily Card Reading as a Journal Prompt",
    description:
      "How to use a daily Cardology card as a grounded writing prompt for reflection, pattern recognition, and weekly review.",
    dek: "The strongest daily reading is short, specific, and checked against the actual day.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "5 min read",
    keywords: ["daily card reading", "cardology journal prompt", "daily cardology", "cardology reflection"],
    answer:
      "Use a daily card reading as a journal prompt by turning the card into one question for the day, then reviewing whether that question clarified anything by evening.",
    sections: [
      {
        heading: "Keep it small",
        body: [
          "A daily reading should not try to explain your whole life. It should give one clean question. If the card is a Diamond, the question might involve value, attention, spending, or self-worth. If it is a Club, the question might involve language, interpretation, or what you keep rehearsing mentally.",
          "Small questions are easier to test. That makes the daily card more useful than a dramatic forecast.",
        ],
      },
      {
        heading: "Three prompts that work",
        body: [
          "Ask: what is this card asking me to notice today? Where might I underplay this pattern? Where might I overplay it? Those three prompts work with any card because they do not require belief. They require observation.",
          "At the end of the day, write two lines: what actually happened, and whether the card language was useful. That review loop is where the learning happens.",
        ],
        links: [
          { label: "Read birth-card meanings", href: "/birth-card" },
          { label: "Use the period tool", href: "/52-day-period-meaning-tool" },
        ],
      },
      {
        heading: "Weekly review",
        body: [
          "After seven days, look for repeated suits and repeated themes. Are all the prompts landing in relationship, money, thinking, or work? Are you seeing more under-expression or over-expression?",
          "This is how a symbolic system becomes practical: not by being dramatic, but by making repeated behavior easier to name.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I pull a random daily card?",
        a: "Cardology starts with deterministic card timing rather than random draws, but a prompt only becomes useful when you test it against real experience.",
      },
      {
        q: "How long should a daily card journal entry be?",
        a: "Two to five sentences is enough. The goal is pattern recognition, not performance.",
      },
      {
        q: "What if the card does not fit the day?",
        a: "Write that down. A miss is still useful information if it keeps the reading honest.",
      },
    ],
    related: [
      "52-day-periods-in-cardology",
      "how-to-read-birth-card-meaning",
      "cardology-for-work-love-and-money",
    ],
    coreLinks: [
      { label: "All 52 Birth Cards", href: "/birth-card" },
      { label: "52-Day Period Meaning Tool", href: "/52-day-period-meaning-tool" },
    ],
  },
  {
    slug: "cardology-compatibility-beginner-guide",
    pillar: "relationships-and-practice",
    title: "Cardology Compatibility: A Beginner Guide",
    description:
      "Learn how Cardology compatibility compares birth cards, Life Path cards, shared roles, and relationship dynamics without reducing a relationship to a score.",
    dek: "Compatibility is a way to read attraction, friction, support, blind spots, shared cards, and the roles two people keep playing.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "7 min read",
    keywords: ["cardology compatibility", "birth card compatibility", "relationship cardology", "cardology love cards"],
    answer:
      "Cardology compatibility compares birth cards, ruling-card context, Life Path roles, shared cards, and pattern interaction. It names attraction, friction, shared language, blind spots, and why a relationship feels the way it does.",
    sections: [
      {
        heading: "Start with both birth cards",
        body: [
          "The first step is simple: calculate both birth cards. This gives each person's baseline pattern. If the cards share a suit, they may understand the same life domain quickly. If they differ, the relationship may require translation between emotional, material, mental, or work-centered instincts.",
          "This is only the beginning. Same-suit does not mean easy forever, and different suits do not mean impossible.",
        ],
        links: [
          { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
          { label: "Cardology Compatibility", href: "/cardology-compatibility" },
        ],
      },
      {
        heading: "Add the Life Path layer",
        body: [
          "The deeper read comes from the Life Spread. Each person carries a Moon support card plus 13 Life Path cards: Birth, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Princess, Prince, Queen, and King.",
          "When another person's birth card lands in one of those positions, the relationship takes that role. A Venus hit can feel beloved or magnetic. A Mars hit can create heat and conflict. A Saturn hit can feel like a lesson. A Neptune hit can turn dreamy or confusing. A Pluto hit exposes shadow.",
        ],
        links: [
          { label: "Life Path Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
        ],
      },
      {
        heading: "Look for language, not permission",
        body: [
          "A compatibility reading should give people better language for what they already experience. It might show why one person processes through conversation while another processes through action. It might show why money, attention, family, power, timing, or responsibility become recurring pressure points.",
          "The point is not to flatten the relationship into a yes/no answer. The point is to see the dynamic clearly enough that both people stop fighting the wrong problem.",
        ],
      },
      {
        heading: "Use card meanings as context",
        body: [
          "After comparing the pair, read each card individually. A relationship pattern makes more sense when you understand what each person is trying to protect, express, or avoid.",
          "Read the individual cards after the comparison. The relationship is not separate from the people inside it.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can Cardology tell if two people are soulmates?",
        a: "Compatibility is not a soulmate verdict. It names patterns that help two people understand attraction, friction, support, and blind spots.",
      },
      {
        q: "Is same-suit compatibility always better?",
        a: "No. Same suit can feel familiar, but it can also amplify the same blind spots.",
      },
      {
        q: "Should I compare ruling cards too?",
        a: "Yes. Ruling cards can explain expression, attraction, and daily style that the birth card alone may not show.",
      },
      {
        q: "What does it mean if we share Life Path cards?",
        a: "Shared Life Path cards show that both people are carrying the same card in different roles. One person may carry a card as Venus while the other carries it as Saturn, Pluto, or King, which changes the feel of the dynamic.",
      },
    ],
    related: [
      "birth-card-vs-ruling-card-how-to-read-both",
      "karma-cards-environment-and-displacement",
      "four-suits-in-cardology",
    ],
    coreLinks: [
      { label: "Cardology Compatibility", href: "/cardology-compatibility" },
      { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
    ],
  },
  {
    slug: "karma-cards-environment-and-displacement",
    pillar: "relationships-and-practice",
    title: "Karma Cards: Environment and Displacement",
    description:
      "A grounded explanation of karma cards in Cardology, including environment, displacement, support, pressure, and repeated lessons.",
    dek: "Karma cards are most useful when they describe learning edges, not cosmic punishment.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "6 min read",
    keywords: ["karma cards cardology", "environment card", "displacement card", "cardology karma"],
    answer:
      "Karma cards in Cardology are related cards that can describe gifts, challenges, repeated lessons, or pressure patterns. Environment is often read as a natural support, while displacement is often read as a growth edge.",
    sections: [
      {
        heading: "Use karma language carefully",
        body: [
          "Karma language can become heavy fast. A cleaner reading does not tell someone they deserve a problem. It asks what pattern keeps returning and what kind of maturity the card might be asking for.",
          "Environment and displacement are useful because they point to two different relationships with energy: what comes more naturally and what asks for integration.",
        ],
      },
      {
        heading: "Environment as support",
        body: [
          "The environment card can be read as a field of support, ease, or familiar energy. It may describe a talent, ally pattern, or lesson that feels close to the person's operating system.",
          "That does not mean it is always easy. A gift still has to be handled well.",
        ],
      },
      {
        heading: "Displacement as growth edge",
        body: [
          "The displacement card can be read as a pressure point. It may show where the person meets resistance, overcompensates, or has to learn humility, discipline, trust, directness, or restraint.",
          "The goal is not fear. The goal is cleaner language for the place where a pattern asks to mature.",
        ],
        links: [
          { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
          { label: "All birth-card meanings", href: "/birth-card" },
        ],
      },
    ],
    faqs: [
      {
        q: "Are karma cards bad?",
        a: "No. Karma cards can describe both support and challenge. They are not a moral sentence.",
      },
      {
        q: "What is an environment card?",
        a: "An environment card is often read as a supportive or familiar card relationship in the Life Spread.",
      },
      {
        q: "What is a displacement card?",
        a: "A displacement card is often read as a pressure pattern or growth edge that asks for maturity.",
      },
    ],
    related: [
      "cardology-compatibility-beginner-guide",
      "how-to-read-birth-card-meaning",
      "planetary-periods-without-prediction",
    ],
    coreLinks: [
      { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
    ],
  },
  {
    slug: "cardology-for-work-love-and-money",
    pillar: "relationships-and-practice",
    title: "Cardology for Work, Love and Money",
    description:
      "How to use Cardology card meanings for work style, love patterns, money pressure, values, and self-trust.",
    dek: "A card meaning becomes practical when it points to a real domain of choice.",
    datePublished: BLOG_UPDATED,
    dateModified: BLOG_UPDATED,
    readTime: "7 min read",
    keywords: ["cardology work", "cardology love", "cardology money", "cardology practical guide"],
    answer:
      "Cardology applies to work, love, and money by reading the card's suit and rank as pattern language: how a person contributes, attaches, values, protects, spends, gives, withholds, and handles pressure.",
    sections: [
      {
        heading: "Work",
        body: [
          "Spades often speak most directly to work, health, effort, and responsibility, but every suit can show up in work. Hearts may show care labor and belonging. Diamonds may show value, compensation, and business judgment. Clubs may show teaching, writing, planning, and communication.",
          "A useful work reading asks where the person naturally contributes and where the same pattern burns out or over-controls.",
        ],
      },
      {
        heading: "Love",
        body: [
          "Love readings should be handled with restraint. A card can name attachment style, emotional timing, attraction pattern, or communication friction. It cannot decide what someone should do with their relationship.",
          "Use love-card language to ask better questions: what do I seek, what do I avoid, what do I repeat, and what would honesty look like here?",
        ],
        links: [
          { label: "Compatibility guide", href: "/cardology-compatibility" },
          { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
        ],
      },
      {
        heading: "Money and value",
        body: [
          "Diamonds are the most obvious suit for money, but money is rarely only money. It can involve safety, taste, power, self-worth, responsibility, attention, and exchange. A Diamond card may ask what a person values, not just what they earn.",
          "The useful question is where the money pattern lives: earning, receiving, charging, saving, spending, giving, status, taste, security, or fear.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can Cardology give career advice?",
        a: "It can suggest patterns and questions about work style, but it should not replace professional career, financial, legal, or medical advice.",
      },
      {
        q: "Which suit is about money?",
        a: "Diamonds most directly relate to values, resources, money, and exchange.",
      },
      {
        q: "Which suit is about love?",
        a: "Hearts most directly relate to emotion, family, love, and belonging.",
      },
    ],
    related: [
      "four-suits-in-cardology",
      "cardology-compatibility-beginner-guide",
      "daily-card-reading-as-journal-prompt",
    ],
    coreLinks: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "All 52 Birth Cards", href: "/birth-card" },
    ],
  },
];

export const BLOG_POSTS: BlogPost[] = [...CORE_BLOG_POSTS, ...GENERATED_POSTS];

export function allBlogPillars(): BlogPillar[] {
  return BLOG_PILLARS;
}

export function allBlogPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function blogPillarBySlug(slug: string): BlogPillar | null {
  return BLOG_PILLARS.find((pillar) => pillar.slug === slug) ?? null;
}

export function blogPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function blogPostsForPillar(slug: BlogPillarSlug): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.pillar === slug);
}

export function relatedBlogPosts(post: BlogPost): BlogPost[] {
  return post.related
    .map((slug) => blogPostBySlug(slug))
    .filter((candidate): candidate is BlogPost => Boolean(candidate));
}

export function blogPostPath(post: BlogPost): string {
  return `/blog/${post.slug}`;
}

export function blogPillarPath(pillar: BlogPillar): string {
  return `/blog/pillar/${pillar.slug}`;
}

export function allBlogPaths(): string[] {
  return [
    "/blog",
    ...BLOG_PILLARS.map((pillar) => blogPillarPath(pillar)),
    ...BLOG_POSTS.map((post) => blogPostPath(post)),
  ];
}
