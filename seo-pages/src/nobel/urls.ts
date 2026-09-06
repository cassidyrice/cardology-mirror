import { CHECKOUT_PATH } from "../urls";

export const NOBEL_HUB_PATH = "/nobel";
export const NOBEL_SITEMAP = "/sitemap-nobel.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function nobelPath(slug: string): string {
  return `${NOBEL_HUB_PATH}/${slug}`;
}

export function nobelHubPath(): string {
  return NOBEL_HUB_PATH;
}

export function nobelCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "nobel",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function nobelOgSlot(slug: string): string {
  return `/og/nobel/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function reservedNobelSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "nobel slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "nobel slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "nobel slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "nobel slug cannot collide with a month-day date slug";
  }
  return null;
}

export function prizePhrase(prizes: readonly { year: string; category: string }[]): string {
  if (prizes.length === 0) {
    return "Nobel laureate";
  }
  return prizes.map((prize) => `${prize.year} ${prize.category}`).join("; ");
}
