import { CHECKOUT_PATH } from "../urls";

export const PRESIDENTS_HUB_PATH = "/presidents";
export const PRESIDENTS_SITEMAP = "/sitemap-presidents.xml";

export function presidentPath(slug: string): string {
  return `${PRESIDENTS_HUB_PATH}/${slug}`;
}

export function presidentCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "presidents",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function presidentOgSlot(slug: string): string {
  return `/og/presidents/${slug}.png`;
}

export function cardMeaningPath(cardSlug: string): string {
  return `/birth-card/${cardSlug}`;
}

export function ordinalLabel(value: string | null): string | null {
  if (!value || !/^\d+$/.test(value)) {
    return value;
  }
  const n = Number(value);
  const mod100 = n % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

export function presidencyPhrase(ordinals: readonly (string | null)[]): string {
  const labels = ordinals
    .map((value) => ordinalLabel(value))
    .filter((value): value is string => Boolean(value));
  if (labels.length === 0) {
    return "U.S. president";
  }
  if (labels.length === 1) {
    return `${labels[0]} President of the United States`;
  }
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]} President of the United States`;
}
