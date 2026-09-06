import { CHECKOUT_PATH } from "../urls";
import type { RockHallInduction } from "./types";

export const ROCK_HALL_HUB_PATH = "/rock-hall";
export const ROCK_HALL_SITEMAP = "/sitemap-rock-hall.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function rockHallPath(slug: string): string {
  return `${ROCK_HALL_HUB_PATH}/${slug}`;
}

export function rockHallCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "rock-hall",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function rockHallOgSlot(slug: string): string {
  return `/og/rock-hall/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedRockHallSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "rock-hall slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "rock-hall slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "rock-hall slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "rock-hall slug cannot collide with a month-day date slug";
  }
  return null;
}

export function inductionPhrase(inductions: readonly RockHallInduction[]): string {
  if (inductions.length === 0) {
    return "Rock & Roll Hall of Fame inductee";
  }
  return inductions
    .map((item) => {
      const role = item.role === "member" && item.act ? ` with ${item.act}` : "";
      return `${item.year} Performers${role}`;
    })
    .join("; ");
}
