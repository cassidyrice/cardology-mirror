import type { QuestionTrack } from "./question-reading-facts";
import { SUGGESTED_QUESTIONS_PDF_PATH } from "./suggested-questions";

export const CARD_BLUEPRINTS_STRIPE_ACCOUNT = "acct_1U1a1dChx1yAVyrs";
export const QUESTION_SLA_SHORT = "Within 48 hours · almost all under 24h";
export const QUESTION_SLA_PROSE = "within 48 hours, with almost all delivered in under 24 hours";

export const PRIMARY_QUESTION_TRACK = "card-blueprint-reading" as const;
export const MAX_QUESTIONS_PER_ORDER = 3 as const;
export const QUESTION_ACCESS_WINDOW_HOURS = 48 as const;
export const QUESTION_ACCESS_WINDOW_MS = QUESTION_ACCESS_WINDOW_HOURS * 60 * 60 * 1000;
export { SUGGESTED_QUESTIONS_PDF_PATH };

export type DeliveryChannel = "email" | "sms";

export type QuestionOrderStatus =
  | "pending_payment"
  | "awaiting_question"
  | "generating_angles"
  | "awaiting_approval"
  | "sent"
  | "expired"
  | "failed";

export interface QuestionTrackSpec {
  slug: QuestionTrack;
  title: string;
  shortTitle: string;
  priceDollars: 99 | 26 | 39;
  amountCents: 9900 | 2600 | 3900;
  requiresSecondBirthdate: boolean;
  maxQuestions: number;
  accessWindowHours: number;
  eyebrow: string;
  tagline: string;
  description: string;
  ctaLabel: string;
}

export const CARD_BLUEPRINT_READING_SPEC: QuestionTrackSpec = {
  slug: "card-blueprint-reading",
  title: "The Card Blueprint Reading",
  shortTitle: "Card Blueprint Reading",
  priceDollars: 99,
  amountCents: 9900,
  requiresSecondBirthdate: false,
  maxQuestions: MAX_QUESTIONS_PER_ORDER,
  accessWindowHours: QUESTION_ACCESS_WINDOW_HOURS,
  eyebrow: "Private Reading Pass · Email or Text",
  tagline:
    "Instant Suggested Questions Guide + 48 hours of access to ask up to 3 questions.",
  description:
    "Pay once on this page ($99), download the Suggested Questions Guide right away, and use your 48-hour Reading Pass to ask up to 3 questions — solo timing, two-person chemistry, work, or blind spots. Cass personally reviews your exact spread and delivers each answer by email or text within 48 hours (almost always under 24 hours).",
  ctaLabel: "Book The Card Blueprint Reading — $99",
};

export const QUESTION_READING_TRACKS: Record<QuestionTrack, QuestionTrackSpec> = {
  "card-blueprint-reading": CARD_BLUEPRINT_READING_SPEC,
  // Historical lookup definitions kept so past D1 orders still hydrate cleanly.
  "timing-map": {
    slug: "timing-map",
    title: "The Card Blueprint Reading",
    shortTitle: "Timing Question",
    priceDollars: 26,
    amountCents: 2600,
    requiresSecondBirthdate: false,
    maxQuestions: 1,
    accessWindowHours: 48,
    eyebrow: "Solo Question · Email or Text",
    tagline: "Solo timing question.",
    description: CARD_BLUEPRINT_READING_SPEC.description,
    ctaLabel: CARD_BLUEPRINT_READING_SPEC.ctaLabel,
  },
  "chemistry-check": {
    slug: "chemistry-check",
    title: "The Card Blueprint Reading",
    shortTitle: "Compatibility Question",
    priceDollars: 39,
    amountCents: 3900,
    requiresSecondBirthdate: true,
    maxQuestions: 1,
    accessWindowHours: 48,
    eyebrow: "Two Birthdays · Email or Text",
    tagline: "Two-person compatibility question.",
    description: CARD_BLUEPRINT_READING_SPEC.description,
    ctaLabel: CARD_BLUEPRINT_READING_SPEC.ctaLabel,
  },
};

export function isQuestionTrack(value: unknown): value is QuestionTrack {
  return (
    value === "card-blueprint-reading" ||
    value === "timing-map" ||
    value === "chemistry-check"
  );
}
