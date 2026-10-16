import type { Metadata } from "next";

import pages from "@/content/born-on/pages.json";

// Birthday pages ported verbatim from the cardology-unlock Worker
// (src/born-on.js, snapshot 2026-10-15). Key "" is the /born-on/ index.
export type BornOnPage = {
  title: string;
  description: string;
  canonical: string;
  jsonld: unknown;
  body: string;
};

const PAGES = pages as Record<string, BornOnPage>;

export const BORN_ON_INDEX_PATH = "/born-on/";

export function bornOnSlugs(): string[] {
  return Object.keys(PAGES).filter((slug) => slug !== "");
}

export function bornOnPage(slug: string): BornOnPage | null {
  return Object.prototype.hasOwnProperty.call(PAGES, slug) ? PAGES[slug] : null;
}

export function bornOnMetadata(page: BornOnPage): Metadata {
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "article",
      url: page.canonical,
      siteName: "Card Blueprints",
      images: ["https://cardblueprints.com/og/default.png"],
    },
    twitter: { card: "summary_large_image", images: ["https://cardblueprints.com/og/default.png"] },
  };
}
