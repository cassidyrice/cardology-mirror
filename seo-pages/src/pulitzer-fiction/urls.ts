import { CHECKOUT_PATH } from "../urls";
import type { PulitzerAward } from "./types";

export const PULITZER_HUB_PATH = "/pulitzer/fiction";
export const PULITZER_SITEMAP = "/sitemap-pulitzer-fiction.xml";
export const PULITZER_HOME = "https://www.pulitzer.org/";
export const PULITZER_FICTION = "https://www.pulitzer.org/prize-winners-by-category/219";
export const FICTION_WIKI = "https://en.wikipedia.org/wiki/Pulitzer_Prize_for_Fiction";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function pulitzerPath(slug: string): string {
  return `${PULITZER_HUB_PATH}/${slug}`;
}

export function pulitzerCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "pulitzer-fiction",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function pulitzerOgSlot(slug: string): string {
  return `/og/pulitzer/fiction/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedPulitzerSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "pulitzer fiction slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "pulitzer fiction slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "pulitzer fiction slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "pulitzer fiction slug cannot collide with a month-day date slug";
  }
  return null;
}

export function awardPhrase(awards: readonly PulitzerAward[]): string {
  if (awards.length === 0) {
    return "Pulitzer Prize for Fiction winner";
  }
  return awards
    .map((award) => {
      const share = award.shared ? " (shared)" : "";
      return `${award.year} Pulitzer Prize for Fiction — ${award.work}${share}`;
    })
    .join("; ");
}
