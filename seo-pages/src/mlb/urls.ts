import { CHECKOUT_PATH } from "../urls";

const MLB_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export const MLB_HUB_PATH = "/mlb";
export const MLB_SITEMAP_PATH = "/sitemap-mlb.xml";

export function mlbPath(slug: string): string {
  return `${MLB_HUB_PATH}/${slug}`;
}

export function mlbCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "mlb",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedMlbSlugReason(slug: string): string | null {
  if (!MLB_SLUG_RE.test(slug)) {
    return "mlb slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "mlb slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "mlb slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "mlb slug cannot collide with a month-day date slug";
  }
  return null;
}

export function assertMlbSlug(slug: string): void {
  const reason = reservedMlbSlugReason(slug);
  if (reason) {
    throw new Error(`Invalid mlb slug "${slug}": ${reason}`);
  }
}
