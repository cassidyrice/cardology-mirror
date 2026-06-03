// Card-faithful, non-mystical reflection helpers for the Today screen.
// Everything here is templated strictly from engine output (interpretation
// names, domain words, sweet-spot text) — no invented meaning.

import type { ActivePeriod } from "@/lib/types";

// First clause of a sweet-spot line, lower-cased — used for the blunt one-liner.
export function bluntLine(period: ActivePeriod): string {
  const raw = period.interpretation_bc.sweet_spot.trim();
  // Take the leading verb-phrase up to the first comma or sentence end.
  const clause = raw.split(/[,.]/)[0].trim();
  // Strip the "You're " lead so it reads as an editorial imperative.
  const stripped = clause.replace(/^you'?re\s+/i, "").trim();
  if (!stripped) return raw;
  const head = stripped.charAt(0).toUpperCase() + stripped.slice(1);
  return `${head} — if you let it.`;
}

// The first listed domain word, e.g. "action" from "action, drive, assertion".
export function domainLead(period: ActivePeriod): string {
  return period.domain.split(",")[0].trim();
}

// "Mars chapter · action, drive"
export function chapterLabel(period: ActivePeriod): string {
  const two = period.domain
    .split(",")
    .slice(0, 2)
    .map((d) => d.trim())
    .join(", ");
  return `${period.planet} chapter · ${two}`;
}

function cardName(name: string): string {
  // "10 OF HEARTS" -> "10 of Hearts"
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

// One introspective question built from the two active cards + domain.
export function reflectionPrompt(period: ActivePeriod): string {
  const bc = cardName(period.interpretation_bc.name);
  const prc = cardName(period.interpretation_prc.name);
  const domain = domainLead(period);
  return `In the realm of ${domain} today, where does your ${bc} pattern drift toward "under" or "over" — and what would the balanced version of your ${prc} ask you to do instead?`;
}
