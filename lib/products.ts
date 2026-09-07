// Product records used by active sales and historical fulfillment.
// Voice-reading offers are retained for old Stripe sessions and entitlements,
// but are not part of the active public catalog or new checkout lookup.

import {
  VIDEO_DAILY_52_SLUG,
  VIDEO_SINGLE_SLUG,
  VIDEO_VOICE_ADDON_SLUG,
  VIDEO_WEEKLY_7_SLUG,
  videoDaily52PriceId,
  videoOfferAvailable,
  videoSinglePriceId,
  videoVoiceAddonPriceId,
  videoWeekly7PriceId,
} from "@/lib/content-video";

export type ProductKind =
  | "voice_reading"
  | "digital_download"
  | "instant_report"
  | "membership"
  | "video_service";

export type ReadingAccessType = "single_session" | "season_pass";

export type StripePriceEnv =
  | "STRIPE_PRICE_QUICK_QUESTION"
  | "STRIPE_PRICE_COMPLETE_READING"
  | "STRIPE_PRICE_SEASON_PASS"
  | "STRIPE_PRICE_ANALOG_ALGORITHM"
  | "STRIPE_PRICE_COMPLETE_CARD_BLUEPRINT"
  | "STRIPE_PRICE_PERSONAL_CARD_BLUEPRINT"
  | "STRIPE_PRICE_BLUEPRINT_BREAKDOWN"
  | "STRIPE_PRICE_CONTENT_CALENDAR"
  | "STRIPE_PRICE_VIDEO_SINGLE"
  | "STRIPE_PRICE_VIDEO_WEEKLY_7"
  | "STRIPE_PRICE_VIDEO_DAILY_52"
  | "STRIPE_PRICE_VIDEO_VOICE_ADDON"
  | "STRIPE_PRICE_MEMBERSHIP";

type ProductBase = {
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  badge?: string;
  oneLine: string;
  bestFor: string;
  deliverable: string;
  turnaround: string;
  includes: string[];
  cta: string;
  href?: string;
  checkoutNote: string;
  stripePriceEnv: StripePriceEnv;
};

export type ReadingOffer = ProductBase & {
  kind: "voice_reading";
  accessType: ReadingAccessType;
  durationMinutes: number;
  accessDays: number;
  maxCompletedCalls?: number;
};

export type DigitalDownloadOffer = ProductBase & {
  kind: "digital_download";
  available: boolean;
  downloadAssetKey: string;
  redownloadDays: number;
  fileName: string;
};

export type InstantReportOffer = ProductBase & {
  kind: "instant_report";
  reportSlug: string;
};

export type MembershipOffer = ProductBase & {
  kind: "membership";
  reportSlug: string;
  billingPeriod: "month";
};

export type VideoOffer = ProductBase & {
  kind: "video_service";
  videosIncluded: number;
  requiresCalendar: boolean;
};

export type SiteProduct =
  | ReadingOffer
  | DigitalDownloadOffer
  | InstantReportOffer
  | MembershipOffer
  | VideoOffer;
export type ActiveProduct =
  | DigitalDownloadOffer
  | InstantReportOffer
  | MembershipOffer
  | VideoOffer;

export type DigitalOfferFact = {
  label: "Deliverable" | "Format" | "Access" | "Redownload" | "Renewal";
  value: string;
};

export type InstantReportFact = {
  label: "Deliverable" | "Input" | "Access" | "Timing" | "Renewal";
  value: string;
};

