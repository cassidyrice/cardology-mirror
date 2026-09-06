import { CHECKOUT_PATH } from "./urls";

const FRANCHISE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export const FRANCHISE_HUB_PATH = "/franchise";
export const FRANCHISE_SITEMAP_PATH = "/sitemap-franchises.xml";

export function franchisePath(slug: string): string {
  return `${FRANCHISE_HUB_PATH}/${slug}`;
}

export function franchiseCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "nfl",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedFranchiseSlugReason(slug: string): string | null {
  if (!FRANCHISE_SLUG_RE.test(slug)) {
    return "franchise slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "franchise slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "franchise slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "franchise slug cannot collide with a month-day date slug";
  }
  return null;
}

export function assertFranchiseSlug(slug: string): void {
  const reason = reservedFranchiseSlugReason(slug);
  if (reason) {
    throw new Error(`Invalid franchise slug "${slug}": ${reason}`);
  }
}
