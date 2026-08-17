/** Tab-scoped checkout birth date. Never put this value in a URL. */

import { sanitizeBirthdateISO } from "@/lib/birthdate";

export const CHECKOUT_BIRTHDATE_KEY = "cb_checkout_birthdate";
export const PERSONAL_CHECKOUT_PATH = "/checkout/personal-card-blueprint";

export function storeCheckoutBirthdate(value: string): string {
  const iso = sanitizeBirthdateISO(value);
  if (typeof window === "undefined" || !iso) return "";
  try {
    window.sessionStorage.setItem(CHECKOUT_BIRTHDATE_KEY, iso);
  } catch {
    // Private mode / quota — checkout can still collect the date at Stripe.
  }
  return iso;
}

export function readCheckoutBirthdate(): string {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeBirthdateISO(window.sessionStorage.getItem(CHECKOUT_BIRTHDATE_KEY));
  } catch {
    return "";
  }
}

export function personalCheckoutHref(): string {
  return PERSONAL_CHECKOUT_PATH;
}
