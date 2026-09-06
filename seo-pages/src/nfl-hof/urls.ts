import { CHECKOUT_PATH } from "../urls";

export const NFL_HOF_HUB_PATH = "/nfl-hof";
export const NFL_HOF_SITEMAP = "/sitemap-nfl-hof.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function hofPath(slug: string): string {
  return `${NFL_HOF_HUB_PATH}/${slug}`;
}

export function hofCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "nfl-hof",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function hofOgSlot(slug: string): string {
  return `/og/nfl-hof/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedHofSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "nfl-hof slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "nfl-hof slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "nfl-hof slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "nfl-hof slug cannot collide with a month-day date slug";
  }
  return null;
}

export function inducteePhrase(person: { induction_year: string | null; hof_id: string }): string {
  if (person.induction_year) {
    return `${person.induction_year} Pro Football Hall of Fame inductee`;
  }
  return "Pro Football Hall of Fame inductee";
}
