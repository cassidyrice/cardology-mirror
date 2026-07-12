// Daily-card voiceover script generator for the Card Blueprints shorts pipeline.
// For a given date it resolves the birth card via the site's own SEO data layer,
// composes a 45-60s VO script in the site voice, and writes a queue JSON entry.
//
// Usage: bun scripts/shorts/daily-script.ts [--date YYYY-MM-DD] [--out path.json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { birthdateBySlug, type BirthdateSeo, type CardSeo } from "../../lib/seo-cards";

type ShortsQueueEntry = {
  date: string;
  card_slug: string;
  card_label: string;
  born_on_label: string;
  vo_text: string;
  title: string;
  caption: string;
  og_image: string;
};

const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const MIN_WORDS = 110;
const MAX_WORDS = 150;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const args = parseArgs(process.argv.slice(2));
const isoDate = args.date ?? localISODate();
const { month, day } = parseISODate(isoDate);

const dateSlug = `${MONTH_SLUGS[month - 1]}-${day}`;
const date = birthdateBySlug(dateSlug);
if (!date) {
  // December 31 is the Joker position and has no public birth-card page.
  throw new Error(`No birth-card record for ${isoDate} (${dateSlug}). December 31 maps to the Joker and is skipped.`);
}

const ogImage = path.join(root, "public/og", `${date.card.slug}.png`);
if (!fs.existsSync(ogImage)) {
  throw new Error(`OG image missing for ${date.card.slug}: ${ogImage}`);
}

const voText = composeVo(date);
const entry: ShortsQueueEntry = {
  date: isoDate,
  card_slug: date.card.slug,
  card_label: date.card.label,
  born_on_label: date.label,
  vo_text: voText,
  title: buildTitle(date),
  caption: buildCaption(date),
  og_image: ogImage,
};

const outPath = args.out
  ? path.resolve(args.out)
  : path.join(root, "content/shorts/queue", `${isoDate}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(entry, null, 2)}\n`);

console.log(`Wrote ${outPath}`);
console.log(`Card: ${date.card.label} (${date.card.slug}) for ${date.label}`);
console.log(`VO length: ${wordCount(voText)} words`);

function composeVo(date: BirthdateSeo): string {
  const card = date.card;

  const hook = `Born on ${date.label}? Your card is the ${card.label}.`;
  const frame = card.title
    ? `In Cardology it's called ${card.title}. Treat it as a mirror, not a forecast.`
    : "Treat it as a mirror, not a forecast.";
  const cta = "Find your own card free — link in bio. Card Blueprints.";

  const personalityPool = dedupe([
    ...sentences(card.coreIdentity),
    ...sentences(card.sweetSpot),
    giftsSentence(card),
    ...sentences(card.lifeDirection),
  ]);
  const shadowPool = dedupe([...sentences(card.shadow), ...sentences(card.over)]);

  const personality = personalityPool.slice(0, 3);
  const shadowLines = shadowPool.slice(0, 2);
  const turn = shadowLines.length > 0 ? `The shadow side? ${shadowLines.join(" ")}` : "";

  let parts = [hook, frame, ...personality, turn, cta].filter(Boolean);

  // Grow toward the floor, then trim toward the ceiling.
  let extraPersonality = 3;
  let extraShadow = 2;
  while (wordCount(parts.join(" ")) < MIN_WORDS) {
    const next = personalityPool[extraPersonality] ?? shadowPool[extraShadow];
    if (!next) break;
    if (personalityPool[extraPersonality]) {
      parts.splice(2 + (extraPersonality - 3) + 1, 0, personalityPool[extraPersonality]);
      extraPersonality++;
    } else {
      parts.splice(parts.length - 1, 0, shadowPool[extraShadow]);
      extraShadow++;
    }
  }
  while (wordCount(parts.join(" ")) > MAX_WORDS && parts.length > 4) {
    // Drop the last personality sentence before the turn.
    const turnIndex = parts.findIndex((p) => p.startsWith("The shadow side?"));
    const dropIndex = turnIndex > 3 ? turnIndex - 1 : parts.length - 2;
    parts.splice(dropIndex, 1);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function buildTitle(date: BirthdateSeo): string {
  const title = `Born ${date.label}? Your Birth Card Is the ${date.card.label} #shorts`;
  if (title.length <= 90) return title;
  return `${date.label} Birth Card: ${date.card.label} #shorts`;
}

function buildCaption(date: BirthdateSeo): string {
  return [
    `Born on ${date.label}, your Cardology birth card is the ${date.card.label}.`,
    "A mirror, not a forecast. Find your own card free at cardblueprints.com.",
    "",
    "#cardology #birthcard #cartomancy #cardblueprints #shorts",
  ].join("\n");
}

function giftsSentence(card: CardSeo): string {
  if (card.gifts.length === 0) return "";
  const gifts = card.gifts.slice(0, 3).map((g) => g.replace(/\.$/, "").trim());
  const last = gifts.pop();
  const list = gifts.length > 0 ? `${gifts.join(", ").toLowerCase()}, and ${last!.toLowerCase()}` : last!.toLowerCase();
  return `Your gifts: ${list}.`;
}

function sentences(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[-•]\s*/, "").trim())
    .filter((s) => s.length > 0 && /[.!?]$/.test(s));
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function localISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(value: string): { month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid --date value: ${value} (expected YYYY-MM-DD)`);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid --date value: ${value}`);
  }
  return { month, day };
}

function parseArgs(argv: string[]): { date?: string; out?: string } {
  const out: { date?: string; out?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--date") out.date = argv[++i];
    else if (argv[i] === "--out") out.out = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return out;
}
