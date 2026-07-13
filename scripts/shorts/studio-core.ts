import {
  allCardSeo,
  birthdateBySlug,
  cardBySlug,
  type CardSeo,
} from "../../lib/seo-cards";

export type StudioPostType = "birthday_reveal" | "card_meaning" | "compatibility";
export type StudioDuration = 15 | 30;
export type StudioGoal = "free_calculator" | "ai_voice" | "brand_awareness";

export type StudioInput = {
  postType: StudioPostType;
  duration: StudioDuration;
  goal: StudioGoal;
  dateSlug?: string;
  cardSlug?: string;
  cardASlug?: string;
  cardBSlug?: string;
  trendIdea?: string;
  variant?: number;
};

export type StudioScene = {
  start: number;
  end: number;
  visual: string;
  screenText: string;
  voiceover: string;
};

export type StudioOutput = {
  id: string;
  postType: StudioPostType;
  duration: StudioDuration;
  goal: StudioGoal;
  title: string;
  subjectLabel: string;
  hook: string;
  voiceover: string;
  wordCount: number;
  scenes: StudioScene[];
  cta: string;
  caption: string;
  hashtags: string[];
  sourceUrls: string[];
  visualAssets: string[];
  factsChecked: string[];
  warnings: string[];
};

type ScriptPlan = {
  id: string;
  title: string;
  subjectLabel: string;
  hook: string;
  body: string[];
  captionLead: string;
  hashtags: string[];
  sourceUrls: string[];
  visualAssets: string[];
  factsChecked: string[];
  visuals: string[];
  screenText: string[];
};

const BRAND_CONTEXT = {
  brand: "Card Blueprints",
  domain: "CardBlueprints.com",
  voice: [
    "mysterious but clear",
    "warm and personal",
    "confident about the fixed formula",
    "humble about interpretation",
    "never scary or pushy",
  ],
  truthRules: [
    "Cardology is a reflection tool, not fate or a forecast.",
    "The deck-calendar link is a Cardology tradition, not proven history.",
    "December 31 maps to the Joker on public pages.",
    "Same-card compatibility describes a shared pattern without ranking either person.",
    "The $99 product is an AI Voice Reading with 90 days of access.",
  ],
} as const;

const CTA: Record<StudioGoal, string> = {
  free_calculator: "Find your own card free at CardBlueprints.com.",
  ai_voice: "The $99 AI Voice Reading includes 90 days of access.",
  brand_awareness: "See the hand you were dealt. Choose how to play it. Card Blueprints.",
};

const MONTH_LABEL: Record<string, string> = {
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December",
};

const RISKY_TREND = /\b(proves?|guarantees?|destiny|fate is fixed|definitely|cure|diagnos|legal advice|financial advice)\b/i;

export function studioContext() {
  const cards = allCardSeo().map((card) => ({
    slug: card.slug,
    label: card.label,
    code: card.code,
    suit: card.suit,
    color: card.color,
    title: card.title,
  }));

  const dates = calendarDates().map((dateSlug) => {
    if (dateSlug === "december-31") {
      return { slug: dateSlug, label: "December 31", cardLabel: "Joker" };
    }
    const date = birthdateBySlug(dateSlug);
    return {
      slug: dateSlug,
      label: date?.label ?? labelForDateSlug(dateSlug),
      cardLabel: date?.card.label ?? "",
    };
  });

  return {
    brand: BRAND_CONTEXT,
    cards,
    dates,
    postTypes: [
      { value: "birthday_reveal", label: "Birthday reveal" },
      { value: "card_meaning", label: "Card meaning" },
      { value: "compatibility", label: "Compatibility" },
    ],
    durations: [15, 30],
    goals: [
      { value: "free_calculator", label: "Free calculator" },
      { value: "ai_voice", label: "$99 AI Voice Reading" },
      { value: "brand_awareness", label: "Brand awareness" },
    ],
  };
}