export const READING_OFFERS: ReadingOffer[] = [
  {
    kind: "voice_reading",
    slug: "quick-question",
    stripePriceEnv: "STRIPE_PRICE_QUICK_QUESTION",
    name: "Quick Question",
    price: 19,
    priceLabel: "$19",
    oneLine: "Get clarity on one real question.",
    bestFor:
      "A focused question about one person, relationship, decision, or immediate situation.",
    deliverable: "One live phone session with the AI Cardology reader.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "One personalized Cardology question",
      "Up to 5 minutes with the AI reader",
      "Phone access after checkout and recognition",
    ],
    cta: "Ask My Question — $19",
    checkoutNote: "One-time purchase. Call within 30 days. One paid session.",
    accessType: "single_session",
    durationMinutes: 5,
    accessDays: 30,
    maxCompletedCalls: 1,
  },
  {
    kind: "voice_reading",
    slug: "complete-reading",
    stripePriceEnv: "STRIPE_PRICE_COMPLETE_READING",
    name: "Complete Reading",
    price: 39,
    priceLabel: "$39",
    badge: "Most Popular",
    oneLine: "Hear the complete pattern behind your cards.",
    bestFor:
      "A fuller personal or relationship reading with room to connect the cards to real life.",
    deliverable: "One live phone session with the AI Cardology reader.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "Birth card and ruling-card interpretation",
      "Love, work, money, timing, or relationship focus",
      "Up to 15 minutes with the AI reader",
    ],
    cta: "Get My Complete Reading — $39",
    checkoutNote: "One-time purchase. Call within 30 days. One paid session.",
    accessType: "single_session",
    durationMinutes: 15,
    accessDays: 30,
    maxCompletedCalls: 1,
  },
  {
    kind: "voice_reading",
    slug: "season-pass-90",
    stripePriceEnv: "STRIPE_PRICE_SEASON_PASS",
    name: "90-Day Season Pass",
    price: 199,
    priceLabel: "$199",
    badge: "Best Value",
    oneLine: "Keep your Cardology reader available through an entire season.",
    bestFor:
      "Ongoing questions, changing situations, relationship dynamics, timing, and daily cards.",
    deliverable:
      "Unlimited personal return calls with the AI Cardology reader for 90 days.",
    turnaround: "Available after successful checkout and phone-number recognition.",
    includes: [
      "Unlimited return calls for 90 days",
      "Compatibility, timing, and daily-card questions",
      "One payment with no automatic renewal",
    ],
    cta: "Open My 90-Day Pass — $199",
    checkoutNote: "One payment. No automatic renewal. Personal fair use applies.",
    accessType: "season_pass",
    durationMinutes: 15,
    accessDays: 90,
  },
];

export const DIGITAL_PRODUCTS: DigitalDownloadOffer[] = [
  {
    kind: "digital_download",
    available: true,
    slug: "analog-algorithm",
    stripePriceEnv: "STRIPE_PRICE_ANALOG_ALGORITHM",
    name: "The Analog Algorithm",
    price: 17,
    priceLabel: "$17",
    badge: "E-book",
    oneLine:
      "The written proof and operating manual for the 52-card solar calendar.",
    bestFor:
      "Readers who want the math, spreads, planetary periods, and practice worksheets in one book.",
    deliverable: "PDF e-book with a secure download link after purchase.",
    turnaround: "Instant download link by email after successful payment.",
    includes: [
      "Birth card formula, yearly spreads, and the fixed annual permutation",
      "Planetary periods, environment/displacement, and Long Range",
      "Worked examples, worksheets, and a one-page formula sheet",
      "Claim-labeled history and interpretation chapters",
    ],
    cta: "Get the E-book — $17",
    checkoutNote:
      "One-time purchase. Download link emailed after payment. 30-day re-download window.",
    downloadAssetKey: "analog-algorithm-v1.pdf",
    redownloadDays: 30,
    fileName: "The-Analog-Algorithm.pdf",
    href: "/products/analog-algorithm",
  },
  {
    kind: "digital_download",
    available: true,
    slug: "complete-card-blueprint",
    stripePriceEnv: "STRIPE_PRICE_COMPLETE_CARD_BLUEPRINT",
    name: "The Complete Card Blueprint",
    price: 27,
    priceLabel: "$27",
    badge: "Handbook",
    oneLine:
      "The full working system: birth cards, timing, relationships, and all 52 entries.",
    bestFor:
      "Readers who want the complete handbook beside The Analog Algorithm — calculation through the living deck.",
    deliverable: "PDF handbook with a secure download link after purchase.",
    turnaround: "Download link by email after successful payment.",
    includes: [
      "Birth-card calculation, ruling cards, and calendar boundaries",
      "Rank × suit × planet reading grammar and under / sweet / over states",
      "Spreads, 52-day timing, and a no-score relationship method",
      "All 52 card entries, practice worksheets, and a claim-label key",
    ],
    cta: "Get the Handbook — $27",
    checkoutNote:
      "One-time purchase. Download link emailed after payment. 30-day re-download window.",
    downloadAssetKey: "complete-card-blueprint-v1.pdf",
    redownloadDays: 30,
    fileName: "The-Complete-Card-Blueprint.pdf",
    href: "/products/complete-card-blueprint",
  },
];

