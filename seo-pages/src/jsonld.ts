import { SITE_NAME, SITE_URL, type Breadcrumb, type FaqItem } from "./types";
import { abs } from "./urls";

export type JsonLdRecord = Record<string, unknown>;

/**
 * E-E-A-T identity. The author is the real person named on /about — do not add
 * credentials, titles, or a byline for anyone who is not accountable for the page.
 */
export const PAGE_AUTHOR = {
  "@type": "Person",
  name: "Cassidy Rice",
  url: abs("/about"),
} as const;

export const PAGE_PUBLISHER = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
} as const;

/**
 * Article node carrying authorship, publisher and dates for a hub page.
 * `citation` should list the primary sources the page's dates came from.
 */
export function articleJsonLd(input: {
  headline: string;
  urlPath: string;
  description: string;
  datePublished: string;
  dateModified: string;
  citations?: readonly string[];
}): JsonLdRecord {
  return {
    "@type": "Article",
    headline: input.headline,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(input.urlPath) },
    url: abs(input.urlPath),
    description: input.description,
    author: PAGE_AUTHOR,
    publisher: PAGE_PUBLISHER,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    ...(input.citations && input.citations.length
      ? { citation: input.citations.map((url) => ({ "@type": "CreativeWork", url })) }
      : {}),
  };
}

export function personJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
  birthDate: string;
  image?: string;
}): JsonLdRecord {
  return {
    "@type": "Person",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    birthDate: input.birthDate,
    ...(input.image ? { image: abs(input.image) } : {}),
  };
}

export function breadcrumbJsonLd(items: readonly Breadcrumb[]): JsonLdRecord {
  if (items.length < 2) {
    throw new Error("BreadcrumbList requires at least two items");
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.href),
    })),
  };
}

export function faqPageJsonLd(faqs: readonly FaqItem[]): JsonLdRecord {
  if (faqs.length < 1) {
    throw new Error("FAQPage requires at least one question");
  }

  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function administrativeAreaJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
}): JsonLdRecord {
  return {
    "@type": "AdministrativeArea",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function itemListJsonLd(
  items: readonly { name: string; urlPath: string }[],
): JsonLdRecord {
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: abs(item.urlPath),
    })),
  };
}

export function sportsTeamJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
  foundingDate: string;
}): JsonLdRecord {
  return {
    "@type": "SportsTeam",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    foundingDate: input.foundingDate,
    sport: "American football",
    memberOf: {
      "@type": "SportsOrganization",
      name: "National Football League",
    },
  };
}

export function mlbTeamJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
  foundingDate: string;
}): JsonLdRecord {
  return {
    "@type": "SportsTeam",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    foundingDate: input.foundingDate,
    sport: "Baseball",
    memberOf: {
      "@type": "SportsOrganization",
      name: "Major League Baseball",
    },
  };
}

export function parkJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
  foundingDate: string;
}): JsonLdRecord {
  return {
    "@type": "Park",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    foundingDate: input.foundingDate,
    isPartOf: {
      "@type": "GovernmentOrganization",
      name: "National Park Service",
    },
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  urlPath: string;
  description: string;
}): JsonLdRecord {
  return {
    "@type": "CollectionPage",
    name: input.name,
    url: abs(input.urlPath),
    description: input.description,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function jsonLdGraph(nodes: readonly JsonLdRecord[]): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