export function generateStudioScript(input: StudioInput): StudioOutput {
  validateInput(input);
  const variant = Math.abs(input.variant ?? 0) % 3;
  const plan =
    input.postType === "birthday_reveal"
      ? birthdayPlan(input, variant)
      : input.postType === "card_meaning"
        ? cardMeaningPlan(input, variant)
        : compatibilityPlan(input, variant);

  const cta = CTA[input.goal];
  const trend = applyTrendPacing(plan.hook, input.trendIdea);
  const body = fitBody(plan.body, input.duration, input.postType, trend.hook, cta);
  const scenes = buildScenes(input.duration, trend.hook, body, cta, plan.visuals, plan.screenText);
  const voiceover = scenes.map((scene) => scene.voiceover).join(" ").replace(/\s+/g, " ").trim();
  const warnings: string[] = [];
  if ((input.trendIdea ?? "").trim()) {
    warnings.push(`Trend inspiration used a ${trend.label} opening. No creator wording was copied.`);
    if (RISKY_TREND.test(input.trendIdea ?? "")) {
      warnings.push("A risky promise in the trend idea was blocked and did not enter the script.");
    }
  }

  return {
    id: plan.id,
    postType: input.postType,
    duration: input.duration,
    goal: input.goal,
    title: plan.title,
    subjectLabel: plan.subjectLabel,
    hook: trend.hook,
    voiceover,
    wordCount: wordCount(voiceover),
    scenes,
    cta,
    caption: buildCaption(plan.captionLead, input.goal, plan.hashtags),
    hashtags: plan.hashtags,
    sourceUrls: plan.sourceUrls,
    visualAssets: plan.visualAssets,
    factsChecked: [
      ...plan.factsChecked,
      "Card Blueprints supplied the card facts and meanings.",
      "The script treats Cardology as reflection, not fate.",
      input.goal === "ai_voice"
        ? "The paid CTA uses the approved $99 AI Voice Reading + 90 days wording."
        : "The CTA uses an approved Card Blueprints message.",
    ],
    warnings,
  };
}

function birthdayPlan(input: StudioInput, variant: number): ScriptPlan {
  const dateSlug = input.dateSlug!;
  const isJoker = dateSlug === "december-31";
  const date = isJoker ? null : birthdateBySlug(dateSlug);
  if (!isJoker && !date) throw new Error("Choose a valid birthday.");

  const dateLabel = isJoker ? "December 31" : date!.label;
  const cardLabel = isJoker ? "Joker" : date!.card.label;
  const hook = [
    `Born on ${dateLabel}? Your card is the ${cardLabel}.`,
    `Your birthday has a card. ${dateLabel} maps to the ${cardLabel}.`,
    `If you were born on ${dateLabel}, this is your card: the ${cardLabel}.`,
  ][variant];

  const body = isJoker
    ? [
        "Card Blueprints runs the birthday through a fixed formula.",
        "Your result is the Joker. In the Cardology tradition, it marks the extra calendar days.",
        "The result stays the same every time.",
        "You still choose what the symbol means in your real life.",
      ]
    : [
        "Card Blueprints gets that result from a fixed birthday formula.",
        `In Cardology, it is called ${lowerFirst(titleFor(date!.card))}. Gift: ${giftFor(date!.card)}.`,
        `Growth edge: ${edgeFor(date!.card)}.`,
        date!.rulingCard
          ? `Your ruling card adds a second layer: the ${date!.rulingCard.label}.`
          : "The birth card is the first layer of the pattern.",
        "Use the meaning as a mirror for your choices, not a forecast.",
      ];

  return {
    id: `${dateSlug}-birthday-reveal`,
    title: `${dateLabel} Birth Card Reveal`,
    subjectLabel: `${dateLabel} · ${cardLabel}`,
    hook,
    body,
    captionLead: isJoker
      ? "December 31 holds the Joker position in the public Cardology calendar."
      : `${dateLabel} maps to the ${cardLabel} in Cardology. Same birthday, same card, every time.`,
    hashtags: ["#cardology", "#birthcard", hashtagDate(dateLabel), "#selfdiscovery"],
    sourceUrls: [
      "https://cardblueprints.com/birth-card-calculator",
      isJoker ? "https://cardblueprints.com/what-is-cardology" : `https://cardblueprints.com/born-on/${dateSlug}`,
    ],
    visualAssets: isJoker
      ? ["Create or supply approved Joker art before rendering."]
      : [`/public/pins/${date!.card.slug}.png`, `/public/og/${date!.card.slug}.png`],
    factsChecked: isJoker
      ? ["December 31 was verified as the public Joker position."]
      : [
          `${dateLabel} was verified as the ${cardLabel}.`,
          `Meaning text came from ${date!.card.slug}.`,
        ],
    visuals: isJoker
      ? [
          "December 31 over blurred card backs",
          "Card Blueprints calculator running the date",
          "Approved Joker art turning face up",
          "Card Blueprints end card",
          "Simple calendar beside the Joker",
        ]
      : [
          `${dateLabel} over blurred ${cardLabel} art`,
          "Card Blueprints calculator running the date",
          `${cardLabel} vertical pin art revealing`,
          "Card Blueprints end card",
          `${cardLabel} art beside the ruling card`,
        ],
    screenText: [
      `Born on ${dateLabel}?`,
      "Run the fixed formula",
      `Your card: ${cardLabel}`,
      ctaScreenText(input.goal),
      "A mirror, not fate",
    ],
  };
}

