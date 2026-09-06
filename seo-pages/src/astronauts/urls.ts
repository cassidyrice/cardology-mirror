import { CHECKOUT_PATH } from "../urls";

export const ASTRONAUTS_HUB_PATH = "/astronauts";
export const ASTRONAUTS_SITEMAP = "/sitemap-astronauts.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function astronautPath(slug: string): string {
  return `${ASTRONAUTS_HUB_PATH}/${slug}`;
}

export function astronautCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "astronauts",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function astronautOgSlot(slug: string): string {
  return `/og/astronauts/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedAstronautSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "astronaut slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "astronaut slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "astronaut slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "astronaut slug cannot collide with a month-day date slug";
  }
  return null;
}

export function corpsPhrase(person: { status: string; group: string; flights: number }): string {
  const group = person.group ? `NASA Group ${person.group}` : "NASA astronaut";
  const flights =
    person.flights === 0
      ? "selected, no flights in the Fact Book table"
      : person.flights === 1
        ? "1 flight"
        : `${person.flights} flights`;
  return `${group} · ${person.status} · ${flights}`;
}
