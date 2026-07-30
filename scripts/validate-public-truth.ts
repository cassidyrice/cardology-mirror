import assert from "node:assert/strict";

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
import { legacyCardDestination } from "../lib/legacy-card-redirects";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "../lib/offers";
import { READING_OFFERS, readingOfferFacts } from "../lib/products";
import { allBirthdateSeo, allCardSeo, birthDatesForCard, cardBySlug } from "../lib/seo-cards";

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
for (const offer of READING_OFFERS) {
  assert.deepEqual(
    readingOfferFacts(offer).map((fact) => fact.label),
    ["Deliverable", "Session", "Calls", "Access", "Renewal"],
  );
}

const legacyRanks = [
  ["ace", "ace"],
  ["two", "2"],
  ["three", "3"],
  ["four", "4"],
  ["five", "5"],
  ["six", "6"],
  ["seven", "7"],
  ["eight", "8"],
  ["nine", "9"],
  ["ten", "10"],
  ["jack", "jack"],
  ["queen", "queen"],
  ["king", "king"],
] as const;
const suits = ["hearts", "clubs", "diamonds", "spades"] as const;
let redirectsChecked = 0;
for (const [legacyRank, canonicalRank] of legacyRanks) {
  for (const suit of suits) {
    const destination = `/birth-card/${canonicalRank}-of-${suit}`;
    assert.equal(
      legacyCardDestination(`/${canonicalRank}-of-${suit}-meaning/`),
      destination,
    );
    assert.equal(
      legacyCardDestination(`/cards/${legacyRank}-of-${suit}.html`),
      destination,
    );
    redirectsChecked += 2;
  }
}
assert.equal(redirectsChecked, 104);
assert.equal(legacyCardDestination("/2-of/"), null);
assert.equal(legacyCardDestination("/joker-of-spades-meaning/"), null);
assert.equal(legacyCardDestination("/7-of-stars-meaning/"), null);

const analyticsSessionId = "ab119959-a913-4da6-9f50-a0378c613582";
assert.ok(isClientFunnelEventName("free_call_clicked"));
assert.ok(!isClientFunnelEventName("purchase_completed"));
assert.equal(sanitizeAnalyticsId(analyticsSessionId), analyticsSessionId);
assert.equal(sanitizeAnalyticsId("not-a-session"), "");
assert.equal(
  sanitizeAnalyticsPath("/birth-card/8-of-diamonds?email=private"),
  "/birth-card/8-of-diamonds",
);
assert.equal(sanitizeAnalyticsPath("https://example.com/private"), "");
assert.equal(sanitizeOfferSlug("complete-reading"), "complete-reading");
assert.equal(sanitizeOfferSlug("invented-offer"), "");
assert.equal(
  inferTrafficChannel({
    referrerHost: "www.google.com",
    currentHost: "cardblueprints.com",
    utmSource: "google",
    utmMedium: "cpc",
  }),
  "campaign",
);
assert.equal(
  inferTrafficChannel({
    referrerHost: "www.google.com",
    currentHost: "cardblueprints.com",
    utmSource: "",
    utmMedium: "",
  }),
  "organic",
);
assert.deepEqual(
  analyticsMetadata({
    sessionId: analyticsSessionId,
    landingPath: "/birth-card-calculator",
    referrerHost: "www.google.com",
    trafficChannel: "organic",
    utmSource: "google",
    utmMedium: "organic",
    utmCampaign: "card meanings",
  }),
  {
    analytics_session_id: analyticsSessionId,
    analytics_landing_path: "/birth-card-calculator",
    analytics_referrer_host: "www.google.com",
    analytics_traffic_channel: "organic",
    analytics_utm_source: "google",
    analytics_utm_medium: "organic",
    analytics_utm_campaign: "card meanings",
  },
);

console.log(
  "PASS: 366 birthdays, reverse card dates, 52 same-card comparisons, 104 legacy redirects, phone line, 3 offers, and analytics validation",
);
