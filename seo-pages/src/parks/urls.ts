import { CHECKOUT_PATH } from "../urls";

const PARK_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export const PARKS_HUB_PATH = "/parks";
export const PARKS_SITEMAP_PATH = "/sitemap-parks.xml";

export function parkPath(slug: string): string {
  return `${PARKS_HUB_PATH}/${slug}`;
}

export function parksHubPath(): string {
  return PARKS_HUB_PATH;
}

export function parksCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "parks",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedParkSlugReason(slug: string): string | null {
  if (!PARK_SLUG_RE.test(slug)) {
    return "park slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "park slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "park slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "park slug cannot collide with a month-day date slug";
  }
  return null;
}

export function assertParkSlug(slug: string): void {
  const reason = reservedParkSlugReason(slug);
  if (reason) {
    throw new Error(`Invalid park slug "${slug}": ${reason}`);
  }
}
