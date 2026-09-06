import { CHECKOUT_PATH } from "../urls";
import type { TimePotyHonor } from "./types";

export const TIME_POTY_HUB_PATH = "/time-person-of-the-year";
export const TIME_POTY_SITEMAP = "/sitemap-time-person-of-the-year.xml";
export const TIME_HOME = "https://time.com/";
export const TIME_VAULT = "https://time.com/vault/";
export const TIME_POTY = "https://time.com/person-of-the-year/";
export const POTY_WIKI = "https://en.wikipedia.org/wiki/Time_Person_of_the_Year";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function timePotyPath(slug: string): string {
  return `${TIME_POTY_HUB_PATH}/${slug}`;
}

export function timePotyCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "time-poty",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function timePotyOgSlot(slug: string): string {
  return `/og/time-person-of-the-year/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedTimePotySlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "time-poty slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "time-poty slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "time-poty slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "time-poty slug cannot collide with a month-day date slug";
  }
  return null;
}

export function honorPhrase(honors: readonly TimePotyHonor[]): string {
  if (honors.length === 0) {
    return "TIME Person of the Year";
  }
  return honors
    .map((honor) => {
      const share = honor.shared ? " (shared)" : "";
      return `${honor.year} TIME Person of the Year — ${honor.choice_label}${share}`;
    })
    .join("; ");
}
