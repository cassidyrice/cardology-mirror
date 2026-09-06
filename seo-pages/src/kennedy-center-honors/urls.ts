import { CHECKOUT_PATH } from "../urls";
import type { KennedyCenterHonor } from "./types";

export const KENNEDY_CENTER_HUB_PATH = "/kennedy-center-honors";
export const KENNEDY_CENTER_SITEMAP = "/sitemap-kennedy-center-honors.xml";
export const KC_HOME = "https://www.kennedy-center.org/whats-on/honors/";
export const HONORS_WIKI = "https://en.wikipedia.org/wiki/Kennedy_Center_Honors";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function kennedyCenterPath(slug: string): string {
  return `${KENNEDY_CENTER_HUB_PATH}/${slug}`;
}

export function kennedyCenterCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "kennedy-center-honors",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function kennedyCenterOgSlot(slug: string): string {
  return `/og/kennedy-center-honors/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedKennedyCenterSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "kennedy-center-honors slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "kennedy-center-honors slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "kennedy-center-honors slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "kennedy-center-honors slug cannot collide with a month-day date slug";
  }
  return null;
}

export function honorPhrase(honors: readonly KennedyCenterHonor[]): string {
  if (honors.length === 0) {
    return "Kennedy Center Honors recipient";
  }
  return honors
    .map((item) => {
      const role = item.role === "member" && item.act ? ` with ${item.act}` : "";
      return `${item.year} Kennedy Center Honors${role}`;
    })
    .join("; ");
}
