import { CHECKOUT_PATH } from "../../urls";

export const WINTER_HUB_PATH = "/olympics/winter";
export const WINTER_SITEMAP = "/sitemap-olympics-winter.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function winterPath(slug: string): string {
  return `${WINTER_HUB_PATH}/${slug}`;
}

export function winterCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "olympics-winter",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function winterOgSlot(slug: string): string {
  return `/og/olympics/winter/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedWinterSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "winter olympic slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "winter olympic slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "winter olympic slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "winter olympic slug cannot collide with a month-day date slug";
  }
  return null;
}

export function medalPhrase(person: {
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}): string {
  return `${person.name}: ${person.total} Winter Olympic medals (${person.gold} gold, ${person.silver} silver, ${person.bronze} bronze)`;
}
