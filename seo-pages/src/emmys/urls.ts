import { CHECKOUT_PATH } from "../urls";

export const EMMYS_HUB_PATH = "/emmys";
export const EMMYS_SITEMAP = "/sitemap-emmys.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function emmyPath(slug: string): string {
  return `${EMMYS_HUB_PATH}/${slug}`;
}

export function emmyCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "emmys",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function emmyOgSlot(slug: string): string {
  return `/og/emmys/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedEmmySlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "emmy slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "emmy slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "emmy slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "emmy slug cannot collide with a month-day date slug";
  }
  return null;
}

export function winPhrase(wins: readonly { year: string; label: string; program: string | null }[]): string {
  if (wins.length === 0) {
    return "Primetime Emmy winner";
  }
  return wins
    .map((win) => {
      const program = win.program ? ` (${win.program})` : "";
      return `${win.year} ${win.label}${program}`;
    })
    .join("; ");
}