function cardMeaningPlan(input: StudioInput, variant: number): ScriptPlan {
  const card = cardBySlug(input.cardSlug!);
  if (!card) throw new Error("Choose a valid card.");

  const hook = [
    `The ${card.label} has a gift and a shadow.`,
    `The ${card.label} is not as simple as it looks.`,
    `What does the ${card.label} mean in Cardology?`,
  ][variant];

  return {
    id: `${card.slug}-meaning`,
    title: `${card.label} Video Script`,
    subjectLabel: `${card.label} · ${titleFor(card)}`,
    hook,
    body: [
      `Cardology calls it ${lowerFirst(titleFor(card))}. Gift: ${giftFor(card)}.`,
      `Under stress: ${edgeFor(card)}.`,
      `It belongs to ${card.suitDomain}.`,
      "Notice the pattern in a real week. Keep what fits and drop what does not.",
    ],
    captionLead: `${card.label}: ${titleFor(card)}. Notice the gift and the growth edge without turning the card into a verdict.`,
    hashtags: ["#cardology", "#birthcard", hashtagCard(card), "#selfdiscovery"],
    sourceUrls: [`https://cardblueprints.com/birth-card/${card.slug}`],
    visualAssets: [`/public/pins/${card.slug}.png`, `/public/og/${card.slug}.png`],
    factsChecked: [
      `${card.label} was verified in the 52-card data set.`,
      `The title, gift, and growth edge came from ${card.slug}.`,
    ],
    visuals: [
      `Close crop of the ${card.label}`,
      `${card.label} title card`,
      `${card.label} vertical pin art with a slow push in`,
      "Card Blueprints end card",
      `Light-to-shadow shift across the ${card.label}`,
    ],
    screenText: [
      `${card.label}: gift + shadow`,
      titleFor(card),
      `Gift: ${screenPhrase(giftFor(card))}`,
      ctaScreenText(input.goal),
      "Pattern, not a verdict",
    ],
  };
}

