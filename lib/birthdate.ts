/**
 * Birth-date helpers for checkout prefill.
 * Dates are fulfillment input only — never log the raw value.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_FLEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
// Month/day/year, US order. The four-digit year keeps this from matching ISO.
const US_MDY = /^(\d{1,2})[/\- ](\d{1,2})[/\- ](\d{4})$/;

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1 || year > 9999) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Real calendar date as YYYY-MM-DD.
 * Accepts ISO (padded or not) and US month/day/year (`2/17/1991`, `02-17-1991`).
 * Impossible dates (Feb 30, Feb 29 in a non-leap year, month 13) return null.
 */
export function canonicalCalendarDate(value: string): string | null {
  const raw = value.trim();
  const iso = ISO_FLEX.exec(raw);
  const us = iso ? null : US_MDY.exec(raw);
  if (!iso && !us) return null;
  const year = Number(iso ? iso[1] : us![3]);
  const month = Number(iso ? iso[2] : us![1]);
  const day = Number(iso ? iso[3] : us![2]);
  if (!isRealCalendarDate(year, month, day)) return null;
  return toIso(year, month, day);
}

/** Return YYYY-MM-DD when the value is a real calendar date in a sane range. */
export function sanitizeBirthdateISO(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  const match = ISO_DATE.exec(normalized);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const nowYear = new Date().getUTCFullYear();
  if (year < 1900 || year > nowYear) return "";
  if (!isRealCalendarDate(year, month, day)) return "";

  return normalized;
}

type StripeBirthdateSource = {
  metadata?: Record<string, string> | null;
  custom_fields?: Array<{
    key?: string | null;
    text?: { value?: string | null } | null;
  }> | null;
};

/** Prefer session metadata (our date picker), then in-flight Stripe text fields. */
export function birthdateFromCheckoutSession(
  session: StripeBirthdateSource | null | undefined,
): string {
  if (!session) return "";
  const fromMeta =
    sanitizeBirthdateISO(session.metadata?.birthdate) ||
    sanitizeBirthdateISO(session.metadata?.birthday);
  if (fromMeta) return fromMeta;
  const raw =
    session.custom_fields?.find((field) => field.key === "birthdate")?.text
      ?.value ?? "";
  return sanitizeBirthdateISO(raw);
}
