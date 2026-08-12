import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import { compareReadings } from "../components/bonds/compare";
import {
  analyticsMetadata,
  inferTrafficChannel,
  isClientFunnelEventName,
  sanitizeAnalyticsId,
  sanitizeAnalyticsPath,
  sanitizeOfferSlug,
} from "../lib/analytics";
import { publicBirthCardCode } from "../lib/birth-card-truth";
import { allBlogPosts } from "../lib/blog";
import { legacyCardDestination } from "../lib/legacy-card-redirects";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "../lib/offers";
import { allPeriodCardSeeds } from "../lib/period-card-seeds";
import { buildCardPeriodMeanings, PERIOD_FILTERS } from "../lib/period-meanings";
import {
  DIGITAL_PRODUCTS,
  INSTANT_REPORT_PRODUCTS,
  PUBLIC_PRODUCTS,
  READING_OFFERS,
  instantReportFacts,
  productBySlug,
  publicProductBySlug,
} from "../lib/products";
import {
  allBirthdateSeo,
  allCardSeo,
  birthDatesForCard,
  cardBySlug,
  cardMeta,
  dateMeta,
  zodiacFor,
} from "../lib/seo-cards";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  MARKETING_PATHS,
} from "../lib/site";
import THREE_LENS from "../lib/card-meanings.json";
import CARD_DESCRIPTIONS from "../lib/engine-data/card-descriptions.json";
import { cardology } from "../lib/engine-core/engine.js";
import {
  LIFE_PATH_ROLES,
  birthCardFromISODate,
  buildPublicLifeSpread,
} from "../lib/life-path";
import { buildReading, JokerNotSupportedError } from "../lib/reading";
import { getReading, EngineError, engineErrorResponse } from "../lib/engine";
import ALLOWLIST from "./bible-allowlist.json";

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let checked = 0;
for (let month = 1; month <= 12; month += 1) {
  for (let day = 1; day <= DAYS[month - 1]; day += 1) {
    const card = publicBirthCardCode(month, day);
    assert.ok(card && card !== "Unknown", `${month}/${day} has no public card`);
    checked += 1;
  }
}
assert.equal(checked, 366);
assert.equal(publicBirthCardCode(12, 31), "Joker");
assert.equal(publicBirthCardCode(1, 1), "K♠");

// The Worker owns the one Joker birthday page. The 52 standard card pages in
// this app must therefore reverse-map the other 365 dates exactly once.
const dates = allBirthdateSeo();
assert.equal(dates.length, 365);
assert.equal(new Set(dates.map((date) => `${date.month}/${date.day}`)).size, 365);

const kingOfSpades = cardBySlug("king-of-spades");
assert.ok(kingOfSpades);
assert.deepEqual(
  birthDatesForCard(kingOfSpades).map((date) => date.label),
  ["January 1"],
);

const description = {
  title: "The Test Card",
  core_identity: "Test identity.",
  gifts: "- Shared gift",
  shadow: "Shared shadow.",
  life_direction: "Shared direction.",
  algorithm_gateway: "Shared practice.",
};

for (const card of allCardSeo()) {
  const reading = {
    archetype: {
      birth_card: card.code,
      description,
    },
  };
  const result = compareReadings(
    { name: "Alice", reading } as never,
    { name: "Bob", reading } as never,
  );
  const copy = result.observations.map((item) => item.text).join(" ");
  assert.doesNotMatch(copy, /Alice tends to carry the heavier charge/i, card.code);
  assert.match(copy, /pressure is shared/i, card.code);
}

assert.equal(READER_PHONE_DISPLAY, "+1 (949) 368-2652");
assert.equal(READER_PHONE_TEL, "tel:+19493682652");
assert.deepEqual(
  READING_OFFERS.map((offer) => ({
    slug: offer.slug,
    price: offer.price,
    accessType: offer.accessType,
    durationMinutes: offer.durationMinutes,
    accessDays: offer.accessDays,
    maxCompletedCalls: offer.maxCompletedCalls,
  })),
  [
    {
      slug: "quick-question",
      price: 19,
      accessType: "single_session",
      durationMinutes: 5,
      accessDays: 30,
      maxCompletedCalls: 1,
    },
    {
      slug: "complete-reading",
      price: 39,
      accessType: "single_session",
      durationMinutes: 15,
      accessDays: 30,
      maxCompletedCalls: 1,
    },
    {
      slug: "season-pass-90",
      price: 199,
      accessType: "season_pass",
      durationMinutes: 15,
      accessDays: 90,
      maxCompletedCalls: undefined,
    },
  ],
);

