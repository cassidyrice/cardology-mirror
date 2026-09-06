import { CHECKOUT_PATH } from "../urls";
import type { TonyCategory, TonyWin } from "./types";

export const TONYS_HUB_PATH = "/tonys";
export const TONYS_SITEMAP = "/sitemap-tonys.xml";

const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export function tonyPath(slug: string): string {
  return `${TONYS_HUB_PATH}/${slug}`;
}

export function tonyHubPath(): string {
  return TONYS_HUB_PATH;
}

export function tonyCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "tonys",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function tonyOgSlot(slug: string): string {
  return `/og/tonys/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function reservedTonySlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "tony slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "tony slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "tony slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "tony slug cannot collide with a month-day date slug";
  }
  return null;
}

export function categoryLabel(category: TonyCategory): string {
  switch (category) {
    case "actor_play":
      return "Best Actor in a Play";
    case "actress_play":
      return "Best Actress in a Play";
    case "actor_musical":
      return "Best Actor in a Musical";
    case "actress_musical":
      return "Best Actress in a Musical";
    default: {
      const exhaustive: never = category;
      throw new Error(`unhandled Tony category: ${exhaustive}`);
    }
  }
}

export function winPhrase(wins: readonly TonyWin[]): string {
  if (wins.length === 0) {
    return "Tony Award leading-acting winner";
  }
  return wins
    .map((win) => `${win.year} ${win.category_label}${win.production ? ` (${win.production})` : ""}`)
    .join("; ");
}
