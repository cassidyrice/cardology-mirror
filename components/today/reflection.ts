// Card-faithful, non-mystical reflection helpers for the Today screen.
// Everything here is templated strictly from engine output (interpretation
// names, domain words, sweet-spot text) — no invented meaning.

import type { ActivePeriod, DailyCard } from "@/lib/types";

// First clause of a sweet-spot line, lower-cased — used for the blunt one-liner.
export function bluntLine(period: ActivePeriod): string {
  const raw = period.interpretation_bc.sweet_spot.trim();
  // Take the leading verb-phrase up to the first comma or sentence end.
  const clause = raw.split(/[,.]/)[0].trim();
  // Strip the "You're " lead so it reads as an editorial imperative.
  const stripped = clause.replace(/^you'?re\s+/i, "").trim();
  if (!stripped) return raw;
  const head = stripped.charAt(0).toUpperCase() + stripped.slice(1);
  return `${head} — assuming you stay out of your own way.`;
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

// "Saturn sub-period · within your Mars chapter"
export function dailyLabel(daily: DailyCard): string {
  return `${daily.sub_planet} sub-period · within your ${daily.period_planet} chapter`;
}

// Blunt one-liner for the daily card, templated from its sweet-spot text.
export function dailyLine(daily: DailyCard): string {
  const interp = daily.bc.interpretation;
  if (!interp) return "A quieter day in the pattern.";
  const clause = interp.sweet_spot.trim().split(/[,.]/)[0].trim();
  const stripped = clause.replace(/^you'?re\s+/i, "").trim();
  if (!stripped) return interp.sweet_spot.trim();
  return stripped.charAt(0).toUpperCase() + stripped.slice(1) + " — today's slice of it.";
}

// One introspective question built from the two active cards + domain.
export function reflectionPrompt(period: ActivePeriod): string {
  const bc = cardName(period.interpretation_bc.name);
  const prc = cardName(period.interpretation_prc.name);
  const domain = domainLead(period);
  return `In the realm of ${domain} today, where does your ${bc} pattern quietly slide into "under" or "over" while you tell yourself it's fine — and what would the balanced version of your ${prc} actually make you do about it?`;
}
