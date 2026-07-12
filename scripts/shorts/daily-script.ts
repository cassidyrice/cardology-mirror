// Daily-card voiceover script generator for the Card Blueprints shorts pipeline.
// For a given date it resolves the birth card via the site's own SEO data layer,
// composes an 85-110-word open-loop VO (~28-32s) in the site voice, and writes a
// queue JSON entry with phrase-level caption chunks for the renderer.
//
// Usage: bun scripts/shorts/daily-script.ts [--date YYYY-MM-DD] [--out path.json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { birthdateBySlug, type BirthdateSeo, type CardSeo } from "../../lib/seo-cards";

type VoPhrase = { text: string; words: number };

type ShortsQueueEntry = {
  date: string;
  card_slug: string;
  card_label: string;
  born_on_label: string;
  vo_text: string;
  vo_phrases: VoPhrase[];
  title: string;
  caption: string;
  og_image: string;
  pin_image: string;
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

const MIN_WORDS = 85;
const MAX_WORDS = 110;

// Page-copy tics that read fine on a card page but kill a spoken short.
const TIC_PATTERNS = [
  /mirror, not a forecast/i,
  /^treat it as/i,
  /^your curriculum/i,
  /diversifying resources/i,
  /paths to abundance/i,
  /algorithm/i,
  /this (page|reading|blueprint)/i,
];
const MAX_POOL_SENTENCE_WORDS = 16; // page-copy rambles kill pace

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
// Vertical pin art (1000x1500) is the render visual; og stays for thumbnails.
const pinImage = path.join(root, "public/pins", `${date.card.slug}.png`);
if (!fs.existsSync(pinImage)) {
  throw new Error(`Pin image missing for ${date.card.slug}: ${pinImage}`);
}

const voText = composeVo(date);
const entry: ShortsQueueEntry = {
  date: isoDate,
  card_slug: date.card.slug,
  card_label: date.card.label,
  born_on_label: date.label,
  vo_text: voText,
  vo_phrases: phraseChunks(voText),
  title: buildTitle(date),
  caption: buildCaption(date),
  og_image: ogImage,
  pin_image: pinImage,
};

const outPath = args.out
  ? path.resolve(args.out)
  : path.join(root, "content/shorts/queue", `${isoDate}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(entry, null, 2)}\n`);

console.log(`Wrote ${outPath}`);
console.log(`Card: ${date.card.label} (${date.card.slug}) for ${date.label}`);
console.log(`VO length: ${wordCount(voText)} words, ${entry.vo_phrases.length} caption phrases`);

function composeVo(date: BirthdateSeo): string {
  const card = date.card;

  // Open loop: name the card AND tease the shadow without resolving it —
  // the payoff lands at the shadow turn (~second 12), not in sentence two.
  const hook = `Born on ${date.label}? Your card is the ${card.label} — and its shadow side explains a lot.`;
  const cta = "Find your own card free — link in bio. Card Blueprints.";

  const identityPool = dedupe(sentences(card.coreIdentity)).filter(usable);
  // sweetSpot is deliberately excluded: it is the source of the horoscope-progressive
  // page tics ("You're diversifying resources creatively, ...").
  const shadowPool = dedupe([
    ...sentences(card.shadow),
    ...sentences(card.over),
    ...sentences(card.under),
  ]).filter(usable);
  const gifts = giftPunches(card);
  const growth = growthLine(card);

  // Pre-shadow beat: title + identity punches until ~30 words in, so the shadow
  // turn lands around second 10-12 of the VO.
  const pre: string[] = [hook];
  const titleLine = titleSentence(card);
  if (titleLine) pre.push(titleLine);
  const preMin = pre.length + 1;
  let pi = 0;
  while (wordCount(pre.join(" ")) < 30 && pi < identityPool.length) pre.push(identityPool[pi++]);

  let shadowCount = Math.min(2, shadowPool.length);
  const post: string[] = gifts.slice(0, 2);
  let giftCount = post.length;
  if (growth) post.push(growth);

  const assemble = () =>
    [
      ...pre,
      shadowCount > 0 ? `The shadow side? ${shadowPool.slice(0, shadowCount).join(" ")}` : "",
      ...post,
      cta,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  // Grow toward the floor: deepen the shadow first, then gifts, then identity.
  let guard = 32;
  while (wordCount(assemble()) < MIN_WORDS && guard-- > 0) {
    if (shadowCount < Math.min(4, shadowPool.length)) shadowCount++;
    else if (giftCount < gifts.length) {
      post.splice(giftCount, 0, gifts[giftCount]);
      giftCount++;
    } else if (pi < identityPool.length) pre.push(identityPool[pi++]);
    else break;
  }
  // Trim toward the ceiling: identity extras first, then gifts, then shadow depth.
  guard = 32;
  while (wordCount(assemble()) > MAX_WORDS && guard-- > 0) {
    if (pre.length > preMin) pre.pop();
    else if (giftCount > 1) {
      post.splice(giftCount - 1, 1);
      giftCount--;
    } else if (shadowCount > 2) shadowCount--;
    else break;
  }

  return assemble();
}

function titleSentence(card: CardSeo): string {
  const t = (card.title ?? "").trim();
  if (!t) return "";
  // Lens fallback titles are just the card name in caps — saying them is redundant.
  if (t.toUpperCase() === card.label.toUpperCase()) return "";
  if (/^(ACE|[0-9]+|JACK|QUEEN|KING)\s+OF\s+(HEARTS|CLUBS|DIAMONDS|SPADES)$/i.test(t)) return "";
  return `In Cardology it's called ${t}.`;
}

// Each gift becomes its own <=10-word spoken punch — never a comma list.
function giftPunches(card: CardSeo): string[] {
  const out: string[] = [];
  for (const raw of card.gifts) {
    const g = raw.replace(/[.\s]+$/, "").trim();
    if (!g || wordCount(g) > 8) continue;
    out.push(
      out.length === 0
        ? `Your gift? ${g.charAt(0).toUpperCase()}${g.slice(1)}.`
        : `Plus ${g.charAt(0).toLowerCase()}${g.slice(1)}.`,
    );
    if (out.length === 3) break;
  }
  return out;
}

function growthLine(card: CardSeo): string {
  const s = sentences(card.lifeDirection).find(
    (x) => /^you're learning\b/i.test(x) && wordCount(x) <= 12,
  );
  return s ?? "";
}

function usable(s: string): boolean {
  return !TIC_PATTERNS.some((re) => re.test(s)) && wordCount(s) <= MAX_POOL_SENTENCE_WORDS;
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

// ---- caption phrase chunking (3-6 word bursts for burned-in captions) --------

function phraseChunks(vo: string): VoPhrase[] {
  const out: VoPhrase[] = [];
  for (const sentence of vo.split(/(?<=[.!?])\s+/)) {
    const tokens = sentence.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    for (const chunk of chunkTokens(tokens)) {
      const text = chunk
        .join(" ")
        .replace(/^—\s*/, "")
        .replace(/\s*—$/, "")
        .trim();
      const words = wordCount(text);
      if (!text || words === 0) continue;
      out.push({ text, words });
    }
  }
  return out;
}

function chunkTokens(tokens: string[]): string[][] {
  if (tokens.length <= 6) return [tokens];

  // Split into clause segments at em dashes and after , ; :
  const segs: string[][] = [];
  let cur: string[] = [];
  for (const tok of tokens) {
    if (tok === "—" || tok.startsWith("—")) {
      if (cur.length) segs.push(cur);
      cur = [tok];
      continue;
    }
    cur.push(tok);
    if (/[,;:]$/.test(tok)) {
      segs.push(cur);
      cur = [];
    }
  }
  if (cur.length) segs.push(cur);

  // Merge runt segments (<3 lexical words) into their neighbor.
  const lex = (s: string[]) => s.filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const merged: string[][] = [];
  for (const s of segs) {
    if (merged.length > 0 && (lex(s) < 3 || lex(merged[merged.length - 1]) < 3)) {
      merged[merged.length - 1].push(...s);
    } else {
      merged.push(s);
    }
  }

  // Near-even split of any segment still longer than 6 tokens.
  const chunks: string[][] = [];
  for (const s of merged) {
    const n = Math.ceil(s.length / 6);
    if (n <= 1) {
      chunks.push(s);
      continue;
    }
    const base = Math.floor(s.length / n);
    let extra = s.length % n;
    let i = 0;
    for (let k = 0; k < n; k++) {
      const size = base + (extra-- > 0 ? 1 : 0);
      chunks.push(s.slice(i, i + size));
      i += size;
    }
  }
  return chunks;
}

// ---- shared helpers -----------------------------------------------------------

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
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
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