export const INSTANT_REPORT_PRODUCTS: InstantReportOffer[] = [
  {
    kind: "instant_report",
    slug: "personal-card-blueprint",
    stripePriceEnv: "STRIPE_PRICE_PERSONAL_CARD_BLUEPRINT",
    name: "Personal Card Blueprint",
    price: 13,
    priceLabel: "$13",
    badge: "Flagship",
    oneLine:
      "Your birth-card pattern, ruling layer, and your whole year in cards — written down so you can see it.",
    bestFor:
      "Anyone who wants the full pattern in writing, without a phone call or a horoscope.",
    deliverable:
      "An instant personalized web report, with an emailed return link.",
    turnaround: "Available immediately after payment — no call, no wait.",
    includes: [
      "Your birth card and ruling card, in plain language",
      "Core pattern: strengths, blind spots, and growth edge",
      "Your current 52-day period, deep-dived — balanced, under, over",
      "All seven 52-day cards of your year, in order, with a note on each",
      "Yearly signals: Long Range, Pluto, Result, Environment & Displacement",
      "The 90 Spreads PDF — every yearly map, ages 0–89 (bundled download)",
      "Three pointed reflection questions to work with",
    ],
    cta: "Get My Blueprint — $13",
    checkoutNote:
      "One-time purchase. You enter your birth date at checkout; the report is generated instantly and emailed back to you.",
    reportSlug: "personal-card-blueprint",
    href: "/products/personal-card-blueprint",
  },
];

export const DEEP_DIVE_SLUG = "deep-dive";

export const DEEP_DIVE_PRODUCT: DigitalDownloadOffer = {
  kind: "digital_download",
  available: true,
  slug: DEEP_DIVE_SLUG,
  stripePriceEnv: "STRIPE_PRICE_BLUEPRINT_BREAKDOWN",
  name: "Blueprint Breakdown Video",
  price: 47,
  priceLabel: "$47",
  badge: "Video",
  oneLine:
    "A 5-minute video breakdown of your birth card blueprint, plus two bonuses: the $9 Birth Card Deep Dive and your Yearly Timing Map.",
  bestFor:
    "Anyone who just found their birth card and wants the whole pattern walked through on video, not only on paper.",
  deliverable:
    "A 5-minute Blueprint Breakdown Video for your birth card, sent by email within 2 business days. Instant bonuses: your Yearly Timing Map (a blueprint diagram of your year) and the 7-page Birth Card Deep Dive PDF + the complete System Guide.",
  turnaround:
    "The Yearly Timing Map and Deep Dive PDF links arrive immediately after payment. The video arrives by email within 2 business days.",
  includes: [
    "5-minute Blueprint Breakdown Video of your birth card",
    "Bonus: the $9 Birth Card Deep Dive (7-page PDF + the complete System Guide)",
    "Bonus: your Yearly Timing Map — a blueprint diagram of your year, instant",
    "Your seven ~13-year period cards on the confirmation page",
  ],
  cta: "Get the Blueprint Breakdown — $47",
  checkoutNote:
    "One-time purchase. Birthday comes from the calculator. Stripe-hosted checkout collects email and payment.",
  downloadAssetKey: "",
  redownloadDays: 30,
  fileName: "Birth-Card-Deep-Dive.pdf",
  href: "/products/blueprint-breakdown-video",
};

export const CONTENT_CALENDAR_52_SLUG = "content-calendar-52";

