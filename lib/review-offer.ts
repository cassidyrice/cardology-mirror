// Review thank-you offer (Cass, 2026-10-26).
// The code must exist on Stan (product > Checkout Page > Advanced > Add Discount Code, Creator Pro).
export const REVIEW_DISCOUNT_CODE = "THANKYOU50";
export const REVIEW_DISCOUNT_PERCENT = 50;
export const REVIEW_STORE_URL =
  "https://stan.store/mycardblueprint?utm_source=cardblueprints&utm_medium=review&utm_campaign=thank-you-50";
export const REVIEW_COMMENT_MAX = 280;
export const REVIEW_NAME_MAX = 40;

export type ReviewInput = { firstName: string; rating: number; comment: string; reading: string; consent: boolean };

const READINGS = ["Chemistry Check", "12-Month Timing Map", "Family Snapshot", "Birth Card Blueprint", "Other"];
export const REVIEW_READINGS = READINGS;

/** Returns a clean review or an error string. Strips anything that looks like contact info. */
export function validateReview(raw: unknown): { ok: true; review: ReviewInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const firstName = String(r.firstName ?? "").trim().split(/\s+/)[0]?.slice(0, REVIEW_NAME_MAX) ?? "";
  const rating = Number(r.rating);
  const comment = String(r.comment ?? "").trim().slice(0, REVIEW_COMMENT_MAX);
  const reading = READINGS.includes(String(r.reading)) ? String(r.reading) : "Other";
  const consent = r.consent === true;
  if (!firstName) return { ok: false, error: "First name, please. Just the first one." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Pick a star rating." };
  if (comment.length < 3) return { ok: false, error: "A sentence or two. That's it." };
  if (/@|https?:\/\/|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(comment)) {
    return { ok: false, error: "Leave out emails, links, and phone numbers. We only post words." };
  }
  return { ok: true, review: { firstName, rating, comment, reading, consent } };
}
