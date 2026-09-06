import { CHECKOUT_PATH } from "../urls";

export const OLYMPICS_HUB_PATH = "/olympics/summer";
export const OLYMPICS_SITEMAP = "/sitemap-olympics-summer.xml";
export const OLYMPICS_UTM_SOURCE = "olympics-summer";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function olympicsPath(slug: string): string {
  return `${OLYMPICS_HUB_PATH}/${slug}`;
}

export function olympicsCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: OLYMPICS_UTM_SOURCE,
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function olympicsOgSlot(slug: string): string {
  return `/og/olympics/summer/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedOlympicsSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "olympics slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "olympics slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "olympics slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "olympics slug cannot collide with a month-day date slug";
  }
  return null;
}

export function medalPhrase(input: { gold_count: number; sports: readonly string[] }): string {
  const count = input.gold_count;
  const sports = input.sports.filter((item) => item.trim().length > 0);
  const sport = sports.length > 0 ? sports.slice(0, 3).join(", ") : "Summer Olympic sport";
  const noun = count === 1 ? "gold medal" : "gold medals";
  return `${count} Summer Olympic ${noun} in ${sport}`;
}
