#!/usr/bin/env bun
// Build lib/card-bible.json: one merged record per card, 52 birth cards plus
// the Joker (December 31, the one birthday outside the 52 card map).
//
//   bun scripts/build-card-bible.ts            # writes lib/card-bible.json
//   bun scripts/build-card-bible.ts --check    # fails if the file is stale
//
// Sources (all read-only):
//   lib/seo-cards.ts            name, slug, rank, suit, title, coreIdentity, gifts,
//                               shadow, lifeDirection, three-lens under/sweetSpot/over
//   lib/shadow-deck.json        archetype, coreShadow, worldview, inTheLight, keywords
//   lib/card-reading-notes.json the "when you overshoot" clause becomes `cost`
//   lib/compat-pairs.json       top three connections from the Worker pair library
//   lib/famous-birthdays.json   up to five Wikidata-checked people per card
//   scripts/card-bible-voice.json  the authored `watchFor` line per card + the Joker record
//   $REFERENCE_DIR (default ~/cardblueprints-ops/reference)
//     analog-algorithm-cards.json  The Analog Algorithm
//     surface-truth-lines.json     the Surface Truth line
//
// This is a TypeScript port of reference/build-card-bible.py plus the
// distribution fields (sweetSpot, cost, watchFor, famous, pairs) that the
// packager reads. Foundations of Cardology stays unmerged: its per-card
// content is PDF tables that do not parse cleanly.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { allCardSeo } from "../lib/seo-cards";
import { shadowEntry } from "../lib/shadow-deck";
import { famousForCard } from "../lib/famous-birthdays";
import { compatForCard } from "../lib/compat-pairs";
import READING_NOTES from "../lib/card-reading-notes.json";
import VOICE from "./card-bible-voice.json";

const REPO = join(import.meta.dir, "..");
const REFERENCE_DIR =
  process.env.REFERENCE_DIR ?? join(homedir(), "cardblueprints-ops", "reference");
const OUT = join(REPO, "lib", "card-bible.json");

function readReference(file: string): Record<string, Record<string, string>> {
  const path = join(REFERENCE_DIR, file);
  if (!existsSync(path)) {
    console.error(
      `missing ${path}\nSet REFERENCE_DIR to the directory holding Cass's source corpus.`,
    );
    process.exit(2);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const analog = readReference("analog-algorithm-cards.json");
const surface = readReference("surface-truth-lines.json") as unknown as Record<string, string>;
const notes = READING_NOTES as Record<string, { reading: string }>;

/** The cost the pattern charges: the "when you overshoot" clause of the reading note. */
function costFor(slug: string): string {
  const reading = notes[slug]?.reading;
  const clause = reading?.split("When you overshoot,")[1]?.trim();
  if (!clause) throw new Error(`no overshoot clause for ${slug}`);
  return clause.charAt(0).toUpperCase() + clause.slice(1);
}

/** Mantra: the Analog Algorithm practice ends with the line in quotes. */
function splitPractice(raw: string): { practice: string; mantra: string | null } {
  const m = /"([^"]+)"\s*$/.exec(raw.trim());
  if (!m) return { practice: raw, mantra: null };
  return { practice: raw.slice(0, m.index).trim(), mantra: m[1].trim() };
}

const bible: Record<string, unknown> = {};

for (const card of allCardSeo()) {
  const s = shadowEntry(card.code);
  const a = analog[card.code];
  const voiceLine = (VOICE.watchFor as Record<string, string>)[card.slug];
  if (!s) throw new Error(`no shadow deck entry for ${card.code}`);
  if (!a) throw new Error(`no analog algorithm entry for ${card.code}`);
  if (!voiceLine) throw new Error(`no watchFor line for ${card.slug}`);
  const { practice, mantra } = splitPractice(a["Algorithm Inoculation Practice"]);

  bible[card.code] = {
    code: card.code,
    name: card.label,
    slug: card.slug,
    rank: card.rank,
    suit: card.suit,
    // Engine (the site's official voice)
    title: card.title,
    coreIdentity: card.coreIdentity,
    gifts: card.gifts,
    sweetSpot: card.sweetSpot, // same sentence as lens.balanced, kept flat for the packager
    shadow: card.shadow,
    cost: costFor(card.slug),
    watchFor: voiceLine,
    lifeDirection: card.lifeDirection,
    lens: { balanced: card.sweetSpot, under: card.under, over: card.over },
    // The Shadow Deck (Cass)
    archetype: s.archetype,
    coreShadow: s.coreShadow,
    worldview: s.worldview,
    inTheLight: s.inTheLight,
    lightName: s.lightName ?? null,
    prompts: s.prompts,
    keywords: s.keywords ?? [],
    // Same-card people (Wikidata P569) and the deck's own connections
    famous: famousForCard(card.code)
      .slice(0, 5)
      .map((p) => ({ name: p.name, born: p.born, knownFor: p.known_for, wikipedia: p.wikipedia })),
    pairs: (compatForCard(card.slug)?.pairs ?? [])
      .slice(0, 3)
      .map((p) => ({ pos: p.pos, name: p.label, href: p.href })),
    // Surface Truth (Cass, v1) — the self-image line; the Actual Truth is rewritten per use
    surfaceTruth: surface[card.code] ?? null,
    // The Analog Algorithm (Cass)
    analog: {
      title: a.title,
      corePattern: a["Core Pattern"],
      shadowExpression: a["Shadow Expression (Unconscious)"],
      evolvedExpression: a["Evolved Expression (Conscious)"],
      relationships: a["In Relationships"],
      career: a["Career & Work"],
      lifeLesson: a["Core Life Lesson"],
      practice,
      mantra,
    },
  };
}

// The Joker sits outside the 52 card map, so it has no engine description, no
// Shadow Deck archetype and no pair pages. Its copy is authored in
// scripts/card-bible-voice.json; only the people come from data.
const joker = VOICE.joker;
bible[joker.code] = {
  ...joker,
  famous: famousForCard(joker.code)
    .slice(0, 5)
    .map((p) => ({ name: p.name, born: p.born, knownFor: p.known_for, wikipedia: p.wikipedia })),
};

const json = `${JSON.stringify(bible, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error(`stale ${OUT}: run \`bun scripts/build-card-bible.ts\``);
    process.exit(1);
  }
  console.log(`ok ${OUT}: ${Object.keys(bible).length} entries, up to date`);
} else {
  writeFileSync(OUT, json);
  const empty = Object.entries(bible).flatMap(([code, entry]) =>
    Object.entries(entry as Record<string, unknown>)
      .filter(([, v]) => v === null || v === "" || (Array.isArray(v) && v.length === 0))
      .map(([k]) => `${code}.${k}`),
  );
  console.log(
    `wrote ${OUT}: ${Object.keys(bible).length} entries; empty fields: ${empty.join(", ") || "none"}`,
  );
}
