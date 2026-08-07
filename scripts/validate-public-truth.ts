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
  [{ slug: "personal-card-blueprint", price: 29, kind: "instant_report" }],
);
for (const offer of INSTANT_REPORT_PRODUCTS) {
  assert.deepEqual(
    instantReportFacts(offer).map((fact) => fact.label),
    ["Deliverable", "Input", "Access", "Timing", "Renewal"],
  );
}
assert.deepEqual(
  PUBLIC_PRODUCTS.map((product) => product.slug),
  ["personal-card-blueprint"],
);
assert.equal(publicProductBySlug("personal-card-blueprint")?.kind, "instant_report");
assert.equal(sanitizeOfferSlug("personal-card-blueprint"), "personal-card-blueprint");
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
  [{ slug: "analog-algorithm", price: 27, available: false }],
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
  /READER_PHONE|Call the AI reader|free first-card|free AI voice preview|free voice preview|free preview line|free reading line|free-call|free_call_clicked|FREE_PREVIEW|tel:\+/i,
);
assert.doesNotMatch(productSurfaceText, /Quick Question/i);
assert.doesNotMatch(productSurfaceText, /Complete Reading/i);
assert.doesNotMatch(productSurfaceText, /90-Day Season Pass/i);
assert.doesNotMatch(productSurfaceText, /quick-question|complete-reading|season-pass-90/i);
assert.match(
  readFileSync("app/checkout/[offer]/session/route.ts", "utf8"),
  /publicProductBySlug\(slug\)/,
);
assert.match(
  readFileSync("app/readings/page.tsx", "utf8"),
  /permanentRedirect\("\/products\/personal-card-blueprint"\)/,
);
assert.match(
  readFileSync("app/try/page.tsx", "utf8"),
  /permanentRedirect\("\/birth-card-calculator"\)/,
);
assert.equal(MARKETING_PATHS.includes("/try"), false);
const middlewareText = readFileSync("middleware.ts", "utf8");
assert.match(
  middlewareText,
  /["']\/readings["']\s*:\s*["']\/products\/personal-card-blueprint["']/,
);
assert.match(
  middlewareText,
  /["']\/try["']\s*:\s*["']\/birth-card-calculator["']/,
);
assert.match(middlewareText, /NextResponse\.redirect\(redirectUrl,\s*301\)/);

// Runtime middleware behavior, not just source shape: retired public routes must
// emit real edge 301s (a static-page permanentRedirect answers 200 on Cloudflare
// Pages), preserve query strings, compose with www canonicalization, and leave
// legacy-card redirects and live routes alone.
function middlewareResult(url: string, host: string) {
  const response = middleware(
    new NextRequest(new Request(url, { headers: { host } })),
  );
  return { status: response.status, location: response.headers.get("location") };
}
assert.deepEqual(
  middlewareResult(
    "https://cardblueprints.com/readings?utm_source=legacy",
    "cardblueprints.com",
  ),
  {
    status: 301,
    location:
      "https://cardblueprints.com/products/personal-card-blueprint?utm_source=legacy",
  },
);
assert.deepEqual(
  middlewareResult("https://cardblueprints.com/try", "cardblueprints.com"),
  { status: 301, location: "https://cardblueprints.com/birth-card-calculator" },
);
assert.deepEqual(
  middlewareResult("https://www.cardblueprints.com/readings?a=1", "www.cardblueprints.com"),
  {
    status: 301,
    location: "https://cardblueprints.com/products/personal-card-blueprint?a=1",
  },
);
assert.deepEqual(
  middlewareResult(
    "https://cardblueprints.com/ace-of-hearts-meaning/",
    "cardblueprints.com",
  ),
  { status: 301, location: "https://cardblueprints.com/birth-card/ace-of-hearts" },
);
assert.equal(
  middlewareResult(
    "https://cardblueprints.com/products/personal-card-blueprint",
    "cardblueprints.com",
  ).status,
  200,
);
const privacyPolicyText = readFileSync("app/privacy-policy/page.tsx", "utf8");
assert.doesNotMatch(
  privacyPolicyText,
  /free AI voice preview|free voice preview|free preview line|free reading line|free-call/i,
);
assert.match(
  privacyPolicyText,
  /xAI[\s\S]{0,160}legacy voice orders[\s\S]{0,160}original access windows/i,
);
assert.match(productSurfaceText, /Personal Card Blueprint/);
assert.match(productSurfaceText, /instant personalized/i);

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
assert.ok(!isClientFunnelEventName("free_call_clicked"));
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

const periodCardSeeds = allPeriodCardSeeds();
assert.equal(periodCardSeeds.length, 52);
assert.equal(new Set(periodCardSeeds.map((card) => card.code)).size, 52);
assert.equal(new Set(periodCardSeeds.map((card) => card.slug)).size, 52);
assert.equal(PERIOD_FILTERS.length, 7);

const defaultPeriodCard = periodCardSeeds.find((card) => card.code === "8♦");
assert.ok(defaultPeriodCard);
assert.deepEqual(
  Object.keys(defaultPeriodCard).sort(),
  [
    "code",
    "color",
    "label",
    "over",
    "rank",
    "slug",
    "suitDomain",
    "sweetSpot",
    "title",
    "under",
  ],
);

const defaultPeriodMeanings = buildCardPeriodMeanings(
  defaultPeriodCard,
  PERIOD_FILTERS,
);
assert.equal(defaultPeriodMeanings.meanings.length, 7);
assert.deepEqual(
  defaultPeriodMeanings.meanings.map((meaning) => meaning.period),
  PERIOD_FILTERS.map((filter) => filter.planet),
);
assert.equal(
  defaultPeriodMeanings.meanings[0].headline,
  "8 of Diamonds through the Mercury filter",
);
assert.equal(
  defaultPeriodMeanings.meanings[0].reflectionPrompt,
  "What needs a clearer word, question, or conversation right now?",
);

for (const card of periodCardSeeds) {
  const meanings = buildCardPeriodMeanings(card, PERIOD_FILTERS);
  assert.equal(meanings.card.code, card.code);
  assert.equal(meanings.card.slug, card.slug);
  assert.equal(meanings.meanings.length, PERIOD_FILTERS.length);
  assert.deepEqual(
    meanings.meanings.map((meaning) => meaning.period),
    PERIOD_FILTERS.map((filter) => filter.planet),
  );
}

const compactPeriodPayload = JSON.stringify({
  cards: periodCardSeeds,
  filters: PERIOD_FILTERS,
});
const expandedPeriodPayload = JSON.stringify(
  periodCardSeeds.map((card) => buildCardPeriodMeanings(card, PERIOD_FILTERS)),
);
assert.ok(compactPeriodPayload.length < 40_000);
assert.ok(compactPeriodPayload.length * 10 < expandedPeriodPayload.length);

assert.equal(BIRTHDAY_DIRECTORY_PATH, "/born-on/");
assert.equal(COMPATIBILITY_DIRECTORY_PATH, "/compatibility/");

console.log(
  `PASS: 366 birthdays, reverse card dates, 52 same-card comparisons, 104 legacy redirects, phone line, 3 legacy offers, 1 active public product, analytics, Worker hubs, and 52 compact period seeds (${compactPeriodPayload.length} vs ${expandedPeriodPayload.length} serialized bytes)`,
);

// ============================================================================
// Bible gate (GUIDES/CARDBLUEPRINTS-BIBLE.md as pass/fail) — engine SHIP NOW #7
// ============================================================================

// --- 1. Banned language over every engine-owned indexable/prompt string ----
// Bible §Voice: BANNED in any copy, script, or reading. The gate flags every
// occurrence; reviewed exceptions live in scripts/bible-allowlist.json.
// interpretation-guidance.ts is deliberately NOT scanned: it is the LLM
// prompt and quotes the ban list itself.
const BANNED =
  /\bfate\b|\bdestiny will\b|\bmeant to\b|\bthe universe\b|\bpredicts\b|\bforetells\b/i;

type CopyEntry = { source: string; text: string };
const copy: CopyEntry[] = [];

for (const [code, lens] of Object.entries(
  THREE_LENS as Record<string, Record<string, string>>,
)) {
  for (const [field, text] of Object.entries(lens)) {
    copy.push({ source: `card-meanings.json ${code}.${field}`, text });
  }
}
for (const [code, desc] of Object.entries(
  CARD_DESCRIPTIONS as Record<string, Record<string, string>>,
)) {
  for (const [field, text] of Object.entries(desc)) {
    copy.push({ source: `card-descriptions.json ${code}.${field}`, text });
  }
}
for (const role of LIFE_PATH_ROLES) {
  for (const field of ["title", "phrase", "constitution", "relationship"] as const) {
    copy.push({ source: `LIFE_PATH_ROLES ${role.key}.${field}`, text: role[field] });
  }
}
for (const filter of PERIOD_FILTERS) {
  for (const [field, value] of Object.entries(filter)) {
    if (typeof value === "string") {
      copy.push({ source: `PERIOD_FILTERS ${filter.planet}.${field}`, text: value });
    }
  }
}
for (const card of allCardSeo()) {
  const meta = cardMeta(card);
  copy.push({ source: `cardMeta ${card.slug}.title`, text: meta.title });
  copy.push({ source: `cardMeta ${card.slug}.description`, text: meta.description });
}
for (const date of allBirthdateSeo()) {
  const meta = dateMeta(date);
  copy.push({ source: `dateMeta ${date.slug}.title`, text: meta.title });
  copy.push({ source: `dateMeta ${date.slug}.description`, text: meta.description });
}

const allowed = new Set(
  (ALLOWLIST.entries as { source: string; match: string }[]).map(
    (entry) => `${entry.source}::${entry.match}`,
  ),
);
const languageViolations: string[] = [];
for (const entry of copy) {
  const match = BANNED.exec(entry.text);
  if (match && !allowed.has(`${entry.source}::${match[0].toLowerCase()}`)) {
    languageViolations.push(`${entry.source}: "…${match[0]}…"`);
  }
  // Bible §Math: never "52 cards, 365 days" — 364 of 365 is the only truthful
  // form. Any other 365 in engine copy needs an allowlist entry.
  if (/\b365\b/.test(entry.text) && !/364 of 365/.test(entry.text)) {
    if (!allowed.has(`${entry.source}::365`)) {
      languageViolations.push(`${entry.source}: unqualified "365"`);
    }
  }
}
assert.deepEqual(languageViolations, [], `Bible language gate:\n${languageViolations.join("\n")}`);

// --- 2. One-walk invariant: public Life Spread === engine walk, all 52 -----
const ALLOWED_ROLES = new Set([
  "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus",
  "neptune", "pluto", "result",
]);
const QUARANTINED = /princess|prince\b|the queen|the king/i;
for (const card of allCardSeo()) {
  const spread = buildPublicLifeSpread(card.code);
  assert.ok(spread, `no public life spread for ${card.code}`);
  const line = cardology.cardsFrom(card.code, 1, 9);
  assert.ok(line, `no engine walk for ${card.code}`);
  assert.deepEqual(
    spread.positions.slice(1).map((p) => p.code),
    line,
    `one-walk invariant broken for ${card.code}`,
  );
  for (const position of spread.positions) {
    assert.ok(ALLOWED_ROLES.has(position.role), `role ${position.role} not public`);
    assert.doesNotMatch(position.title, QUARANTINED, `${card.code} ${position.role}`);
    assert.ok(position.slug, `missing slug for ${card.code} ${position.role}`);
    // The mesh claim only holds if every emitted slug is a real card page.
    assert.ok(
      cardBySlug(position.slug!),
      `${card.code} ${position.role} slug "${position.slug}" is not a card page`,
    );
  }
  // Board shape "Moon + birth + Mercury→Result": birth is the page subject,
  // carried at the root, never as a self-linking row inside positions[].
  assert.equal(spread.birthCardSlug, card.slug, `birthCardSlug for ${card.code}`);
  assert.ok(
    !spread.positions.some((p) => p.role === ("birth" as string)),
    `${card.code} must not emit a self-linking birth row`,
  );
  // Exactly the seven 52-day period positions carry a planet — Pluto and
  // Result are the lifetime pair (doc §6), Moon is a connection (doc §9).
  assert.equal(spread.positions.filter((p) => p.planet !== null).length, 7, card.code);
  // Karma pair matches the card-page source (CardSeo.karma) exactly.
  assert.deepEqual(
    spread.karma ?? undefined,
    card.karma,
    `karma split-brain for ${card.code}`,
  );
}

// --- 3. Joker boundary on every date→card entry point ----------------------
assert.equal(birthCardFromISODate("1990-12-31"), null);
assert.throws(
  () => buildReading("1990-12-31"),
  (e: unknown) =>
    e instanceof JokerNotSupportedError && e.code === "JOKER_UNSUPPORTED",
  "buildReading must refuse Dec 31 with a typed error",
);
// getReading must preserve the machine-readable code (X5 amendment).
await getReading("1990-12-31").then(
  () => {
    throw new Error("getReading must reject Dec 31");
  },
  (e: unknown) => {
    assert.ok(e instanceof EngineError, "getReading rejects EngineError");
    assert.equal(e.code, "JOKER_UNSUPPORTED");
  },
);

// The three API routes map refusals through engineErrorResponse; assert the
// contract here so a 500 for a valid-but-unsupported date cannot come back.
await getReading("1990-12-31").catch((e: unknown) => {
  const mapped = engineErrorResponse(e);
  assert.equal(mapped.status, 422, "Joker must be 422, never 500");
  assert.equal(mapped.body.code, "JOKER_UNSUPPORTED");
});
await getReading("not-a-date").catch((e: unknown) => {
  assert.equal(engineErrorResponse(e).status, 400);
});

// --- 4. Ruling-card cardinality (indexable records must match calculator) --
const multiRuling = allBirthdateSeo().filter((date) => date.rulingCards.length > 1);
assert.equal(multiRuling.length, 47, "45 dual + 2 triple PRC dates");
assert.equal(
  multiRuling.filter((date) => date.rulingCards.length === 3).length,
  2,
  "triples are 10/23 and 10/24",
);
for (const date of allBirthdateSeo()) {
  assert.equal(date.rulingCard, date.rulingCards[0] ?? null, date.slug);
}

// --- 5. Known zodiacFor ↔ PRC_DATA contradictions (pinned, not endorsed) ---
// On these single-PRC dates the ruling card is the birth card's position card
// for one planet, while zodiacFor prints a sign ruled by a different planet.
// This pin asserts the contradiction still EXISTS so that changing either
// table without cass's A/B doctrine ruling (DECISIONS_FOR_CASS.md) trips CI.
// After the ruling, replace this pin with a real consistency assert.
// Default leaves FAQ causal sentence live on app pages (page.tsx:378,382) —
// that is intentional until cass rules A/B; this pin is table tension only.
const KNOWN_SIGN_CONFLICTS: {
  date: [number, number];
  positionIndex: number; // index into cardsFrom(bc, 1, 9): 0=Mercury … 7=Pluto
  positionPlanet: string;
  printedSign: string;
}[] = [
  { date: [2, 19], positionIndex: 5, positionPlanet: "Uranus", printedSign: "Pisces" },
  { date: [6, 21], positionIndex: 0, positionPlanet: "Mercury", printedSign: "Cancer" },
  { date: [1, 20], positionIndex: 4, positionPlanet: "Saturn", printedSign: "Aquarius" },
  { date: [1, 21], positionIndex: 4, positionPlanet: "Saturn", printedSign: "Aquarius" },
];
for (const conflict of KNOWN_SIGN_CONFLICTS) {
  const [month, day] = conflict.date;
  const [bc] = cardology.getBirthCard(month, day);
  const prcRaw = cardology.getPlanetaryRulingCard(month, day);
  const prc = Array.isArray(prcRaw) ? prcRaw[0] : prcRaw;
  const line = cardology.cardsFrom(bc, 1, 9);
  assert.ok(line);
  assert.equal(
    prc,
    line[conflict.positionIndex],
    `${month}/${day}: PRC no longer matches ${conflict.positionPlanet} position — re-check the sign tables`,
  );
  assert.equal(zodiacFor(month, day).sign, conflict.printedSign);
}
// 11/22: dual PRC = Mars + Pluto positions (Scorpio pattern) while zodiacFor
// prints Sagittarius.
{
  const [bc] = cardology.getBirthCard(11, 22);
  const prcRaw = cardology.getPlanetaryRulingCard(11, 22) as string[];
  const line = cardology.cardsFrom(bc, 1, 9)!;
  assert.deepEqual(prcRaw, [line[2], line[7]], "11/22 Mars+Pluto pattern");
  assert.equal(zodiacFor(11, 22).sign, "Sagittarius");
}

console.log(
  "PASS: Bible gate — banned language (0 violations), one-walk invariant ×52, quarantine, Joker refusal + getReading code + route 422 mapping, 47 multi-PRC records, 5 pinned sign conflicts",
);