function compatibilityPlan(input: StudioInput, variant: number): ScriptPlan {
  const a = cardBySlug(input.cardASlug!);
  const b = cardBySlug(input.cardBSlug!);
  if (!a || !b) throw new Error("Choose two valid cards.");
  const sameCard = a.slug === b.slug;
  const sameSuit = a.suit === b.suit;
  const hook = [
    `What happens when the ${a.label} meets the ${b.label}?`,
    `${a.label} plus ${b.label}: familiar, different, or both?`,
    sameCard
      ? `Two people can carry the same card and still live it differently.`
      : `These two cards do not always lead from the same place.`,
  ][variant];

  const body = sameCard
    ? [
        `Both carry the ${a.label}. The pattern is shared equally; neither side is heavier.`,
        "That can feel deeply familiar, but it can also double the same blind spot.",
        "The pattern belongs to both people equally.",
        "Compatibility is a skill and a reflection, not a verdict.",
      ]
    : sameSuit
      ? [
          `Both cards lead from ${a.suitDomain.toLowerCase()}.`,
          "That shared first instinct can feel familiar and easy to recognize.",
          "It can also amplify similar blind spots when both people are under pressure.",
          `${a.label} gift: ${giftFor(a)}. ${b.label} gift: ${giftFor(b)}.`,
          "Compatibility is a skill and a reflection, not a verdict.",
        ]
      : [
          `The ${a.label} leads from ${a.suitDomain.toLowerCase()}, while the ${b.label} leads from ${b.suitDomain.toLowerCase()}.`,
          "Different first instincts can create friction or balance.",
          `${a.label} gift: ${giftFor(a)}. ${b.label} gift: ${giftFor(b)}.`,
          "Compatibility is a skill and a reflection, not a verdict.",
        ];

  return {
    id: `${a.slug}-and-${b.slug}-compatibility`,
    title: `${a.label} + ${b.label} Compatibility Script`,
    subjectLabel: `${a.label} + ${b.label}`,
    hook,
    body,
    captionLead: sameCard
      ? `${a.label} with ${b.label}: one shared pattern, two real people, and no heavier side.`
      : `${a.label} with ${b.label}: look for shared language, friction, and balance without reducing the relationship to a score.`,
    hashtags: ["#cardology", "#compatibility", "#birthcards", "#relationshippatterns"],
    sourceUrls: [
      "https://cardblueprints.com/cardology-compatibility",
      "https://cardblueprints.com/birth-card-compatibility-calculator",
      `https://cardblueprints.com/birth-card/${a.slug}`,
      `https://cardblueprints.com/birth-card/${b.slug}`,
    ],
    visualAssets: [`/public/pins/${a.slug}.png`, `/public/pins/${b.slug}.png`],
    factsChecked: [
      `${a.label} and ${b.label} were verified in the 52-card data set.`,
      sameCard
        ? "The same-card rule was applied equally to both people."
        : "The comparison uses verified suit domains and card gifts.",
    ],
    visuals: [
      `${a.label} and ${b.label} sliding into a split screen`,
      `Suit-domain labels under both cards`,
      `The two card images moving closer together`,
      "Card Blueprints compatibility end card",
      "Shared pattern and growth edge appearing between the cards",
    ],
    screenText: [
      `${a.label} + ${b.label}`,
      sameCard ? "One shared pattern" : sameSuit ? "Same first instinct" : "Different first instincts",
      sameCard ? "No heavier side" : "Friction or balance?",
      input.goal === "free_calculator" ? "Compare your cards free" : ctaScreenText(input.goal),
      "Compatibility is not a verdict",
    ],
  };
}

function buildScenes(
  duration: StudioDuration,
  hook: string,
  body: string[],
  cta: string,
  visuals: string[],
  screenText: string[],
): StudioScene[] {
  const windows = duration === 15
    ? [[0, 2], [2, 5], [5, 11], [11, 15]]
    : [[0, 3], [3, 8], [8, 16], [16, 25], [25, 30]];
  const voice = duration === 15
    ? [hook, body[0] ?? "", body.slice(1).join(" "), cta]
    : [hook, body[0] ?? "", body[1] ?? "", body.slice(2).join(" "), cta];
  const displayOrder = duration === 15 ? [0, 1, 2, 3] : [0, 1, 2, 4, 3];

  return windows.map(([start, end], index) => ({
    start,
    end,
    visual: visuals[displayOrder[index]] ?? visuals[visuals.length - 1] ?? "Card Blueprints visual",
    screenText: screenPhrase(screenText[displayOrder[index]] ?? "Card Blueprints"),
    voiceover: voice[index].trim(),
  }));
}

function fitBody(
  body: string[],
  duration: StudioDuration,
  type: StudioPostType,
  hook: string,
  cta: string,
): string[] {
  const take = duration === 15 ? 2 : 4;
  const minimum = duration === 15 ? 35 : 65;
  const maximum = duration === 15 ? 55 : 100;
  const fitted: string[] = [];
  for (const line of body.filter(Boolean).slice(0, take)) {
    const candidate = sentence(line);
    if (wordCount([hook, ...fitted, candidate, cta].join(" ")) <= maximum) fitted.push(candidate);
  }
  const filler = type === "compatibility"
      ? [
        "Use it to notice the pattern, not judge the relationship.",
        "The cards can name a dynamic, but people still make choices.",
        "Look for one small choice you can make together.",
      ]
    : [
        "Keep what fits your real life.",
        "Your choices still matter.",
        "Notice one clear example this week.",
        "Start with one small action.",
      ];
  for (const line of filler) {
    if (wordCount([hook, ...fitted, cta].join(" ")) >= minimum) break;
    if (!fitted.includes(line) && wordCount([hook, ...fitted, line, cta].join(" ")) <= maximum) fitted.push(line);
  }
  return fitted;
}

