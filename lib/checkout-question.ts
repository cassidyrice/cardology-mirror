/** Tab-scoped checkout context for the One Question Reading: the question draft
 *  and where the buyer came from. Never put any of this in a URL. */

import { sanitizeQuestion, QUESTION_MAX_CHARS } from "@/lib/deep-dive";

export const CHECKOUT_QUESTION_KEY = "cb_checkout_question";
export const CHECKOUT_CONTEXT_KEY = "cb_checkout_context";

export type CheckoutContext = {
  source?: string;
  cardLabel?: string;
  cardSlug?: string;
};

/** Store the raw draft (even when too short) so a typed question survives a Stripe cancel. */
export function storeCheckoutQuestion(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CHECKOUT_QUESTION_KEY,
      value.slice(0, QUESTION_MAX_CHARS),
    );
  } catch {
    // Private mode / quota: the review page still collects the question.
  }
}

export function readCheckoutQuestionDraft(): string {
  if (typeof window === "undefined") return "";
  try {
    return (window.sessionStorage.getItem(CHECKOUT_QUESTION_KEY) ?? "").slice(
      0,
      QUESTION_MAX_CHARS,
    );
  } catch {
    return "";
  }
}

export function readCheckoutQuestion(): string {
  return sanitizeQuestion(readCheckoutQuestionDraft());
}

export function storeCheckoutContext(context: CheckoutContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // ignore
  }
}

export function readCheckoutContext(): CheckoutContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (key: string) =>
      typeof parsed[key] === "string" ? (parsed[key] as string).slice(0, 80) : undefined;
    return { source: pick("source"), cardLabel: pick("cardLabel"), cardSlug: pick("cardSlug") };
  } catch {
    return {};
  }
}
