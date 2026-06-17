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
    `${topic.name}'s public birth date maps to the ${cardLabel} birth card in Cardology${rulingLabel ? `, with ${rulingLabel} as the planetary ruling card` : ""}. This profile reads that structure as symbolic pattern language for ${topic.publicFrame}, not as diagnosis or prediction.`;

  return {
    slug: topic.slug,
    pillar,
    title,
    seoTitle,
    description:
      `${topic.name} birth card profile in Cardology: ${cardLabel}, ruling-card context, public pattern language, and limits for reading a famous personality responsibly.`,
    dek:
      `A public-pattern Cardology profile for ${topic.name}: birth card, ruling card, strengths, shadow range, and how to read the symbolism without pretending it proves private truth.`,
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
          `${topic.name} is included here because people search public figures to understand Cardology by example. The calculation starts with the public birth date, ${humanDate(topic.birthdate)}, which maps to the ${cardLabel} birth card in the local Cardology Pro engine.`,
          `The useful reading is structural: the Cardology Pro meaning for ${cardLabel}${birth.title ? `, ${birth.title},` : ""} emphasizes ${cleanGiftText(birth.gifts, topic.angle)}. For a public figure, that does not become a claim about private psychology. It becomes a lens for noticing how ${topic.angle} can show up on a public stage.`,
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
            ? `The planetary ruling card adds tone. For this profile, the ruling card is ${rulingLabel}${ruling.title ? `, ${ruling.title}` : ""}. Read that as a secondary style layer, not as a second personality verdict.`
            : "The ruling-card layer adds tone when the system returns one for the date. It should be read as style and expression, not as a second personality label.",
          rulingLabel
            ? `That means the ${cardLabel} is the anchor, while ${rulingLabel} can describe the presentation layer: how the core pattern may appear through audience contact, creative choices, public pressure, and decision style.`
            : `That means the ${cardLabel} remains the anchor for the public-pattern reading.`,
        ],
        links: rulingSlug ? [{ label: `${rulingLabel} meaning`, href: `/birth-card/${rulingSlug}` }] : undefined,
      },
      {
        heading: "Public-life interpretation",
        body: [
          `${topic.name}'s public frame is ${topic.publicFrame}. Through a Cardology lens, the ${cardLabel} profile is most useful when it asks what kind of repeated public pattern is visible: what the person builds, what they return to, what audience role they occupy, and what kind of pressure their category tends to create.`,
          `For this profile, the headline theme is ${topic.angle}. A responsible reading keeps that theme connected to visible work and public role. It does not claim access to inner motives, private relationships, health, or destiny.`,
        ],
      },
      {
        heading: "Strength and shadow range",
        body: [
          `Centered expression: ${cleanGiftText(birth.gifts, "a visible gift pattern")}`,
          `Shadow range: every card can lose proportion. For ${cardLabel}, the public-safe shadow question is where the themes of ${topic.angle} become too scattered, too controlled, too performative, or too dependent on audience response. This is a symbolic caution, not a factual accusation about ${topic.name}.`,
        ],
      },
      {
        heading: "How to use this profile",
        body: [
          `Use ${topic.name}'s profile as a learning example for the ${cardLabel}, then compare it with your own birth card. The point is not celebrity certainty. The point is to make the card language easier to see through a familiar public reference.`,
          "For a personal reading, start with your own birth date. A real reading should include your question, your context, the birth card, the ruling card, and the current timing layer.",
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
        q: `Is this ${topic.name} profile a prediction?`,
        a: "No. It is symbolic pattern language based on a public birth date and public role. It is not diagnosis, fate, or a claim about private motives.",
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
