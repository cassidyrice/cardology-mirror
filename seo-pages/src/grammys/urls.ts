import { CHECKOUT_PATH } from "../urls";
import type { GrammyAward, GrammyBilling } from "./types";

export const GRAMMYS_HUB_PATH = "/grammys/aoty";
export const GRAMMYS_SITEMAP = "/sitemap-grammy-aoty.xml";
export const GRAMMY_HOME = "https://www.grammy.com/";
export const GRAMMY_AWARDS = "https://www.grammy.com/awards/";
export const AOTY_WIKI = "https://en.wikipedia.org/wiki/Grammy_Award_for_Album_of_the_Year";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function grammyPath(slug: string): string {
  return `${GRAMMYS_HUB_PATH}/${slug}`;
}

export function grammyCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "grammy-aoty",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function grammyOgSlot(slug: string): string {
  return `/og/grammys/aoty/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedGrammySlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "grammy slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "grammy slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "grammy slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "grammy slug cannot collide with a month-day date slug";
  }
  return null;
}

export function awardPhrase(awards: readonly GrammyAward[]): string {
  if (awards.length === 0) {
    return "Grammy Album of the Year winner";
  }
  return awards.map((award) => `${award.year} Album of the Year — ${award.album}`).join("; ");
}

export function billingPhrase(billing: GrammyBilling, billedAct: string): string {
  if (billing === "band_member") {
    return `billed with ${billedAct}`;
  }
  return `primary billed as ${billedAct}`;
}
