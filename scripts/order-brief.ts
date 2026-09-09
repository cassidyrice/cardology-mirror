#!/usr/bin/env bun
// Order brief for the $19 52xSeven Blueprint: everything a support or QA bot
// needs about one buyer's cards, as JSON. Read-only, deterministic, no network.
//
//   bun scripts/order-brief.ts 1988-07-14            # as of today
//   bun scripts/order-brief.ts 1988-07-14 2026-09-07 # as of a date
//
// Prints one JSON object: the Blueprint report (birth card, ruling card,
// identity, gifts, shadow, current chapter, year ahead, yearly signals), the
// seven-chapter year model (the seven 52-day periods with dates), and the
// three-lens read of the birth card. Dec 31 prints {"joker": true}.

import { buildBlueprint } from "../lib/blueprint";
import THREE_LENS from "../lib/card-meanings.json";
import { buildTimingMapModel, TimingMapJokerError } from "../lib/timing-map/model";

const [birthdate, asOf] = process.argv.slice(2);
if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
  console.error("usage: bun scripts/order-brief.ts YYYY-MM-DD [YYYY-MM-DD]");
  process.exit(2);
}
const today = asOf ? new Date(`${asOf}T12:00:00`) : new Date();

try {
  const timingMap = buildTimingMapModel(birthdate, today);
  const blueprint = await buildBlueprint(birthdate);
  const lens = (THREE_LENS as Record<string, unknown>)[timingMap.birthCard] ?? null;
  console.log(
    JSON.stringify(
      {
        birthdate,
        asOf: timingMap.todayISO,
        birthCard: timingMap.birthCard,
        birthCardLabel: timingMap.birthCardLabel,
        rulingCard: timingMap.rulingCard,
        age: timingMap.age,
        threeLens: lens,
        blueprint,
        timingMap,
      },
      null,
      2,
    ),
  );
} catch (e) {
  if (e instanceof TimingMapJokerError) {
    console.log(JSON.stringify({ birthdate, joker: true, note: "December 31 is the Joker: no yearly spread, no card-level Deep Dive." }, null, 2));
  } else {
    throw e;
  }
}
