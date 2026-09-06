import { CHECKOUT_PATH } from "../urls";

const HOLIDAY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;

export const HOLIDAYS_HUB_PATH = "/holidays";
export const HOLIDAYS_SITEMAP = "/sitemap-holidays.xml";

export function holidayPath(slug: string): string {
  return `${HOLIDAYS_HUB_PATH}/${slug}`;
}

export function holidaysHubPath(): string {
  return HOLIDAYS_HUB_PATH;
}

export function holidaysCheckoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "holidays",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedHolidaySlugReason(slug: string): string | null {
  if (!HOLIDAY_SLUG_RE.test(slug)) {
    return "holiday slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "holiday slug cannot be 'joker'";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "holiday slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "holiday slug cannot collide with a month-day date slug";
  }
  return null;
}

export function assertHolidaySlug(slug: string): void {
  const reason = reservedHolidaySlugReason(slug);
  if (reason) {
    throw new Error(`Invalid holiday slug "${slug}": ${reason}`);
  }
}
