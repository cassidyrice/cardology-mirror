#!/usr/bin/env bun
import { getReading } from "../lib/engine";
import type { ActivePeriod, Reading } from "../lib/types";

type Mode = "reading" | "daily-card";

interface Args {
  mode: Mode;
  birthdate?: string;
  targetDate?: string;
  json: boolean;
}

function usage(exitCode = 0): never {
  const out = exitCode === 0 ? console.log : console.error;
  out(`Cardology CLI

Usage:
  bun cli/cardology_cli.ts --birthdate YYYY-MM-DD [--target-date YYYY-MM-DD] [--json]
  bun cli/cardology_cli.ts daily-card --birthdate YYYY-MM-DD [--target-date YYYY-MM-DD] [--json]

Modes:
  reading     Emit the full deterministic Cardology reading JSON.
  daily-card  Emit the active daily card summary used by cardologypro.com.
`);
  process.exit(exitCode);
}

function parseArgs(argv: string[]): Args {
  let mode: Mode = "reading";
  const args: Args = { mode, json: false };
  const rest = [...argv];

  if (rest[0] === "daily-card" || rest[0] === "reading") {
    args.mode = rest.shift() as Mode;
  }

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (a === "--birthdate") {
      args.birthdate = rest[++i];
      continue;
    }
    if (a === "--target-date" || a === "--date") {
      args.targetDate = rest[++i];
      continue;
    }
    console.error(`Unknown argument: ${a}`);
    usage(1);
  }

  if (!args.birthdate) {
    console.error("Missing required --birthdate");
    usage(1);
  }
  return args;
}

function prettyDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function cardTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

function buildDailyCard(reading: Reading) {
  const ap: ActivePeriod = reading.active_period;
  return {
    date: reading.inputs.target_date,
    pretty_date: prettyDate(reading.inputs.target_date),
    source: "cardology CLI daily-card mode",
    active_period: {
      planet: ap.planet,
      domain: ap.domain,
    },
    daily_card: {
      code: ap.bc_card,
      name: cardTitle(ap.interpretation_bc.name),
      spread_anchor: reading.birth_card_spread.anchor,
      role: "Birth-card spread card governing today’s active planetary period",
      under: ap.interpretation_bc.under,
      sweet_spot: ap.interpretation_bc.sweet_spot,
      over: ap.interpretation_bc.over,
    },
    ruling_card_support: {
      code: ap.prc_card,
      name: cardTitle(ap.interpretation_prc.name),
      spread_anchor: reading.prc_spread.anchor,
      role: "Planetary-ruling-card spread support for the same active period",
      under: ap.interpretation_prc.under,
      sweet_spot: ap.interpretation_prc.sweet_spot,
      over: ap.interpretation_prc.over,
    },
    person: {
      birth_card: reading.archetype.birth_card,
      birth_card_title: reading.archetype.description.title,
      ruling_card: reading.archetype.prc,
      ruling_card_title: reading.archetype.prc_description.title,
      age: reading.timing.age,
    },
    reading,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reading = await getReading(args.birthdate!, args.targetDate);

  if (args.mode === "daily-card") {
    const daily = buildDailyCard(reading);
    if (args.json) {
      console.log(JSON.stringify(daily, null, 2));
    } else {
      console.log(`${daily.pretty_date}: ${daily.daily_card.code} — ${daily.daily_card.name}`);
      console.log(`${daily.active_period.planet} chapter · ${daily.active_period.domain}`);
      console.log(`Sweet spot: ${daily.daily_card.sweet_spot}`);
      console.log(`Ruling support: ${daily.ruling_card_support.code} — ${daily.ruling_card_support.name}`);
    }
    return;
  }

  if (args.json) {
    console.log(JSON.stringify(reading, null, 2));
  } else {
    const a = reading.archetype;
    const ap = reading.active_period;
    console.log(`Birth Card: ${a.birth_card} | PRC: ${a.prc} | Active: ${ap.planet} ${ap.bc_card} / ${ap.prc_card}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
