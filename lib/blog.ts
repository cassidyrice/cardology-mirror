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

export type BlogCitationStatus = "verified" | "flagged";

export type BlogCitation = {
  qid?: string | null;
  wikidataUrl?: string | null;
  wikipediaUrl?: string | null;
  wikipediaTitle?: string | null;
  birthDate?: string | null;
  dobCrosscheck: string;
  status: BlogCitationStatus;
  reason?: string;
  wikidataDates?: string[];
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
  citations?: BlogCitation;
};

export function isCelebrityBirthCardProfile(post: BlogPost): boolean {
  return (
    post.slug.endsWith("-birth-card-profile") ||
    post.keywords.includes("celebrity birth card profile")
  );
}

// Real publication date of the 12 hand-written core posts below: git history
// shows they shipped 2026-06-17 (commits 6019718..0da0d55) and their content
// has not materially changed since. There is deliberately no site-wide
// "updated" constant anymore: a moving constant stamped every post with a
// fake-fresh lastmod, which teaches crawlers to distrust the sitemap. Sitemap
// and feed freshness must come from each post's own datePublished /
// dateModified; when a core post's content actually changes, bump that post's
// dateModified by hand.
const CORE_POSTS_PUBLISHED = "2026-06-17";

const GENERATED_POSTS = GENERATED_BLOG_POSTS as BlogPost[];

