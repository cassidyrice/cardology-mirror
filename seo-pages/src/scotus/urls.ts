import { CHECKOUT_PATH } from "../urls";
import type { ScotusRole } from "./types";

export const SCOTUS_HUB_PATH = "/scotus";
export const SCOTUS_SITEMAP = "/sitemap-scotus.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function scotusPath(slug: string): string {
  return `${SCOTUS_HUB_PATH}/${slug}`;
}

export function scotusHubPath(): string {
  return SCOTUS_HUB_PATH;
}

export function scotusCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "scotus",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function scotusOgSlot(slug: string): string {
  return `/og/scotus/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function reservedScotusSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "scotus slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "scotus slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "scotus slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "scotus slug cannot collide with a month-day date slug";
  }
  return null;
}

export function officePhrase(role: ScotusRole): string {
  switch (role) {
    case "Chief Justice of the United States":
      return "Chief Justice of the United States";
    case "Associate Justice":
      return "Associate Justice of the Supreme Court";
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}