export const CONTENT_CALENDAR_52_PRODUCT: DigitalDownloadOffer = {
  kind: "digital_download",
  available: true,
  slug: CONTENT_CALENDAR_52_SLUG,
  stripePriceEnv: "STRIPE_PRICE_CONTENT_CALENDAR",
  name: "Content Calendar — 52 days",
  price: 29,
  priceLabel: "$29",
  badge: "Content Calendar",
  oneLine: "52 days of content, written for you. Not a spreadsheet: tap any day and it writes the post.",
  bestFor: "Creators and small businesses who want posts written, one for every day, in their own words.",
  deliverable: "52-day calendar on the confirmation page with on-demand writing for each day, CSV, and a download of all written pieces.",
  turnaround: "Calendar generates after payment; tap any day to write the post.",
  includes: [
    "52 days of themes, why lines, posts, and formats",
    "One written piece per day (article, script, thread, carousel, or newsletter)",
    "Two regenerations per day",
    "CSV and download-all written pieces",
    "Re-download for 30 days",
  ],
  cta: "Get all 52 days — $29",
  checkoutNote:
    "One-time purchase. Your business description travels in checkout metadata only and is not logged.",
  downloadAssetKey: "",
  redownloadDays: 30,
  fileName: "content-calendar-52.csv",
  href: "/content-engine",
};

export const VIDEO_SINGLE_PRODUCT: VideoOffer = {
  kind: "video_service",
  slug: VIDEO_SINGLE_SLUG,
  stripePriceEnv: "STRIPE_PRICE_VIDEO_SINGLE",
  name: "Video — single short",
  price: 19,
  priceLabel: "$19",
  badge: "Video",
  oneLine:
    "One 30–60 second faceless short from any day's script, with your photos and optional voice.",
  bestFor: "Testing video before committing to a pack.",
  deliverable:
    "One critic-gated vertical short, delivered by email and on your order page within 48 hours.",
  turnaround: "Usually 24 hours, promised within 48.",
  includes: [
    "One short from a written script in your calendar",
    "Your photos and optional audio or logo",
    "30–60 second vertical format",
    "One free re-render if needed",
  ],
  cta: "Order one short — $19",
  checkoutNote:
    "Requires a paid Content Calendar. The script comes from a piece you've already written.",
  videosIncluded: 1,
  requiresCalendar: true,
  href: "/content-engine/video/order?offer=video-single",
};

export const VIDEO_WEEKLY_7_PRODUCT: VideoOffer = {
  kind: "video_service",
  slug: VIDEO_WEEKLY_7_SLUG,
  stripePriceEnv: "STRIPE_PRICE_VIDEO_WEEKLY_7",
  name: "Video — weekly pack (7)",
  price: 99,
  priceLabel: "$99",
  badge: "Video pack",
  oneLine: "Seven shorts across your calendar — one per week, delivered as each is ready.",
  bestFor: "A month of weekly posts without daily production.",
  deliverable:
    "Seven critic-gated vertical shorts, delivered as each finishes (usually within 48 hours each).",
  turnaround: "First short within 48 hours; rest drip as ready.",
  includes: [
    "Seven shorts from your calendar scripts",
    "Your photos and optional audio per video",
    "One free re-render per video",
  ],
  cta: "Order weekly pack — $99",
  checkoutNote: "Requires a paid Content Calendar.",
  videosIncluded: 7,
  requiresCalendar: true,
  href: "/content-engine/video/order?offer=video-weekly-7",
};

export const VIDEO_DAILY_52_PRODUCT: VideoOffer = {
  kind: "video_service",
  slug: VIDEO_DAILY_52_SLUG,
  stripePriceEnv: "STRIPE_PRICE_VIDEO_DAILY_52",
  name: "Video — every day (52)",
  price: 349,
  priceLabel: "$349",
  badge: "Video pack",
  oneLine: "Fifty-two shorts across your full calendar — drip delivered as each is ready.",
  bestFor: "Daily posters who want the full year on video.",
  deliverable:
    "Fifty-two critic-gated vertical shorts, delivered as each finishes.",
  turnaround: "First short within 48 hours; rest drip as ready.",
  includes: [
    "Fifty-two shorts from your calendar scripts",
    "Your photos and optional audio per video",
    "One free re-render per video",
  ],
  cta: "Order daily pack — $349",
  checkoutNote: "Requires a paid Content Calendar. Limited capacity.",
  videosIncluded: 52,
  requiresCalendar: true,
  href: "/content-engine/video/order?offer=video-daily-52",
};

