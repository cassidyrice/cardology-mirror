#!/usr/bin/env bun
import { getReading } from "../lib/engine";
import { chatStream } from "../lib/llm";
import { READING_INTERPRETATION_GUIDE } from "../lib/interpretation-guidance";
import type { Reading } from "../lib/types";
import THREE_LENS from "../lib/card-meanings.json";
import CARD_DESCRIPTIONS from "../lib/engine-data/card-descriptions.json";

const MEANINGS = THREE_LENS as Record<string, { name: string; under: string; sweet_spot: string; over: string }>;
const DESCRIPTIONS = CARD_DESCRIPTIONS as Record<string, { title: string; core_identity: string; gifts: string; shadow: string; life_direction: string }>;

function usage(exitCode = 0): never {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Cardology CLI

Usage:
  bun cli/cardology_cli.ts --birthdate YYYY-MM-DD [--target-date YYYY-MM-DD] [--reading] [--json]

Flags:
  --reading   Stream a narrative reading synthesizing all four cards.
  --json      Output structured JSON instead of plain text.
`);
  process.exit(exitCode);
}

function parseArgs(argv: string[]) {
  let birthdate: string | undefined;
  let targetDate: string | undefined;
  let json = false;
  let reading = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--json") { json = true; continue; }
    if (a === "--reading") { reading = true; continue; }
    if (a === "--birthdate") { birthdate = argv[++i]; continue; }
    if (a === "--target-date" || a === "--date") { targetDate = argv[++i]; continue; }
    console.error(`Unknown argument: ${a}`);
    usage(1);
  }

  if (!birthdate) { console.error("Missing required --birthdate"); usage(1); }
  return { birthdate: birthdate!, targetDate, json, reading };
}

function cardContext(code: string) {
  const m = MEANINGS[code];
  const d = DESCRIPTIONS[code];
  return {
    code,
    name: m?.name ?? code,
    title: d?.title ?? null,
    core_identity: d?.core_identity ?? null,
    shadow: d?.shadow ?? null,
    life_direction: d?.life_direction ?? null,
    under: m?.under ?? null,
    sweet_spot: m?.sweet_spot ?? null,
    over: m?.over ?? null,
  };
}

function buildPrompt(r: Reading): string {
  const birth = cardContext(r.archetype.birth_card);
  const period52 = cardContext(r.active_period.bc_card);
  const longRange = cardContext(r.long_range.bc.card);
  const pluto = cardContext(r.birth_card_spread.pluto);

  const planet = r.active_period.planet;
  const domain = r.active_period.domain;
  const longRangePlanet = r.long_range.bc.planet;

  return `You are generating a Cardology reading for someone. Here are their four active cards with full contextual meanings.

---

## BIRTH CARD: ${birth.code} — ${birth.title ?? birth.name}
This is their core identity anchor — who they fundamentally are.

**Core identity:** ${birth.core_identity}
**Shadow:** ${birth.shadow}
**Life direction:** ${birth.life_direction}
**Underuse pattern:** ${birth.under}
**Sweet spot:** ${birth.sweet_spot}
**Overuse pattern:** ${birth.over}

---

## CURRENT 52-DAY CARD: ${period52.code} — ${period52.name}
Active during the ${planet} period (domain: ${domain}). This is the chapter they are currently living.

**Underuse pattern:** ${period52.under}
**Sweet spot:** ${period52.sweet_spot}
**Overuse pattern:** ${period52.over}

---

## LONG RANGE (YEAR): ${longRange.code} — ${longRange.name}
The overarching theme card for this year of their life, governed by ${longRangePlanet}.

**Underuse pattern:** ${longRange.under}
**Sweet spot:** ${longRange.sweet_spot}
**Overuse pattern:** ${longRange.over}

---

## PLUTO CARD (YEAR): ${pluto.code} — ${pluto.name}
The transformation card for this year — the unconscious pattern being pressured to change.

**Underuse pattern:** ${pluto.under}
**Sweet spot:** ${pluto.sweet_spot}
**Overuse pattern:** ${pluto.over}

---

Write a cohesive reading that weaves all four cards together. Address the person directly in second person. Cover:
1. Who they are through their Birth Card
2. What the current 52-day chapter is asking of them
3. How the year's Long Range theme shapes everything
4. What the Pluto card is forcing them to transform — and what pattern they are probably avoiding right now

Follow the reader voice and method from the interpretation guide. Be specific, direct, and avoid vague generalities.`;
}

async function generateReading(r: Reading) {
  const prompt = buildPrompt(r);
  process.stdout.write("\n");
  for await (const chunk of chatStream(
    [
      { role: "system", content: READING_INTERPRETATION_GUIDE },
      { role: "user", content: prompt },
    ],
    { temperature: 0.75, max_tokens: 1200 },
  )) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");
}

async function main() {
  const { birthdate, targetDate, json, reading: doReading } = parseArgs(process.argv.slice(2));
  const r = await getReading(birthdate, targetDate);

  const cards = {
    birth_card: r.archetype.birth_card,
    current_52_day_card: r.active_period.bc_card,
    long_range_year: r.long_range.bc.card,
    pluto_year: r.birth_card_spread.pluto,
  };

  if (json) {
    console.log(JSON.stringify(cards, null, 2));
    return;
  }

  console.log(`Birth Card:        ${cards.birth_card}`);
  console.log(`52-Day Card:       ${cards.current_52_day_card}`);
  console.log(`Long Range (Year): ${cards.long_range_year}`);
  console.log(`Pluto (Year):      ${cards.pluto_year}`);

  if (doReading) {
    await generateReading(r);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
