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

/** How loud a money-path link is. lead = free calculator (first). offer = the
 *  $13 reading (the heavy control). guide and help stay in the same row. */
export const MONEY_PATH_WEIGHTS = ["lead", "guide", "offer", "help"] as const;
export type MoneyPathWeight = (typeof MONEY_PATH_WEIGHTS)[number];

/** One click from every page. No submenu, no second hop.
 *  Order is the offer lock: free calculator, then the explainer, then the
 *  paid reading, then FAQ. */
export const MONEY_PATHS = [
  {
    id: "calculator",
    label: BIRTH_CARD_CALCULATOR_LABEL,
    href: BIRTH_CARD_CALCULATOR_PATH,
    weight: "lead",
  },
  {
    id: "cardology",
    label: WHAT_IS_CARDOLOGY_LABEL,
    href: WHAT_IS_CARDOLOGY_PATH,
    weight: "guide",
  },
  {
    id: "reading",
    label: ONE_QUESTION_NAV.label,
    href: ONE_QUESTION_NAV.href,
    weight: "offer",
  },
  {
    id: "faq",
    label: FAQ_NAV_LABEL,
    href: FAQ_NAV_PATH,
    weight: "help",
  },
] as const;

export type MoneyPath = (typeof MONEY_PATHS)[number];

/** Shared by the desktop header and the mobile menu. Same destinations as
 *  MONEY_PATHS, in that order. /today stays off this list — it asks for a
 *  local profile, so it is not the free hook. */
export const PRIMARY_NAV = MONEY_PATHS.map(({ label, href }) => ({
  label,
  href,
}));

export function moneyPathByHref(href: string): MoneyPath {
  const match = MONEY_PATHS.find((item) => item.href === href);
  if (!match) {
    throw new Error(`Unknown money path: ${href}`);
  }
  return match;
}

/** Footer and header class for a money-path link. The paid reading is the
 *  bordered control. The other three stay text, with the calculator first. */
export function moneyPathLinkClass(weight: MoneyPathWeight): string {
  switch (weight) {
    case "lead":
    case "guide":
    case "help":
      return "money-path font-semibold text-brand-ink hover:text-brand-ink";
    case "offer":
      return "paper-button small-button header-offer-link money-path-offer";
    default: {
      const exhaustive: never = weight;
      return exhaustive;
    }
  }
}
