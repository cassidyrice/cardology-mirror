import type { Metadata } from "next";

import {
  renderCardHub,
  renderCompatIndex,
  renderPairPage,
  SLUG_TO_CARD,
  ORDER,
  cardSlug,
  canonicalPair,
  pairSlug,
  type WorkerPage,
} from "@/lib/worker-port/cardology-unlock.mjs";
import { bornOnMetadata } from "@/lib/born-on";

// /compatibility pages, rendered at build time by the verbatim port of the
// cardology-unlock Worker's compatibility.js (same body, title, description,
// canonical and JSON-LD the Worker served).
export type CompatPage = { title: string; description: string; canonical: string; jsonld: unknown; body: string };

function toPage(p: WorkerPage): CompatPage {
  return { title: p.title, description: p.desc, canonical: p.canonical, jsonld: p.jsonld, body: p.body };
}

/** Every /compatibility/<slug> URL the Worker served 200 for (hubs + canonical pairs). */
export function compatSlugs(): string[] {
  const hubs = ORDER.map(cardSlug);
  const pairs: string[] = [];
  for (let i = 0; i < ORDER.length; i++) {
    for (let j = i; j < ORDER.length; j++) pairs.push(pairSlug(ORDER[i], ORDER[j]));
  }
  return [...hubs, ...pairs];
}

export function compatIndexPage(): CompatPage {
  return toPage(renderCompatIndex());
}

export function compatPage(slug: string): CompatPage | null {
  if (slug.includes("-and-")) {
    const [sa, sb] = slug.split("-and-");
    const a = SLUG_TO_CARD[sa], b = SLUG_TO_CARD[sb];
    if (!a || !b) return null;
    const [ca, cb] = canonicalPair(a, b);
    if (pairSlug(ca, cb) !== slug) return null;
    return toPage(renderPairPage(ca, cb));
  }
  const card = SLUG_TO_CARD[slug];
  return card ? toPage(renderCardHub(card)) : null;
}

export const compatMetadata = (page: CompatPage): Metadata => bornOnMetadata(page);