function applyTrendPacing(hook: string, trendIdea?: string): { hook: string; label: string } {
  const idea = (trendIdea ?? "").trim().toLowerCase();
  if (!idea) return { hook, label: "standard" };
  if (/\bpov\b/.test(idea)) return { hook: `POV: ${lowerFirst(hook)}`, label: "POV" };
  if (/question|quiz|guess/.test(idea)) return { hook: `Quick question. ${hook}`, label: "question" };
  if (/story|storytime/.test(idea)) return { hook: `Here is the short story: ${lowerFirst(hook)}`, label: "story" };
  if (/transition|before|after/.test(idea)) return { hook: `Watch the reveal: ${lowerFirst(hook)}`, label: "reveal" };
  return { hook: `Quick reveal: ${lowerFirst(hook)}`, label: "fast reveal" };
}

function buildCaption(lead: string, goal: StudioGoal, hashtags: string[]): string {
  const action = goal === "free_calculator"
    ? "Try the free calculator at cardblueprints.com."
    : goal === "ai_voice"
      ? "The $99 AI Voice Reading includes 90 days of access."
      : "See the hand you were dealt. Choose how to play it.";
  return `${lead}\n\nA mirror, not a forecast. ${action}\n\n${hashtags.join(" ")}`;
}

function validateInput(input: StudioInput) {
  if (!["birthday_reveal", "card_meaning", "compatibility"].includes(input.postType)) {
    throw new Error("Choose a valid post type.");
  }
  if (![15, 30].includes(input.duration)) throw new Error("Choose 15 or 30 seconds.");
  if (!["free_calculator", "ai_voice", "brand_awareness"].includes(input.goal)) {
    throw new Error("Choose a valid goal.");
  }
  if (input.postType === "birthday_reveal" && !input.dateSlug) throw new Error("Choose a birthday.");
  if (input.postType === "card_meaning" && !input.cardSlug) throw new Error("Choose a card.");
  if (input.postType === "compatibility" && (!input.cardASlug || !input.cardBSlug)) {
    throw new Error("Choose two cards.");
  }
}

function titleFor(card: CardSeo): string {
  const title = (card.title ?? card.label).trim();
  return title.toLowerCase().startsWith("the ") ? title : `the ${title}`;
}

function giftFor(card: CardSeo): string {
  return sourcePhrase(card.gifts[0] || card.sweetSpot);
}

function edgeFor(card: CardSeo): string {
  return sourcePhrase(firstSentence(card.shadow || card.under));
}

function sourcePhrase(value: string): string {
  return value
    .replace(/^[-•]\s*/, "")
    .replace(/[.!?]+$/, "")
    .trim();
}

function firstSentence(value: string): string {
  return value.split(/(?<=[.!?])\s+/)[0] ?? value;
}

function sentence(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function lowerFirst(value: string): string {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function screenPhrase(value: string): string {
  const words = value.replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 8).join(" ");
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter((word) => /[A-Za-z0-9$]/.test(word)).length;
}

function hashtagCard(card: CardSeo): string {
  return `#${card.slug.replace(/-/g, "")}`;
}

function hashtagDate(label: string): string {
  return `#${label.replace(/\s+/g, "").replace(/[^A-Za-z0-9#]/g, "")}`;
}

function ctaScreenText(goal: StudioGoal): string {
  if (goal === "free_calculator") return "Find your card free";
  if (goal === "ai_voice") return "AI Voice + 90 days";
  return "Choose how to play it";
}

function labelForDateSlug(slug: string): string {
  const match = /^([a-z]+)-(\d{1,2})$/.exec(slug);
  if (!match) return slug;
  return `${MONTH_LABEL[match[1]] ?? match[1]} ${Number(match[2])}`;
}

function calendarDates(): string[] {
  const months = [
    ["january", 31], ["february", 29], ["march", 31], ["april", 30],
    ["may", 31], ["june", 30], ["july", 31], ["august", 31],
    ["september", 30], ["october", 31], ["november", 30], ["december", 31],
  ] as const;
  return months.flatMap(([month, days]) =>
    Array.from({ length: days }, (_, index) => `${month}-${index + 1}`),
  );
}