export const VIDEO_VOICE_ADDON_PRODUCT: VideoOffer = {
  kind: "video_service",
  slug: VIDEO_VOICE_ADDON_SLUG,
  stripePriceEnv: "STRIPE_PRICE_VIDEO_VOICE_ADDON",
  name: "Your-voice add-on",
  price: 10,
  priceLabel: "+$10/video",
  badge: "Add-on",
  oneLine: "Use your own voice — upload audio or a sample for cloning.",
  bestFor: "Buyers who want faceless video that still sounds like them.",
  deliverable: "Voice track mixed into your short using your uploaded audio.",
  turnaround: "Added to your video order at checkout.",
  includes: ["Your uploaded audio or voice sample", "Mixed into the final short"],
  cta: "Add your voice — +$10",
  checkoutNote: "Select at checkout with any video order.",
  videosIncluded: 0,
  requiresCalendar: true,
  href: "/content-engine/video/order",
};

export const VIDEO_PRODUCTS: VideoOffer[] = [
  VIDEO_SINGLE_PRODUCT,
  VIDEO_WEEKLY_7_PRODUCT,
  VIDEO_DAILY_52_PRODUCT,
  VIDEO_VOICE_ADDON_PRODUCT,
];

export function availableVideoProducts(): VideoOffer[] {
  return VIDEO_PRODUCTS.filter((product) => {
    if (product.slug === VIDEO_DAILY_52_SLUG) {
      return Boolean(videoDaily52PriceId());
    }
    if (product.slug === VIDEO_VOICE_ADDON_SLUG) {
      return Boolean(videoVoiceAddonPriceId());
    }
    if (product.slug === VIDEO_SINGLE_SLUG) {
      return Boolean(videoSinglePriceId());
    }
    if (product.slug === VIDEO_WEEKLY_7_SLUG) {
      return Boolean(videoWeekly7PriceId());
    }
    return videoOfferAvailable(product.slug);
  });
}

export const MEMBERSHIP_SLUG = "cardology-membership";

export const MEMBERSHIP_PRODUCT: MembershipOffer = {
  kind: "membership",
  slug: MEMBERSHIP_SLUG,
  stripePriceEnv: "STRIPE_PRICE_MEMBERSHIP",
  name: "Cardology Membership",
  price: 9,
  priceLabel: "$9/mo",
  badge: "Membership",
  oneLine:
    "Your birth card, unlocked — plus your personal card-of-the-day and current 52-day period, every day.",
  bestFor:
    "Anyone who wants to actually use their birth card, not just read about it once.",
  deliverable:
    "An ongoing personalized dashboard: your birth card, your current planetary period, and your card for today — refreshed daily, delivered by email.",
  turnaround: "Available immediately after payment — no call, no wait.",
  includes: [
    "Your birth card and ruling card, in plain language",
    "Your card for today, calculated from your birth card (not a generic daily card)",
    "Your current 52-day planetary period, with what it means right now",
    "Renews monthly — cancel anytime",
  ],
  cta: "Join — $9/mo",
  checkoutNote:
    "Recurring monthly charge. You enter your birth date at checkout; cancel anytime from the link in any renewal email.",
  reportSlug: MEMBERSHIP_SLUG,
  billingPeriod: "month",
  href: `/checkout/${MEMBERSHIP_SLUG}`,
};

export const ALL_PRODUCTS: SiteProduct[] = [
  ...INSTANT_REPORT_PRODUCTS,
  ...READING_OFFERS,
  ...DIGITAL_PRODUCTS,
  DEEP_DIVE_PRODUCT,
  CONTENT_CALENDAR_52_PRODUCT,
  ...VIDEO_PRODUCTS,
  MEMBERSHIP_PRODUCT,
];

/** Products currently purchasable and safe to advertise as live offers. */
export const PUBLIC_PRODUCTS: ActiveProduct[] = [
  MEMBERSHIP_PRODUCT,
  ...INSTANT_REPORT_PRODUCTS,
  ...DIGITAL_PRODUCTS.filter((product) => product.available),
];