// Instant report flagship (Personal Card Blueprint) is present, priced, and
// produces the full fact ladder the checkout review page renders.
assert.deepEqual(
  INSTANT_REPORT_PRODUCTS.map((o) => ({ slug: o.slug, price: o.price, kind: o.kind })),
  [{ slug: "personal-card-blueprint", price: 13, kind: "instant_report" }],
);
for (const offer of INSTANT_REPORT_PRODUCTS) {
  assert.deepEqual(
    instantReportFacts(offer).map((fact) => fact.label),
    ["Deliverable", "Input", "Access", "Timing", "Renewal"],
  );
}
assert.deepEqual(
  PUBLIC_PRODUCTS.map((product) => product.slug),
  ["personal-card-blueprint", "analog-algorithm"],
);
assert.equal(publicProductBySlug("personal-card-blueprint")?.kind, "instant_report");
assert.equal(publicProductBySlug("analog-algorithm")?.kind, "digital_download");
assert.equal(sanitizeOfferSlug("personal-card-blueprint"), "personal-card-blueprint");
assert.equal(sanitizeOfferSlug("analog-algorithm"), "analog-algorithm");
for (const offer of READING_OFFERS) {
  assert.equal(publicProductBySlug(offer.slug), undefined, `${offer.slug} must not open new checkout`);
  assert.equal(productBySlug(offer.slug)?.slug, offer.slug, `${offer.slug} must remain resolvable for historical orders`);
}
assert.deepEqual(
  DIGITAL_PRODUCTS.map((product) => ({
    slug: product.slug,
    price: product.price,
    available: product.available,
  })),
  [{ slug: "analog-algorithm", price: 17, available: true }],
);

// Product-model regression gate: the phone-reading products are historical
// compatibility records only. They must not return to active marketing,
// navigation, schema, or new-checkout surfaces.
const productMarketingFiles = [
  "app/page.tsx",
  "app/blog/page.tsx",
  "app/card-of-the-day/page.tsx",
  "app/contact/page.tsx",
  "app/how-to-read-playing-cards/page.tsx",
  "app/playing-card-spreads/page.tsx",
  "app/playing-card-spreads/three-card/page.tsx",
  "app/playing-card-spreads/yes-or-no/page.tsx",
  "app/try/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/readings/page.tsx",
  "app/layout.tsx",
  "app/products/analog-algorithm/page.tsx",
  "components/seo/SiteFooter.tsx",
  "components/seo/SiteHeader.tsx",
  "components/seo/ReadingBridge.tsx",
  "components/seo/OfferCta.tsx",
  "components/seo/BirthCardCalculator.tsx",
  "components/analytics/AnalyticsCapture.tsx",
  "app/checkout/[offer]/page.tsx",
  "app/products/personal-card-blueprint/page.tsx",
  "lib/generated-blog-posts.json",
  "public/llms.txt",
  "public/llms-full.txt",
];
const productSurfaceText = productMarketingFiles
  .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
  .join("\n");
assert.doesNotMatch(productSurfaceText, /Compare all three readings/i);
assert.doesNotMatch(productSurfaceText, /Card Blueprints sells voice readings/i);
assert.doesNotMatch(productSurfaceText, /Paid readings are delivered by an AI voice reader over the phone/i);
assert.doesNotMatch(productSurfaceText, /optional phone readings/i);
assert.doesNotMatch(productSurfaceText, /which reading fits|ongoing seasonal access/i);
assert.doesNotMatch(
  productSurfaceText,
  /For a personal reading, start with the birth dates and the actual question/i,
);
assert.doesNotMatch(
  productSurfaceText,
  /birth dates and the actual question/i,
);
assert.match(
  productSurfaceText,
  /Personal Card Blueprint is a \$13 one-time written report generated from a single birth date/i,
);
assert.match(
  readFileSync("scripts/generate_daily_blog_post.ts", "utf8"),
  /Personal Card Blueprint is a \$13 one-time written report generated from a single birth date/i,
);
assert.doesNotMatch(
  readFileSync("scripts/generate_daily_blog_post.ts", "utf8"),
  /For a personal reading, start with the birth dates and the actual question/i,
);
assert.doesNotMatch(
  productSurfaceText,
  /READER_PHONE|Call the AI reader|free first-card|free AI voice preview|free voice preview|free preview line|free reading line|free-call|free_call_clicked|FREE_PREVIEW|tel:\+/i,
);
