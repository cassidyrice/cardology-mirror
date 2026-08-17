/**
 * Birth-date helpers for checkout prefill.
 * Dates are fulfillment input only — never log the raw value.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

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

  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return "";
  }

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
  const fromMeta = sanitizeBirthdateISO(session.metadata?.birthdate);
  if (fromMeta) return fromMeta;
  const raw =
    session.custom_fields?.find((field) => field.key === "birthdate")?.text
      ?.value ?? "";
  return sanitizeBirthdateISO(raw);
}
