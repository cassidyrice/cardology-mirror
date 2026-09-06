import {
  MONTH_SLUGS,
  SITE_URL,
  type CardRef,
  type EnrichedPerson,
} from "./types";

export const CHECKOUT_PATH = "/checkout/personal-card-blueprint";
export const CREATE_CHECKOUT_STUB_PATH = "/create-checkout";

const CARD_SLUG_RE =
  /^(ace|[2-9]|10|jack|queen|king)-of-(hearts|diamonds|clubs|spades)$/;
const DATE_SLUG_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)-([1-9]|[12]\d|3[01])$/;
const PERSON_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function abs(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function personPath(slug: string): string {
  return `/birth-card/${slug}`;
}

export function cardHubPath(card: Pick<CardRef, "slug">): string {
  return `/card/${card.slug}`;
}

export function birthdayPath(month: number, day: number): string {
  return `/birthday/${birthdaySlug(month, day)}`;
}

export function birthdaySlug(month: number, day: number): string {
  const monthSlug = MONTH_SLUGS[month - 1];
  if (!monthSlug) {
    throw new Error(`Invalid month: ${month}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}`);
  }
  return `${monthSlug}-${day}`;
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) {
    throw new Error(`birth_date must be YYYY-MM-DD, got ${iso}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return { year, month, day };
}

export function formatMonthDay(month: number, day: number): string {
  const monthName = MONTH_SLUGS[month - 1];
  if (!monthName) {
    throw new Error(`Invalid month: ${month}`);
  }
  return `${capitalize(monthName)} ${day}`;
}

export function formatDisplayDate(iso: string): string {
  const { year, month, day } = parseIsoDate(iso);
  return `${formatMonthDay(month, day)}, ${year}`;
}

export function checkoutHref(slug: string): string {
  const params = new URLSearchParams({
    utm_source: "celeb",
    utm_content: slug,
  });
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

export function reservedPersonSlugReason(slug: string): string | null {
  if (!PERSON_SLUG_RE.test(slug)) {
    return "person slug must be lowercase kebab-case";
  }
  if (slug === "joker") {
    return "person slug cannot be 'joker' (card hub / existing Next.js page)";
  }
  if (CARD_SLUG_RE.test(slug)) {
    return "person slug cannot collide with a 52-card slug";
  }
  if (DATE_SLUG_RE.test(slug)) {
    return "person slug cannot collide with a month-day date slug";
  }
  return null;
}

export function assertPersonSlug(slug: string): void {
  const reason = reservedPersonSlugReason(slug);
  if (reason) {
    throw new Error(`Invalid person slug "${slug}": ${reason}`);
  }
}

export function isJokerPerson(person: EnrichedPerson): boolean {
  return person.card.kind === "joker";
}

export function isJokerDate(iso: string): boolean {
  const { month, day } = parseIsoDate(iso);
  return month === 12 && day === 31;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
