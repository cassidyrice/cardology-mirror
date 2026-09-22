import {
  DEEP_DIVE_HEADER_CTA_LABEL,
  DEEP_DIVE_PRODUCT_PATH,
} from "@/lib/deep-dive";

export const BIRTH_CARD_CALCULATOR_LABEL = "Birth Card Calculator";
export const BIRTH_CARD_CALCULATOR_PATH = "/birth-card-calculator";
export const WHAT_IS_CARDOLOGY_LABEL = "What is Cardology";
export const WHAT_IS_CARDOLOGY_PATH = "/what-is-cardology";
export const FAQ_NAV_LABEL = "FAQ";
export const FAQ_NAV_PATH = "/faq";

export const ONE_QUESTION_NAV = {
  label: DEEP_DIVE_HEADER_CTA_LABEL,
  href: DEEP_DIVE_PRODUCT_PATH,
} as const;

/** Shared by the desktop header and the mobile menu.
 *  Money-path order: free calculator, then the Cardology explainer, then the
 *  $13 reading. FAQ follows. /today stays off this list — it asks for a local
 *  profile, so it is not the free hook. */
export const PRIMARY_NAV = [
  { label: BIRTH_CARD_CALCULATOR_LABEL, href: BIRTH_CARD_CALCULATOR_PATH },
  { label: WHAT_IS_CARDOLOGY_LABEL, href: WHAT_IS_CARDOLOGY_PATH },
  ONE_QUESTION_NAV,
  { label: FAQ_NAV_LABEL, href: FAQ_NAV_PATH },
] as const;
