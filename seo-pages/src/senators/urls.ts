import { CHECKOUT_PATH } from "../urls";
import type { SenatorParty } from "./types";

export const SENATORS_HUB_PATH = "/senators";
export const SENATORS_SITEMAP = "/sitemap-senators.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function senatorPath(slug: string): string {
  return `${SENATORS_HUB_PATH}/${slug}`;
}

export function senatorCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "senators",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function senatorOgSlot(slug: string): string {
  return `/og/senators/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedSenatorSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "senator slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "senator slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "senator slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "senator slug cannot collide with a month-day date slug";
  }
  return null;
}

export function officePhrase(state: string, senateClass: string): string {
  return `U.S. senator from ${state} (Class ${senateClass})`;
}

export function partyLabel(party: SenatorParty): string {
  switch (party) {
    case "Democrat":
      return "Democratic";
    case "Republican":
      return "Republican";
    case "Independent":
      return "Independent";
    default: {
      const exhaustive: never = party;
      return exhaustive;
    }
  }
}
