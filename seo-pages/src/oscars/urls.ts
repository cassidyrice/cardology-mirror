import { CHECKOUT_PATH } from "../urls";
import type { OscarAward } from "./types";

export const OSCARS_HUB_PATH = "/oscars";
export const OSCARS_SITEMAP = "/sitemap-oscars.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function oscarPath(slug: string): string {
  return `${OSCARS_HUB_PATH}/${slug}`;
}

export function oscarCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "oscars",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function oscarOgSlot(slug: string): string {
  return `/og/oscars/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedOscarSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "oscar slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "oscar slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "oscar slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "oscar slug cannot collide with a month-day date slug";
  }
  return null;
}

export function awardPhrase(awards: readonly OscarAward[]): string {
  if (awards.length === 0) {
    return "Academy Award winner";
  }
  return awards
    .map((award) => `${award.year} ${award.category} — ${award.film}`)
    .join("; ");
}

export function categoryLabel(awards: readonly OscarAward[]): string {
  const ids = new Set(awards.map((award) => award.category_id));
  if (ids.has("best-actor") && ids.has("best-actress")) {
    return "Best Actor and Best Actress";
  }
  if (ids.has("best-actress")) {
    return "Best Actress";
  }
  return "Best Actor";
}
