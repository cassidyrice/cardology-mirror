import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildReading } from "../lib/reading";
import type { BlogPost, BlogPillarSlug } from "../lib/blog";

type PublicFigureTopic = {
  slug: string;
  name: string;
  category: string;
  birthdate: string;
  publicFrame: string;
  keywords: string[];
  angle: string;
};

type TopicsFile = {
  figures: PublicFigureTopic[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const generatedPath = path.join(root, "lib/generated-blog-posts.json");
const coreBlogPath = path.join(root, "lib/blog.ts");
const topicsPath = path.join(root, "content/daily-blog/topics.json");
const trendingQueuePath = path.join(root, "content/daily-blog/trending-queue.json");

const postDate = process.env.POST_DATE || new Date().toISOString().slice(0, 10);
const forcedSlug = process.env.DAILY_BLOG_TOPIC_SLUG;

const generated = readJson<BlogPost[]>(generatedPath, []);
const topics = readTopicPool();
const existingSlugs = new Set([
  ...generated.map((post) => post.slug),
  ...extractCoreSlugs(fs.readFileSync(coreBlogPath, "utf8")),
]);
const existingKeywordSets = generated.map((post) => new Set(post.keywords.map(normalizeKeyword)));

const topic = selectTopic(topics);
if (!topic) {
  console.log("No eligible daily blog topic found. Nothing to publish.");
  process.exit(0);
}

const post = buildPublicFigurePost(topic);
generated.push(post);
fs.writeFileSync(generatedPath, `${JSON.stringify(generated, null, 2)}\n`);

console.log(`Generated ${post.slug}`);

function readTopicPool(): PublicFigureTopic[] {
  const base = readJson<TopicsFile>(topicsPath, { figures: [] }).figures;
  const queued = fs.existsSync(trendingQueuePath)
    ? readJson<TopicsFile | PublicFigureTopic[]>(trendingQueuePath, { figures: [] })
    : { figures: [] };
  const queue = Array.isArray(queued) ? queued : queued.figures;
  const envQueue = process.env.DAILY_BLOG_PERSON_JSON
    ? normalizeEnvQueue(process.env.DAILY_BLOG_PERSON_JSON)
    : [];

  const bySlug = new Map<string, PublicFigureTopic>();
  for (const item of [...envQueue, ...queue, ...base]) {
    if (!isValidTopic(item)) continue;
    bySlug.set(item.slug, item);
  }
  return [...bySlug.values()];
}

function selectTopic(pool: PublicFigureTopic[]): PublicFigureTopic | null {
  const candidates = pool.filter((topic) => {
    if (existingSlugs.has(topic.slug)) return false;
    if (isKeywordDuplicate(topic.keywords)) return false;
    return true;
  });

  if (forcedSlug) {
    const forced = candidates.find((topic) => topic.slug === forcedSlug);
    if (!forced) {
      throw new Error(`Forced topic ${forcedSlug} is missing, already published, or too close to an existing topic.`);
    }
    return forced;
  }

  if (candidates.length === 0) return null;

  const dayIndex = Math.floor(Date.parse(`${postDate}T00:00:00Z`) / 86_400_000);
  return candidates[dayIndex % candidates.length];
}

function buildPublicFigurePost(topic: PublicFigureTopic): BlogPost {
  const reading = buildReading(topic.birthdate);
  const birthCard = reading.archetype.birth_card;
  const rulingCard = reading.archetype.prc;
  const birth = reading.archetype.description;
  const ruling = reading.archetype.prc_description;
  const cardLabel = cardLabelFromCode(birthCard);
  const rulingLabel = rulingCard ? cardLabelFromCode(rulingCard) : null;
  const cardSlug = cardSlugFromCode(birthCard);
  const rulingSlug = rulingCard ? cardSlugFromCode(rulingCard) : null;
  const pillar: BlogPillarSlug = "birth-card-meanings";

  const title = `${topic.name} Birth Card Profile: ${cardLabel}`;
  const seoTitle = `${topic.name} Birth Card Profile`;
  const answer =
    `${topic.name}'s public birth date maps to the ${cardLabel} birth card in Cardology${rulingLabel ? `, with ${rulingLabel} as the planetary ruling card` : ""}. This profile uses a real public figure to make the card easier to recognize in people, creative choices, relationship dynamics, and repeated public patterns.`;

  return {
    slug: topic.slug,
    pillar,
    title,
    seoTitle,
    description:
      `${topic.name} birth card profile in Cardology: ${cardLabel}, ruling-card context, real-person pattern reading, public-facing behavior, and relationship dynamics.`,
    dek:
      `A Cardology profile for ${topic.name}: birth card, ruling card, strengths, shadow range, and how this card can show up in actual people and the dynamics around them.`,
    datePublished: postDate,
    dateModified: postDate,
    readTime: "6 min read",
    keywords: unique([
      ...topic.keywords,
      `${topic.name} birth card`,
      `${topic.name} Cardology`,
      `${cardLabel} birth card`,
      "celebrity birth card profile",
    ]),
    answer,
    sections: [
      {
        heading: `${topic.name}'s Cardology birth card`,
        body: [
          `${topic.name} is included here because Cardology is easiest to learn through actual people. The calculation starts with the public birth date, ${humanDate(topic.birthdate)}, which maps to the ${cardLabel} birth card in the local Cardology Pro engine.`,
          `The Cardology Pro meaning for ${cardLabel}${birth.title ? `, ${birth.title},` : ""} emphasizes ${cleanGiftText(birth.gifts, topic.angle)}. In a famous-person profile, the card becomes a working lens: how ${topic.angle} may show up through choices, audience bonds, pressure, collaboration, and public role.`,
        ],
        links: [
          { label: `${cardLabel} meaning`, href: `/birth-card/${cardSlug}` },
          { label: "Find your own birth card", href: "/birth-card-calculator" },
        ],
      },
      {
        heading: "The ruling-card layer",
        body: [
          rulingLabel
            ? `The planetary ruling card adds tone. For this profile, the ruling card is ${rulingLabel}${ruling.title ? `, ${ruling.title}` : ""}. Read that as the style layer: the way the core card may come through in voice, timing, pressure, and social pattern.`
            : "The ruling-card layer adds tone when the system returns one for the date. Read it as style, expression, and relational texture.",
          rulingLabel
            ? `That means the ${cardLabel} is the anchor, while ${rulingLabel} can describe the presentation layer: how the core pattern may appear through audience contact, creative choices, public pressure, and decision style.`
            : `That means the ${cardLabel} remains the anchor for the real-person pattern reading.`,
        ],
        links: rulingSlug ? [{ label: `${rulingLabel} meaning`, href: `/birth-card/${rulingSlug}` }] : undefined,
      },
      {
        heading: "Public-life interpretation",
        body: [
          `${topic.name}'s public frame is ${topic.publicFrame}. Through a Cardology lens, the ${cardLabel} profile is most useful when it asks what repeats: what the person builds, what they return to, how they bond with an audience, and what kind of friction their role tends to create.`,
          `For this profile, the headline theme is ${topic.angle}. That theme is the bridge between the card and the person: not a cage, not a verdict, but a practical way to study why certain public dynamics keep forming around the same figure.`,
        ],
      },
      {
        heading: "Strength and shadow range",
        body: [
          `Centered expression: ${cleanGiftText(birth.gifts, "a visible gift pattern")}`,
          `Shadow range: every card can lose proportion. For ${cardLabel}, the useful question is where the themes of ${topic.angle} become too scattered, too controlled, too performative, or too dependent on audience response. That is how the card becomes readable in real life: through recurring patterns, not one isolated headline.`,
        ],
      },
      {
        heading: "How to use this profile",
        body: [
          `Use ${topic.name}'s profile as a learning example for the ${cardLabel}, then compare it with your own birth card and the cards of people close to you. This is where Cardology gets relatable: you start seeing why some people feel familiar, why others create friction, and why certain dynamics repeat.`,
          "For a personal reading, start with the birth dates and the actual question: a partner, parent, friend, coworker, creative collaborator, or repeated relationship pattern. The best reading combines the card structure with the real context around it.",
        ],
        links: [
          { label: "Birth Card Calculator", href: "/birth-card-calculator" },
          { label: "Personal Cardology Readings", href: "/readings" },
        ],
      },
    ],
    faqs: [
      {
        q: `What is ${topic.name}'s birth card?`,
        a: `${topic.name}'s public birth date maps to the ${cardLabel} birth card in the Cardology Pro engine.`,
      },
      {
        q: `Can a birth card explain why ${topic.name} behaves the way they do?`,
        a: "It can give a strong pattern lens for public choices, relationship dynamics, and recurring themes. It should not reduce a whole person to one card or claim private facts that are not visible.",
      },
      {
        q: `Can I compare my card with ${topic.name}'s card?`,
        a: "Yes, as an educational exercise. Use the birth card calculator to find your own card, then compare suit, rank, ruling-card tone, and shadow range.",
      },
    ],
    related: ["how-to-read-birth-card-meaning", "birth-card-vs-ruling-card-how-to-read-both", "cardology-for-work-love-and-money"],
    coreLinks: [
      { label: `${cardLabel} Birth Card Meaning`, href: `/birth-card/${cardSlug}` },
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "Personal Readings", href: "/readings", note: "$29, $99, and $199 options." },
    ],
  };
}

function extractCoreSlugs(source: string): string[] {
  return [...source.matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function isKeywordDuplicate(keywords: string[]): boolean {
  const normalized = new Set(keywords.map(normalizeKeyword));
  return existingKeywordSets.some((set) => overlapCount(set, normalized) >= 2);
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const value of a) {
    if (b.has(value)) count++;
  }
  return count;
}

function normalizeKeyword(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cardLabelFromCode(code: string): string {
  const rank = code.replace(/[♥♦♣♠]/u, "");
  const suit = [...code].find((char) => "♥♦♣♠".includes(char)) ?? "";
  const rankName: Record<string, string> = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };
  const suitName: Record<string, string> = { "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs", "♠": "Spades" };
  return `${rankName[rank] ?? rank} of ${suitName[suit] ?? "Cards"}`;
}

function cardSlugFromCode(code: string): string {
  const label = cardLabelFromCode(code);
  return label
    .toLowerCase()
    .replace(/^ace/, "ace")
    .replace(/^jack/, "jack")
    .replace(/^queen/, "queen")
    .replace(/^king/, "king")
    .replace(/\s+of\s+/g, "-of-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function cleanGiftText(gifts: string, fallback: string): string {
  const lines = gifts
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return fallback;
  return lines.slice(0, 4).join("; ").replace(/\.$/, "");
}

function normalizeEnvQueue(value: string): PublicFigureTopic[] {
  const parsed = JSON.parse(value);
  if (Array.isArray(parsed)) return parsed;
  return [parsed];
}

function isValidTopic(value: unknown): value is PublicFigureTopic {
  const item = value as PublicFigureTopic;
  return Boolean(item?.slug && item?.name && item?.category && item?.birthdate && item?.publicFrame && Array.isArray(item?.keywords) && item?.angle);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
