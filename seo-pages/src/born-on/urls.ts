import { CHECKOUT_PATH, birthdaySlug } from "../urls";

export const BORN_ON_HUB_PATH = "/born-on";
export const BORN_ON_SITEMAP = "/sitemap-born-on.xml";

const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function bornOnHubPath(): string {
  return BORN_ON_HUB_PATH;
}

export function bornOnDayPath(slug: string): string {
  return `${BORN_ON_HUB_PATH}/${slug}`;
}

export function bornOnDayPathFromParts(month: number, day: number): string {
  return bornOnDayPath(birthdaySlug(month, day));
}

export function bornOnCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "born-on",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function bornOnOgSlot(slug: string): string {
  return `/og/born-on/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function isBornOnDaySlug(slug: string): boolean {
  return DATE_SLUG_RE.test(slug);
}

export function adjacentDay(
  days: readonly { slug: string; month: number; day: number }[],
  slug: string,
  offset: -1 | 1,
): { slug: string; month: number; day: number } {
  const index = days.findIndex((day) => day.slug === slug);
  if (index < 0) {
    throw new Error(`Unknown born-on slug: ${slug}`);
  }
  const next = days[(index + offset + days.length) % days.length];
  if (!next) {
    throw new Error(`Missing adjacent day for ${slug}`);
  }
  return next;
}
