import { CHECKOUT_PATH } from "../urls";

export const CABINET_HUB_PATH = "/cabinet";
export const CABINET_SITEMAP = "/sitemap-cabinet.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function cabinetPath(slug: string): string {
  return `${CABINET_HUB_PATH}/${slug}`;
}

export function cabinetCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "cabinet",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function cabinetOgSlot(slug: string): string {
  return `/og/cabinet/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function wikidataPath(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function reservedCabinetSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "cabinet slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "cabinet slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "cabinet slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "cabinet slug cannot collide with a month-day date slug";
  }
  return null;
}

export function officePhrase(office: string, acting: boolean): string {
  if (acting && !office.toLowerCase().startsWith("acting ")) {
    return `Acting ${office}`;
  }
  return office;
}
