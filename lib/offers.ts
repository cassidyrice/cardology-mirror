// Funnel constants shared across every marketing surface: the reading line's
// phone number and the free first-card preview that tops the funnel.
//
// The paid ladder itself lives in lib/products.ts (quick-question /
// complete-reading / season-pass-90).

// The reading line. Authoritative source: the cardology-unlock Worker
// (src/index.js READER_TEL / READER_TEL_DISPLAY) — the AI voice agent that
// answers this number IS the product, and the free first-card preview is the
// top of the funnel.
export const READER_PHONE_DISPLAY = "+1 (949) 368-2652";
export const READER_PHONE_TEL = "tel:+19493682652";

// Free preview — introduces the caller's birth card only. It is not a fourth
// pricing card: no personal question, no complete reading, no account.
export const FREE_PREVIEW_NAME = "First-Card Preview";
export const FREE_PREVIEW_BLURB =
  "Hear a 60–90 second introduction to your birth card. No full reading or personal question.";

// Shared microtrust + fair-use language so legal, pricing, and FAQ copy never
// drift apart.
export const MICROTRUST_LINE =
  "One-time payment · call from your checkout number · no subscription";

export const SEASON_PASS_CLARIFIER =
  "Unlimited personal calls for 90 days · up to 15 minutes per session · no automatic renewal";

export const FAIR_USE_COPY =
  "Unlimited personal use for 90 days. Sessions are limited to 15 minutes, one active session at a time, and access is tied to the phone number used at checkout. Account sharing, automated calling, and abusive or unusually excessive use are not permitted.";
