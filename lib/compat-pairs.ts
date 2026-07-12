// Per-card links into the Worker-served /compatibility/ pair library
// (cardology-unlock renders 1,378 pair pages + 52 per-card hubs at the edge).
// lib/compat-pairs.json is generated from the Worker's own report_data.json by
// scripts/generate_compat_pairs.py — hrefs are pre-canonicalized (deck order),
// so linking them never burns a 301.

import PAIRS from "./compat-pairs.json";

export type CompatPair = { pos: string; label: string; href: string };
export type CompatEntry = { hub: string; pairs: CompatPair[] };

const ALL = PAIRS as Record<string, CompatEntry>;

export function compatForCard(slug: string): CompatEntry | null {
  return ALL[slug] ?? null;
}