export function isVoiceReading(p: SiteProduct): p is ReadingOffer {
  return p.kind === "voice_reading";
}

export function isDigitalDownload(p: SiteProduct): p is DigitalDownloadOffer {
  return p.kind === "digital_download";
}

export function isInstantReport(p: SiteProduct): p is InstantReportOffer {
  return p.kind === "instant_report";
}

export function isMembership(p: SiteProduct): p is MembershipOffer {
  return p.kind === "membership";
}

export function isVideoService(p: SiteProduct): p is VideoOffer {
  return p.kind === "video_service";
}

export function productBySlug(slug: string): SiteProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug);
}

/** Active-sale lookup. Checkout routes must use this, never productBySlug. */
export function publicProductBySlug(slug: string): ActiveProduct | undefined {
  return PUBLIC_PRODUCTS.find((product) => product.slug === slug);
}

function checkoutVideoBySlug(slug: string): VideoOffer | undefined {
  const product = VIDEO_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return undefined;
  if (!videoOfferAvailable(slug)) return undefined;
  if (slug === VIDEO_VOICE_ADDON_SLUG) return undefined;
  return product;
}

/** Checkout-eligible products, including the Blueprint Breakdown (slug deep-dive) and Content Engine which are not in the public catalog. */
export function checkoutProductBySlug(slug: string): ActiveProduct | undefined {
  return (
    publicProductBySlug(slug) ??
    (slug === DEEP_DIVE_SLUG ? DEEP_DIVE_PRODUCT : undefined) ??
    (slug === CONTENT_CALENDAR_52_SLUG ? CONTENT_CALENDAR_52_PRODUCT : undefined) ??
    checkoutVideoBySlug(slug)
  );
}

export function isDeepDive(product: { slug: string } | null | undefined): boolean {
  return product?.slug === DEEP_DIVE_SLUG;
}

export function isContentCalendar52(
  product: { slug: string } | null | undefined,
): boolean {
  return product?.slug === CONTENT_CALENDAR_52_SLUG;
}

export function isVideoSingle(product: { slug: string } | null | undefined): boolean {
  return product?.slug === VIDEO_SINGLE_SLUG;
}

export function isVideoWeekly7(product: { slug: string } | null | undefined): boolean {
  return product?.slug === VIDEO_WEEKLY_7_SLUG;
}

export function isVideoDaily52(product: { slug: string } | null | undefined): boolean {
  return product?.slug === VIDEO_DAILY_52_SLUG;
}

export function isVideoOffer(product: { slug: string } | null | undefined): boolean {
  if (!product?.slug) return false;
  return (
    isVideoSingle(product) ||
    isVideoWeekly7(product) ||
    isVideoDaily52(product)
  );
}

export function digitalBySlug(slug: string): DigitalDownloadOffer | undefined {
  return DIGITAL_PRODUCTS.find((o) => o.slug === slug);
}

export function instantReportBySlug(slug: string): InstantReportOffer | undefined {
  return INSTANT_REPORT_PRODUCTS.find((o) => o.slug === slug);
}

export function digitalOfferFacts(offer: DigitalDownloadOffer): DigitalOfferFact[] {
  return [
    { label: "Deliverable", value: offer.deliverable },
    { label: "Format", value: "PDF e-book (print-friendly)." },
    { label: "Access", value: "Secure download link after payment." },
    {
      label: "Redownload",
      value: `${offer.redownloadDays} days from purchase via your emailed link.`,
    },
    { label: "Renewal", value: "No automatic renewal. One-time purchase." },
  ];
}

export function instantReportFacts(
  offer: InstantReportOffer | MembershipOffer,
): InstantReportFact[] {
  return [
    { label: "Deliverable", value: offer.deliverable },
    { label: "Input", value: "Your birth date, collected securely at checkout." },
    { label: "Access", value: "Instant report on the confirmation page, plus an emailed return link." },
    { label: "Timing", value: "Generated immediately after payment." },
    {
      label: "Renewal",
      value:
        offer.kind === "membership"
          ? "Renews monthly. Cancel anytime from the link in your renewal email."
          : "No automatic renewal. One-time purchase.",
    },
  ];
}
