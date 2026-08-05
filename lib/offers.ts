// Funnel constants shared across every marketing surface.
//
// The paid ladder itself lives in lib/products.ts (single offer:
// video-reading). The video reading is made personally for each buyer from
// the birth date (and optional question) collected at Stripe Checkout, then
// delivered as a private video link by email.

// Shared microtrust + delivery language so legal, pricing, and FAQ copy never
// drift apart.
export const MICROTRUST_LINE =
  "One-time payment · made for you · delivered by email · no subscription";

export const VIDEO_DELIVERY_CLARIFIER =
  "Personalized from your birth date · private video link · arrives within 48 hours";

export const VIDEO_DELIVERY_COPY =
  "Your video is made personally for you after checkout and delivered as a private link to the email you use at payment. It arrives within 48 hours. If it hasn't arrived by then, reply to your receipt or contact us and we'll make it right.";