export const BLOG_PILLARS: BlogPillar[] = [
  {
    slug: "cardology-foundations",
    title: "Cardology Foundations",
    shortTitle: "Foundations",
    description:
      "Plain-English Cardology guides to the deck, suits, ranks, and court cards. How it differs from astrology and fortune telling. Why it is not tarot.",
    searchIntent: "For people trying to work out what Cardology is before they calculate a birth card. Reasonable. Slightly suspicious. Good.",
    answer:
      "Cardology maps a birthday to one playing card through fixed deck-calendar math. No shuffle. That card becomes a pattern language for people, relationships, timing, and the behavior you keep repeating.",
    definition:
      "Cardology is a 52-card symbolic system. It connects birthdays, suits, ranks, and card positions into a language for reading people and the dynamics between them.",
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
      { label: "Cardology Video Library", href: "/videos", note: "Shadow-reading films and explainers. Headphones recommended." },
    ],
    glossary: [
      { term: "Birth card", definition: "The fixed playing card assigned to a birthday. It does not change when you do.", href: "/birth-card-calculator" },
      { term: "Suit", definition: "A card's life domain. Hearts, Diamonds, Clubs, or Spades." },
      { term: "Rank", definition: "A card's movement or pattern. Ace through King." },
      { term: "Pattern language", definition: "Cardology vocabulary for behavior, relationships, timing, and the dynamics you keep re-running." },
    ],
    faqs: [
      { q: "Where should beginners start?", a: "Start with What Is Cardology. Then calculate your birth card. Then read the matching card meaning page. In that order. Not all at 2am." },
      { q: "Is Cardology fortune telling?", a: "Cardology is strongest as pattern language for real people, relationship dynamics, and timing. It reads what you do. It does not schedule what happens to you." },
      { q: "Do Cardology cards change every year?", a: "The birth card is fixed by birthday. It stays. Timing layers can change. The birth card assignment does not. Neither, apparently, does your texting style." },
    ],
    coreLinks: [
      { label: "What Is Cardology?", href: "/what-is-cardology" },
      { label: "52-Card Astrology Explained", href: "/52-card-astrology-explained" },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
    ],
  },
  {
    slug: "birth-card-meanings",
    title: "What Is a Birth Card? Meanings",
    shortTitle: "Birth Cards",
    description:
      "What is a birth card? In Cardology, the playing card locked to your birthday. Guides to ruling cards, suits, and reading your card without flattering yourself.",
    searchIntent: "People asking what is a birth card. Or searching card-by-card meanings and birthday meanings at an hour they will not admit to.",
    answer:
      "A birth card is the one playing card assigned to a birthday in Cardology. Its meaning is rank plus suit, read as a range: balanced, under-expressed, over-expressed. You have probably done all three this week. It is not a tarot birth card. It is not a government birth-registration card.",
    definition:
      "A birth card is the playing card assigned to a birthday in the Cardology calendar system. One birthday. One card.",
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
      { label: "Cardology Birth-Card Videos", href: "/videos", note: "Card-specific shadow readings. Yours is probably in there." },
    ],
    glossary: [
      { term: "Birth card", definition: "The fixed card assigned to a birthday. Yours, permanently.", href: "/birth-card" },
      { term: "Ruling card", definition: "A second card layer. It colors how the birth card shows up.", href: "/birth-card-vs-ruling-card" },
      { term: "Sweet spot", definition: "The balanced expression of a card pattern. Rarer than you think." },
      { term: "Shadow", definition: "The distorted or protective expression of a card pattern. The version that shows up when you are tired.", href: "/shadow-karma-guide" },
    ],
    faqs: [
      { q: "What is a birth card?", a: "A birth card is the playing card locked to your birthday in Cardology. Same month and day, same card. Always. It is not a tarot birth-card pair. It is not a vital-records birth card either." },
      { q: "How do I find my birth card?", a: "Use the free Cardology birth card calculator. Then open the matching card meaning page for the deeper read. Then sit with it for a minute." },
      { q: "Can one card explain a whole person?", a: "No. No single card explains everything. A birth card can still give a strong pattern lens for behavior, relationship dynamics, and the choices you keep making." },
      { q: "Should I read my ruling card too?", a: "Yes. The birth card is the anchor. The ruling card can explain how that anchor shows up. Skip it and you have half a reading." },
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
      "Guides to 52-day periods, planetary stages, yearly spreads, and daily card prompts. Timing language for reflection, not prediction. Not a schedule.",
    searchIntent: "People searching for current Cardology timing, yearly spreads, or how card periods work. Usually because something is happening.",
    answer:
      "Cardology timing uses period cards, planetary stages, and daily cards as reflection prompts for a chapter of time. It frames better questions. It does not predict events. Stop asking it for dates.",
    definition:
      "A Cardology timing page explains how a card can describe the theme of a current period, year, or spread position. The theme. Not the plot.",
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
      { label: "Cardology Timing Videos", href: "/videos", note: "Video explainers on card periods and reflection. Watch, then think." },
    ],
    glossary: [
      { term: "52-day period", definition: "A segment of the Cardology year, used as timing language.", href: "/52-day-period-meaning-tool" },
      { term: "Planetary period", definition: "A timing layer. It filters a card through a planet-like domain." },
      { term: "Life Spread", definition: "A card spread that organizes relationships between cards and timing positions." },
      { term: "Daily card", definition: "A one-day reflection prompt. Not a promise of events." },
    ],
    faqs: [
      { q: "Do period cards predict events?", a: "No. Period cards name the tone of a chapter: pressure, opportunity, friction, and what wants your attention. The events are still your problem." },
      { q: "What is a 52-day period?", a: "A segment of the Cardology year tied to a card. It frames a chapter of reflection. Fifty-two days is long enough to notice a pattern. Short enough to deny it." },
      { q: "Should I use timing without my birth card?", a: "You can. Timing is clearer when you connect it back to your birth card and ruling-card context. Otherwise it is weather with no location." },
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
      "Practical guides for compatibility, karma cards, work, money, love, and journaling. Cardology as an honest pattern language. Honest means it is about you.",
    searchIntent: "People who want Cardology applied to relationships, decisions, and real-life reflection. Not theory. Their actual mess.",
    answer:
      "Cardology compatibility compares two birth cards. It names shared language, friction, attraction, and growth edges. It is a relationship-pattern tool. It is not a soulmate score. Put the screenshot down.",
    definition:
      "A Cardology practice page applies card meanings to relationships, work, money, journaling, and real-world reflection. The parts of life that do not fit in a group chat.",
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
      { label: "Cardology Practice Videos", href: "/videos", note: "Videos on shadow, karma, compatibility, and reflection. Bring a notebook." },
    ],
    glossary: [
      { term: "Compatibility", definition: "A comparison of two card patterns: their shared language, their friction.", href: "/cardology-compatibility" },
      { term: "Same suit", definition: "Two cards that lead from the same life domain." },
      { term: "Different suits", definition: "Two cards that lead from different domains. Translation may be required." },
      { term: "Karma card", definition: "A card relationship that can highlight support, challenge, repetition, or growth.", href: "/shadow-karma-guide" },
    ],
    faqs: [
      { q: "Can Cardology decide if two people belong together?", a: "No. Compatibility pages name patterns and friction points. Real relationships require real-world context. You already know what the context is." },
      { q: "Does same suit mean better compatibility?", a: "No. Same suit can feel familiar. It can also amplify the same blind spots. Two people missing the same thing, together." },
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
      "What Cardology is, how it differs from astrology, why it is playing cards, not tarot, and how 52 cards read people, timing and your repeat behavior.",
    dek: "Start here if you want the system without the fog. Fixed birthday math. Real people. Practical use. No incense required.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "6 min read",
    keywords: ["what is cardology", "cardology meaning", "cardology vs astrology", "cardology vs tarot"],
    answer:
      "Cardology is a symbolic system that maps each birthday to one playing card with fixed calendar math. Nobody shuffles. The card becomes a pattern language for real people, relationship dynamics, timing, and the thing you keep doing while calling it an accident.",
    sections: [
      {
        heading: "The simplest definition, before you overthink it",
        body: [
          "Cardology reads the standard deck as a calendar. 52 cards. 52 weeks. Four suits. Thirteen ranks in each suit. Every date gets a birth card. Then the card's rank, suit, and position become a vocabulary for personality, timing, relationship patterns, and the choices you keep making and then acting surprised about.",
          "The math is fixed. Two people, same birthday, same Cardology system, same birth card. No vibes at that step. Interpretation starts once the card is known: suit, rank, ruling-card tone, shadow range, timing, and the people in the room. That is the part where you get caught.",
        ],
        links: [
          { label: "Read the full method page", href: "/what-is-cardology" },
          { label: "Calculate a birth card", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "What it is not, for the record",
        body: [
          "Cardology is not medical cardiology. It is not greeting-card collecting. It is not a tarot spread. Nobody draws anything at random to get your birth card. Birthday in. Card out. That is the whole trick.",
          "A card is not proof of anything predetermined. It is a structured pattern map. A specific description you hold up against what you actually do, who you keep choosing, and the argument you have had nine times this year.",
        ],
      },
      {
        heading: "Where it becomes useful: other people",
        body: [
          "It gets useful the moment you aim it at a real person. A Queen of Hearts means more when you can see who mothers the room. Who manages everyone's feelings. Who gives too much. Who quietly expects love back in one very specific form and keeps score when it arrives wrong.",
          "Read the card meaning. Then look at the actual person. How they love, spend, talk, work, lead, dodge pressure. How they run the same dynamic with a new cast every two years and call it bad luck.",
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
        a: "No. Both use birth data. Cardology maps a birthday to a playing card through a fixed deck-calendar system. No sky chart. Just the deck.",
      },
      {
        q: "Does Cardology predict the future?",
        a: "Timing cards name the pressure, opportunity, friction, and focus of a season. They work best when they help you recognize the chapter you are already in. You are in it. You just haven't said so.",
      },
      {
        q: "Do I need to believe in Cardology for it to be useful?",
        a: "No. Treat a card meaning as a structured prompt. Keep what clarifies something real. Leave the rest on the table. Belief was never the entry fee.",
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
      "What the four suits mean in Cardology: hearts, diamonds, clubs and spades, and how each one shapes a birth card reading. Spoiler: it is about you.",
    dek: "The suit is the first domain signal. Emotion, value, mind, or work. Pick the one you have been avoiding.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "7 min read",
    keywords: ["cardology suits", "hearts diamonds clubs spades meaning", "cardology hearts", "cardology spades"],
    answer:
      "In Cardology, hearts describe emotion and relationship. Diamonds describe value and resources. Clubs describe mind and communication. Spades describe work, will, health, and transformation. Four domains. You are overdoing at least one.",
    sections: [
      {
        heading: "Why suits matter more than you would like",
        body: [
          "Rank tells you the type of movement. Suit tells you where it plays out. A Five of Hearts and a Five of Spades both carry change. One moves it through love and belonging. The other moves it through work, health, pressure, and effort. Same restlessness. Different crime scene.",
          "Suit language is one of the fastest ways to make a card meaning practical. Stop asking whether your card is good or difficult. Ask which part of your life it is pointing at. Then notice how fast you changed the subject.",
        ],
      },
      {
        heading: "The four domains, briefly",
        body: [
          "Hearts point to love, family, feeling, memory, and emotional exchange. The chat you mute and then check. Diamonds point to values, money, taste, security, and what a person treats as worth keeping. Clubs point to speech, ideas, learning, a restless mind, and interpretation. Spades point to labor, body, responsibility, endurance, and transformation.",
          "No suit is better than another. Sorry. Each one can be centered, under-expressed, or overplayed. The label is not the reading. The reading is the pattern the label catches you running.",
        ],
        links: [
          { label: "All hearts cards", href: "/birth-card#hearts" },
          { label: "All diamonds cards", href: "/birth-card#diamonds" },
          { label: "All clubs cards", href: "/birth-card#clubs" },
          { label: "All spades cards", href: "/birth-card#spades" },
        ],
      },
      {
        heading: "How to use suit language in a reading without hiding in it",
        body: [
          "Use the suit as the arena. Let the rank narrow the question. A Seven asks about trust, refinement, or spiritual pressure. In hearts, that shows up as emotional safety. In diamonds, as worth. In clubs, as mental certainty. In spades, as discipline and surrender. You know which one you just flinched at.",
          "This keeps Cardology from going vague. A suit pins a card meaning to a concrete area of life. Vague is where you were hoping to hide.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the most important suit in Cardology?",
        a: "There is no most important suit. The relevant suit is the one attached to the birth card, ruling card, period card, or compatibility pattern in front of you. Not the one you wish you had.",
      },
      {
        q: "Can two cards have the same rank but different meanings?",
        a: "Yes. The rank gives a shared pattern. The suit changes the life domain where that pattern shows up. Same habit, different room.",
      },
      {
        q: "Are red cards easier than black cards?",
        a: "Not reliably. Red and black can describe polarity. Every card still has balanced and distorted expressions. Color does not get you out of it.",
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
      "Card rank meanings in Cardology: what Aces, Twos, Threes, Fours, Fives, Sixes, Sevens, Eights, Nines, Tens, Jacks, Queens and Kings mean. No flattery.",
    dek: "Rank gives the pattern. Suit gives the arena. You supply the excuses.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "8 min read",
    keywords: ["cardology ranks", "aces in cardology", "jacks queens kings cardology", "cardology face value"],
    answer:
      "In Cardology, rank describes the style of movement within a suit. Aces initiate. Twos relate. Threes diversify. Fours stabilize. Fives change. Sixes balance. Sevens refine. Eights intensify. Nines complete. Tens express. Jacks experiment. Queens mature. Kings master. Find yours. Then stop bragging about it.",
    sections: [
      {
        heading: "Aces through Tens, in order",
        body: [
          "Aces start. Twos pair. Threes multiply options. Fours build structure. Fives move. Sixes answer for balance. Sevens refine and test faith. Eights concentrate power. Nines complete and release. Tens externalize the suit at scale. Ten verbs. You are doing at least three of them badly right now.",
          "These are starting points. Not finished meanings. A Ten of Clubs is not just a Ten plus clubs. It is mind, communication, and knowledge, said loudly in public. A Ten of Hearts is large emotional visibility and group connection, also loudly. Rank sets the motion. Suit tells you the field.",
        ],
        links: [
          { label: "Browse birth cards by suit", href: "/birth-card" },
          { label: "Calculate your card first", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "Court cards are not compliments",
        body: [
          "Jacks, Queens, and Kings need care. They sound flattering and are still hard to live. Jacks are creative, youthful, flexible, and sometimes evasive, like a reply that just says lol. Queens carry refinement, service, influence, and emotional or intellectual stewardship. Kings carry mastery, authority, completion, and the pressure to use power cleanly.",
          "A useful court-card reading asks one thing. How does this person handle influence? Does the card mature into service and clarity? Or does it hide behind charm, control, or a superiority it would never say out loud?",
        ],
      },
      {
        heading: "How rank helps internal linking across the deck",
        body: [
          "Rank lets you compare cards across suits. Reading the Five of Hearts? Pull up the Five of Diamonds, the Five of Clubs, and the Five of Spades too. That is what change looks like in love, money, mind, and work. Four ways to leave.",
          "That comparison is where the deck starts teaching itself. Same number. Different life domain. Same you, honestly.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is rank more important than suit?",
        a: "No. Rank and suit need each other. Rank gives the movement. Suit gives the life domain. Neither one carries the reading alone.",
      },
      {
        q: "Why are court cards hard to interpret?",
        a: "Court cards describe mature social roles: influence, service, creativity, authority. Those can be gifts or distortions. It depends on how they are used, and who is watching.",
      },
      {
        q: "Should I read every card with the same rank?",
        a: "Yes, if you want pattern fluency. Comparing the same rank across suits is one of the fastest ways to understand Cardology. Faster than rereading your own card page again.",
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
      "Find your birth card with a birth card calculator or fixed Cardology birthday math. One birthday, one card. It was never up for a vote.",
    dek: "A birth card is not chosen. It is calculated from the month and day. You do not get to pick a cooler one.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "5 min read",
    keywords: ["find my birth card", "birth card calculator", "cardology birthday card", "what card am I"],
    answer:
      "The easiest way to find your Cardology birth card is to enter your birth date into a birth card calculator. The result is fixed by month and day. Same birthday, same card, every year. No upgrades.",
    sections: [
      {
        heading: "Use the calculator first. Put the pencil down.",
        body: [
          "Most people do not need to hand-calculate a birth card. You are going to try anyway. A reliable calculator is faster and skips the arithmetic errors. Enter month, day, and year if the tool also returns ruling-card context.",
          "Month and day decide the birth card. The year can matter for other timing layers. The fixed birth-card assignment does not move from one year to the next. You can change your username. Not this.",
        ],
        links: [
          { label: "Open the Birth Card Calculator", href: "/birth-card-calculator" },
          { label: "Browse all birth-card meanings", href: "/birth-card" },
        ],
      },
      {
        heading: "Then read the card page, all of it",
        body: [
          "Finding the card is step one. The meaning page covers suit, rank, balanced pattern, under-expression, over-expression, strengths, shadow, work themes, relationship themes, and birth dates. Yes, read the shadow part. That part is about you.",
          "A calculator result alone is thin. A name and a symbol. It gets interesting when you hold the card up against your behavior, your relationships, and the people who keep showing up in the pattern.",
        ],
      },
      {
        heading: "Common mistakes people make at 1am",
        body: [
          "Most common mistake: confusing birth card with ruling card. The birth card is the core birthday assignment. The ruling card is a secondary layer tied to astrological rulership. It can change the tone of how the birth card comes out.",
          "Second mistake: reading the card as a fixed identity and putting it in your bio. Read it as a range. Centered, under-expressed, over-expressed. You visit all three before lunch.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does my birth card change every year?",
        a: "No. Your birth card is calculated from your birth month and day. It stays the same. Every year. Even the bad ones.",
      },
      {
        q: "Do I need my birth time?",
        a: "No. A Cardology birth card does not require birth time. You can stop texting your mom about it.",
      },
      {
        q: "What should I read after finding my card?",
        a: "Read the specific card meaning. Then the ruling-card explanation. Then the compatibility pages. In that order. Not compatibility first. We saw that.",
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
      "Birth card vs ruling card: the difference between a Cardology birth card and a planetary ruling card, and how to read both without mixing them up.",
    dek: "The birth card names the core pattern. The ruling card colors how it leaks out.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "6 min read",
    keywords: ["birth card vs ruling card", "planetary ruling card", "cardology ruling card", "birth card meaning"],
    answer:
      "A birth card is the fixed card assigned to your birthday. A planetary ruling card is a secondary card. It colors how that birth card comes out, through zodiac rulership. One is the habit. The other is the outfit it wears.",
    sections: [
      {
        heading: "The core distinction, plainly",
        body: [
          "The birth card is the baseline. It describes the central pattern assigned to the birthday in the Cardology calendar. The ruling card is a modifier. It explains why two people with the same birth card do not feel or act the same. One of them texts back. One of them does not.",
          "A clean reading starts with the birth card. Then it checks the ruling card for tone, emphasis, and contradiction. Not the other way round because you liked the ruling card better.",
        ],
        links: [
          { label: "Read the full comparison page", href: "/birth-card-vs-ruling-card" },
          { label: "Find both cards", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "How to read them together without picking a favorite",
        body: [
          "Ask the birth card question first. What pattern keeps repeating? Then ask the ruling-card question. How does this person express it, defend it, or dress it up as a personality?",
          "If the cards seem to disagree, let them. Do not force them into one tidy sentence. The tension is usually the point. One card can describe the deeper operating system. The other describes the social style, the part people meet first and misjudge.",
        ],
      },
      {
        heading: "Why this helps compatibility, annoyingly",
        body: [
          "Compatibility readings get more useful when you compare both layers. Two birth cards can share a suit while the ruling cards bring friction. Or the birth cards clash while the ruling cards make talking easier. Both explain the fight about the dishes.",
          "That is why a compatibility reading needs both cards. Not a single score you screenshot and send them.",
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
        a: "Start with the birth card. Use the ruling card as a second layer. Not a replacement.",
      },
      {
        q: "Can two people share a birth card but have different ruling cards?",
        a: "Yes. That is one reason two people with the same birth card can express it so differently.",
      },
      {
        q: "Does the ruling card change over time?",
        a: "The natal planetary ruling card does not change. Timing cards and yearly cards can add temporary layers on top.",
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
      "A practical method for reading any Cardology birth card meaning as a pattern map for people, behavior and relationship dynamics. Not a verdict.",
    dek: "Read the card as a range. Centered, under-expressed, over-expressed. You have done all three this week.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "7 min read",
    keywords: ["birth card meaning", "how to read cardology", "cardology interpretation", "cardology shadow"],
    answer:
      "Read a birth card meaning by separating the fixed card structure from the interpretation. Start with suit and rank. Then test the balanced, under-expressed, and over-expressed patterns against what you actually did. Not what you planned to do.",
    sections: [
      {
        heading: "Start with the card structure, not your feelings about it",
        body: [
          "The structure is simple. Rank, suit, sometimes a position in a spread. This part does not move. A Queen of Hearts is always a Queen in hearts. The interpretation runs broad or narrow depending on who is reading, and how badly they want to be right.",
          "A good reading explains the structure before it interprets the person. Card first. Behavior second. Diagnosis never.",
        ],
      },
      {
        heading: "Use three positions, not two",
        body: [
          "Use three positions. They make a card practical. The sweet spot is the centered expression. Under-expression is the pattern withheld, avoided, or dimmed. Over-expression is the same pattern turned too loud or too controlling. Same card. Volume knob.",
          "This beats asking whether a card is positive or negative. Every card can clarify or distort. It depends on how it gets lived. You know which way you have been living yours.",
        ],
        links: [
          { label: "All birth-card meanings", href: "/birth-card" },
          { label: "Shadow and Karma Guide", href: "/shadow-karma-guide" },
        ],
      },
      {
        heading: "Turn the meaning into a test you can fail",
        body: [
          "After reading the meaning, ask three grounded questions. Where does this pattern repeat? Which people bring it out? Where does it become too much, or not enough? A specific answer means the card is useful. A vague answer means keep reading, or put it down and go outside.",
          "Leave with language you can test in a real week. Who brings the pattern out. Where it helps. Where it quietly starts running the room while you insist you are just being helpful.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I accept every birth card description?",
        a: "No. Treat the description as a prompt. Keep what clarifies. Discard what does not match lived behavior. Discard honestly, not just the unflattering parts.",
      },
      {
        q: "Why do some card meanings sound intense?",
        a: "Card meanings describe gifts and distortions together. The intensity usually comes from the over-expressed side of a card. The side your friends have already met.",
      },
      {
        q: "Can a card meaning change?",
        a: "The card does not change. The way a person lives the card can mature over time. Slowly. With relapses.",
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
      "What a 52-day period means in Cardology, and how to use period cards as timing language without turning them into predictions. A chapter, not a plot.",
    dek: "A period card frames a chapter. It does not know the ending. Neither do you. Relax.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "6 min read",
    keywords: ["52-day period cardology", "cardology period meaning", "yearly spread cardology", "current card period"],
    answer:
      "A 52-day period is a segment of the Cardology year attached to a timing card. Use it as a reflective frame for the chapter you are in. Not as certainty about what comes next. It does not have that, and it is not hiding it from you.",
    sections: [
      {
        heading: "What a period card does, and what it refuses to do",
        body: [
          "A period card narrows your attention. It stops asking what your whole life means. It asks what kind of pattern might be active in this part of the year. Smaller question. Better question. Less main character.",
          "Period meanings work like chapter titles. They show you the terrain. What is active. What is under pressure. What keeps asking for attention while you reorganize your desktop.",
        ],
        links: [
          { label: "Use the 52-Day Period Tool", href: "/52-day-period-meaning-tool" },
          { label: "Learn the 52-card system", href: "/52-card-astrology-explained" },
        ],
      },
      {
        heading: "How to read a period without bending it",
        body: [
          "Start with the card's suit. That names the life domain asking for attention. Then read the rank as the type of movement: beginning, pairing, choice, structure, change, balance, refinement, power, completion, expression, experiment, stewardship, or mastery.",
          "Then look at what is actually happening. Do not bend reality until it fits the card. That is just lying with extra steps. See whether the card hands you a cleaner question.",
        ],
      },
      {
        heading: "The no-forecast rule, enforced",
        body: [
          "A period card can say, 'this is a useful time to examine values.' It cannot say, 'money arrives on Thursday.' The first is a reflective frame. The second is false certainty with a calendar invite.",
          "Keep it practical. A timing card gives you a cleaner question. Not a fake promise you screenshot and wait on.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long is a Cardology period?",
        a: "A common Cardology yearly rhythm divides the year into seven 52-day periods. Seven chapters. No skipping.",
      },
      {
        q: "Can a period card predict events?",
        a: "Period cards describe timing themes. Pressure, focus, opportunity, friction, and what wants attention. Dates and outcomes are not on the list.",
      },
      {
        q: "Should I read my birth card before period cards?",
        a: "Yes. The birth card gives baseline context. Period cards add temporary timing language on top. Skip the baseline and you are reading weather for nowhere.",
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
      "Cardology planetary periods, yearly spreads and timing stages, explained without fortune telling. The planet is a lens. It is not sending you signs.",
    dek: "Timing language works best when it hands you a question. Not a verdict.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "6 min read",
    keywords: ["cardology planetary periods", "planetary stages cardology", "yearly spread cardology", "cardology timing"],
    answer:
      "Planetary periods in Cardology are timing stages. They add tone and emphasis to a card reading. Use them to name the pressure, the relationship theme, or the chapter a person is moving through. To name it. Not to blame it.",
    sections: [
      {
        heading: "What planetary language adds, exactly",
        body: [
          "Planetary language gives timing cards a second layer. A card in a Venus-like period can raise questions about attraction, values, and relationship. A Saturn-like period can raise questions about discipline, consequence, structure, and repair. Repair as in the thing you said you would fix in spring.",
          "The planet is not the event. It is the lens. The period card gets easier to read through it. The planet is not doing anything to you.",
        ],
      },
      {
        heading: "Why timing works better as pattern context than as a promise",
        body: [
          "Nobody useful is asking whether a page can promise a specific event. The real question is whether the timing card helps you recognize the chapter sooner. The pressure. The person. The attachment. The choice. The pattern warming up for another lap.",
          "Keep the language practical. What is the pressure? Where is the choice? Which pattern is trying to repeat while you pretend not to notice?",
        ],
        links: [
          { label: "Read about 52-day periods", href: "/blog/52-day-periods-in-cardology" },
          { label: "Use the period tool", href: "/52-day-period-meaning-tool" },
        ],
      },
      {
        heading: "A practical reading sequence in five steps",
        body: [
          "First, identify the birth card. Second, identify the active period card. Third, read the planetary tone as a question. Fourth, write down what is actually happening, not the version you told your friends. Fifth, compare the card language against the week. Do not force the week to obey the card.",
          "This sequence keeps timing useful. It also keeps it emotionally clean, which is more than your inbox can say.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are planetary periods the same as astrology transits?",
        a: "No. Cardology planetary periods are part of the card system's timing language. They are not a live sky transit calculation.",
      },
      {
        q: "Why use planets at all?",
        a: "Planet names are shorthand for recurring life themes: value, structure, drive, communication, growth.",
      },
      {
        q: "Can planetary periods help with journaling?",
        a: "Yes. They give a focused question for the current chapter. One question. Answer it before buying another notebook.",
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
      "How to use a daily card reading in Cardology as a grounded journal prompt for reflection, pattern recognition and weekly review. Two honest lines.",
    dek: "The strongest daily reading is short, specific, and checked against the actual day. Not the day you posted.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "5 min read",
    keywords: ["daily card reading", "cardology journal prompt", "daily cardology", "cardology reflection"],
    answer:
      "Use a daily card reading as a journal prompt. Turn the card into one question for the day. By evening, check whether the question clarified anything. Or whether you forgot it by 10am.",
    sections: [
      {
        heading: "Keep it small. Smaller.",
        body: [
          "A daily reading cannot explain your whole life, and it should not try. It gives one clean question. A Diamond might ask about value, attention, spending, or self-worth. A Club might ask about language, interpretation, or the conversation you keep rehearsing in the shower.",
          "Small questions are easier to test. That makes the daily card more useful than a dramatic forecast. Drama is for the group chat.",
        ],
      },
      {
        heading: "Three prompts that work on anyone",
        body: [
          "Ask: what is this card asking me to notice today? Where might I underplay this pattern? Where might I overplay it? Those three prompts work with any card. They do not require belief. They require you to look.",
          "At the end of the day, write two lines. What actually happened. Whether the card language helped. That review loop is where the learning happens. Skipping it is where the learning goes to die.",
        ],
        links: [
          { label: "Read birth-card meanings", href: "/birth-card" },
          { label: "Use the period tool", href: "/52-day-period-meaning-tool" },
        ],
      },
      {
        heading: "Weekly review, no skipping",
        body: [
          "After seven days, look for repeated suits and repeated themes. Are the prompts all landing in relationship, money, thinking, or work? Are you seeing more under-expression or more over-expression? Be honest. It is your notebook.",
          "This is how a symbolic system gets practical. Not by being dramatic. By making repeated behavior easier to name, so you can stop doing it on Tuesdays.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I pull a random daily card?",
        a: "Cardology starts with deterministic card timing, not random draws. A prompt only becomes useful when you test it against real experience. Shuffling is not experience.",
      },
      {
        q: "How long should a daily card journal entry be?",
        a: "Two to five sentences is enough. The goal is pattern recognition. Not performance. Nobody is grading it.",
      },
      {
        q: "What if the card does not fit the day?",
        a: "Write that down. A miss is still useful information if it keeps the reading honest. Misses are data. Ignoring them is a habit.",
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
      "Cardology compatibility for beginners: compare birth cards, Life Path cards, shared roles and relationship dynamics. Not a score. Not a soulmate test.",
    dek: "Compatibility reads attraction, friction, support, blind spots, shared cards, and the roles two people keep playing. You know your role. You have played it before.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "7 min read",
    keywords: ["cardology compatibility", "birth card compatibility", "relationship cardology", "cardology love cards"],
    answer:
      "Cardology compatibility compares birth cards, ruling-card context, Life Path roles, shared cards, and pattern interaction. It names attraction, friction, shared language, blind spots, and why a relationship feels the way it does. It does not tell you to text them.",
    sections: [
      {
        heading: "Start with both birth cards, not just theirs",
        body: [
          "Step one is simple. Calculate both birth cards. Yours too. This gives each person's baseline pattern. Shared suit: you may get the same life domain fast. Different suits: the relationship may need translation between emotional, material, mental, or work-centered instincts. Subtitles, basically.",
          "This is only the beginning. Same suit does not mean easy forever. Different suits do not mean impossible. Calm down.",
        ],
        links: [
          { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
          { label: "Cardology Compatibility", href: "/cardology-compatibility" },
        ],
      },
      {
        heading: "Add the Life Path layer next",
        body: [
          "The deeper read lives in the Life Spread. Each person carries a Moon support card plus 13 Life Path cards: Birth, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Princess, Prince, Queen, and King. That is a lot of seats at one table.",
          "When another person's birth card lands in one of those positions, the relationship takes that role. A Venus hit can feel beloved or magnetic. A Mars hit can bring heat and conflict. A Saturn hit can feel like a lesson you did not sign up for. A Neptune hit can turn dreamy or confusing. A Pluto hit exposes shadow. Nobody enjoys that one.",
        ],
        links: [
          { label: "Life Path Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
        ],
      },
      {
        heading: "Look for language, not permission slips",
        body: [
          "A compatibility reading should give you better words for what you already live through. It might show why one person processes by talking and the other by doing. It might show why money, attention, family, power, timing, or responsibility keep turning into the same fight.",
          "It is not here to flatten the relationship into yes or no. It is here so both people see the dynamic clearly enough to stop fighting the wrong problem. The dishes were never the problem.",
        ],
      },
      {
        heading: "Use card meanings as context, after",
        body: [
          "After comparing the pair, read each card on its own. A relationship pattern makes more sense once you know what each person is trying to protect, express, or avoid. Usually avoid.",
          "Individual cards come after the comparison. The relationship is not separate from the people inside it. That includes you.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can Cardology tell if two people are soulmates?",
        a: "Compatibility is not a soulmate verdict. It names patterns that help two people understand attraction, friction, support, and blind spots. Close the soulmate tab.",
      },
      {
        q: "Is same-suit compatibility always better?",
        a: "No. Same suit can feel familiar. It can also amplify the same blind spots. Two people, one missing piece, matching.",
      },
      {
        q: "Should I compare ruling cards too?",
        a: "Yes. Ruling cards can explain expression, attraction, and daily style the birth card alone may not show. The dishes-in-the-sink layer.",
      },
      {
        q: "What does it mean if we share Life Path cards?",
        a: "Shared Life Path cards mean both people carry the same card in different roles. One person may carry it as Venus while the other carries it as Saturn, Pluto, or King. Same card. Very different feel. Explains a lot about Sundays.",
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
      "Karma cards in Cardology, explained plainly: environment, displacement, support, pressure and repeated lessons. Not punishment. A pattern on repeat.",
    dek: "Karma cards help most when they describe learning edges. Not punishment from above.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "6 min read",
    keywords: ["karma cards cardology", "environment card", "displacement card", "cardology karma"],
    answer:
      "Karma cards in Cardology are related cards that can describe gifts, challenges, repeated lessons, or pressure patterns. Environment is often read as natural support. Displacement is often read as a growth edge. One is the help. One is the homework.",
    sections: [
      {
        heading: "Use karma language carefully, or not at all",
        body: [
          "Karma language gets heavy fast. A clean reading never tells someone they earned their problem. It asks what pattern keeps coming back and what kind of maturity the card might be asking for. Then it waits while you pretend you did not hear.",
          "Environment and displacement are useful because they point at two different relationships with effort. What comes more naturally. What asks to be integrated, slowly, against your will.",
        ],
      },
      {
        heading: "Environment as support you barely notice",
        body: [
          "The environment card can be read as a field of support, ease, or familiar ground. A talent, an ally pattern, or a lesson that sits close to the person's operating system. Close enough that you forget it is there.",
          "That does not make it easy. A gift still has to be handled well. Most people leave theirs in a drawer.",
        ],
      },
      {
        heading: "Displacement as growth edge, the itchy one",
        body: [
          "The displacement card can be read as a pressure point. It can show where the person hits resistance, overcompensates, or has to learn humility, discipline, trust, directness, or restraint. The list reads like your last three arguments.",
          "The goal is not fear. The goal is cleaner language for the place where a pattern asks to grow up.",
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
        a: "No. Karma cards can describe both support and challenge. They are not a moral sentence. Nobody is keeping a tab on you.",
      },
      {
        q: "What is an environment card?",
        a: "An environment card is often read as a supportive or familiar card relationship in the Life Spread. The easy chair.",
      },
      {
        q: "What is a displacement card?",
        a: "A displacement card is often read as a pressure pattern or growth edge that asks for maturity. The hard chair.",
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
      "Cardology for work, love and money: how card meanings map your work style, love patterns, money pressure, values and self-trust. Mostly self-trust.",
    dek: "A card meaning gets practical when it points at a real choice. You have one sitting in your drafts.",
    datePublished: CORE_POSTS_PUBLISHED,
    dateModified: CORE_POSTS_PUBLISHED,
    readTime: "7 min read",
    keywords: ["cardology work", "cardology love", "cardology money", "cardology practical guide"],
    answer:
      "Cardology applies to work, love, and money by reading the card's suit and rank as pattern language. How a person contributes, attaches, values, protects, spends, gives, withholds, and handles pressure. All the verbs you avoid on a Sunday night.",
    sections: [
      {
        heading: "Work, and why you are tired",
        body: [
          "Spades often speak most directly to work, health, effort, and responsibility. Every suit still shows up at work. Hearts can show care labor and belonging. Diamonds can show value, compensation, and business judgment. Clubs can show teaching, writing, planning, and communication. The meeting that could have been an email lives here.",
          "A useful work reading asks where the person naturally contributes. Then where the same pattern burns out or over-controls. Answering email at 11pm counts.",
        ],
      },
      {
        heading: "Love, handled with restraint",
        body: [
          "Love readings need restraint. A card can name attachment style, emotional timing, attraction pattern, or communication friction. It cannot decide what someone should do with their relationship. Neither can the group chat.",
          "Use love-card language to ask better questions. What do I seek? What do I avoid? What do I repeat? What would honesty look like here, before I draft the long text?",
        ],
        links: [
          { label: "Compatibility guide", href: "/cardology-compatibility" },
          { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
        ],
      },
      {
        heading: "Money and value are not the same thing",
        body: [
          "Diamonds are the obvious money suit. Money is rarely only money. It can be safety, taste, power, self-worth, responsibility, attention, and exchange. A Diamond card may ask what a person values. Not just what they earn.",
          "The useful question is where the money pattern lives. Earning, receiving, charging, saving, spending, giving, status, taste, security, or fear. Pick one. Notice you picked the comfortable one.",
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
        a: "Diamonds most directly relate to values, resources, money, and exchange. The receipts suit.",
      },
      {
        q: "Which suit is about love?",
        a: "Hearts most directly relate to emotion, family, love, and belonging. The left-on-read suit.",
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

// The original Cardology explainer now 301s to the comprehensive evergreen guide.
// Keep its source copy for history, but remove it from listings, feeds, related
// modules, static generation, and the sitemap so search engines get one clear URL.
// Keep in sync with RETIRED_PUBLIC_REDIRECTS in middleware.ts: a redirected post
// must not be listed in the sitemap (Search Console flags "Page with redirect").
const RETIRED_BLOG_SLUGS = new Set([
  "what-cardology-is-and-is-not",
  "reading-your-yearly-spread",
  "why-some-birth-cards-clash",
]);

export const BLOG_POSTS: BlogPost[] = [...CORE_BLOG_POSTS, ...GENERATED_POSTS].filter(
  (post) => !RETIRED_BLOG_SLUGS.has(post.slug),
);

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
