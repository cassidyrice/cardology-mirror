#!/usr/bin/env bun
// Parse Cass's "The Shadow Deck" manuscript into lib/shadow-deck.json.
//   bun scripts/build-shadow-deck.ts ~/cardblueprints-ops/reference/the-shadow-deck.md
// One entry per card: archetype, core shadow, worldview (first person), in the
// light (+ the light archetype's name), three journaling prompts. Verbatim.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: bun scripts/build-shadow-deck.ts <the-shadow-deck.md>");
  process.exit(2);
}
const md = readFileSync(src, "utf8");

const RANK: Record<string, string> = {
  Ace: "A", Two: "2", Three: "3", Four: "4", Five: "5", Six: "6", Seven: "7",
  Eight: "8", Nine: "9", Ten: "10", Jack: "J", Queen: "Q", King: "K",
};
const SUIT: Record<string, string> = { Hearts: "♥", Clubs: "♣", Diamonds: "♦", Spades: "♠" };
const SLUG_RANK: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };

function codeFor(label: string): string {
  const m = /^(\w+) of (\w+)$/.exec(label.trim());
  if (!m || !SUIT[m[2]]) throw new Error(`bad card label: ${label}`);
  const rank = RANK[m[1]] ?? (/^(10|[2-9])$/.test(m[1]) ? m[1] : null);
  if (!rank) throw new Error(`bad card label: ${label}`);
  return `${rank}${SUIT[m[2]]}`;
}
function slugFor(code: string): string {
  const rank = code.slice(0, -1);
  const suit = { "♥": "hearts", "♣": "clubs", "♦": "diamonds", "♠": "spades" }[code.slice(-1)]!;
  return `${SLUG_RANK[rank] ?? rank}-of-${suit}`;
}
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\\!/g, "!").replace(/\s+/g, " ").trim();

type Entry = {
  code: string; slug: string; label: string; archetype: string;
  coreShadow: string; worldview: string; inTheLight: string; lightName: string | null;
  prompts: string[];
};
const entries: Record<string, Entry> = {};

// Part 2: "### Eight of Diamonds: The Grinder" then bold fields.
const part2 = md.slice(md.indexOf("# Part 2"), md.indexOf("# Part 3"));
const entryRe = /^### (\w+ of \w+): (.+)$/gm;
let m: RegExpExecArray | null;
const heads: { label: string; archetype: string; start: number }[] = [];
while ((m = entryRe.exec(part2))) heads.push({ label: m[1], archetype: clean(m[2]), start: m.index + m[0].length });
heads.forEach((h, i) => {
  const body = part2.slice(h.start, heads[i + 1]?.start ?? part2.length);
  const field = (name: string) => {
    const r = new RegExp(`\\*\\*${name}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\n\\*\\*|\\n###|$)`);
    const f = r.exec(body);
    return f ? clean(f[1]) : "";
  };
  const inTheLight = field("In the Light");
  const lightName = /\*\*(The [^*]+)\*\*/.exec(body.slice(body.indexOf("**In the Light:**")))?.[1] ?? null;
  const code = codeFor(h.label);
  entries[code] = {
    code, slug: slugFor(code), label: h.label, archetype: h.archetype,
    coreShadow: field("Core Shadow"), worldview: field("Worldview of the Archetype").replace(/^"|"$/g, "").replace(/^“|”$/g, ""),
    inTheLight, lightName: lightName ? clean(lightName) : null, prompts: [],
  };
});

// Part 3: "**Eight of Diamonds: The Grinder**" then "1. …" lines.
const part3 = md.slice(md.indexOf("# Part 3"));
const promptRe = /^\*\*(\w+ of \w+): [^*]+\*\*\s*\n((?:\s*\d\.\s.*\n?)+)/gm;
while ((m = promptRe.exec(part3))) {
  const code = codeFor(m[1]);
  const lines = m[2].split("\n").map((l) => l.replace(/^\s*\d\.\s*/, "").trim()).filter(Boolean).map(clean);
  if (entries[code]) entries[code].prompts = lines.slice(0, 3);
}

const missing = Object.values(entries).filter((e) => !e.coreShadow || !e.worldview || !e.inTheLight || e.prompts.length !== 3);
if (Object.keys(entries).length !== 52 || missing.length) {
  console.error(`parsed ${Object.keys(entries).length} cards; incomplete: ${missing.map((e) => e.code).join(", ")}`);
  process.exit(1);
}
// Optional second arg: the shadow keywords JSON (52 rows: Card, Keyword 1..4)
// exported from Cass's shadow_card_meanings.xlsx. Merged as `keywords`.
const kwPath = process.argv[3];
if (kwPath) {
  const rows = JSON.parse(readFileSync(kwPath, "utf8")) as Record<string, string>[];
  for (const row of rows) {
    const code = codeFor(row.Card.replace(/^(\d+|Ace|Jack|Queen|King) of/, (w) => w));
    const e = entries[code];
    if (e) (e as Entry & { keywords?: string[] }).keywords = [1, 2, 3, 4].map((i) => (row[`Keyword ${i}`] || "").trim()).filter(Boolean);
  }
}
const out = join(import.meta.dir, "..", "lib", "shadow-deck.json");
writeFileSync(out, JSON.stringify(entries, null, 2) + "\n");
console.log(`wrote ${out}: 52 cards`);
