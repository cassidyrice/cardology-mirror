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
import { allPeriodCardSeeds } from "../lib/period-card-seeds";
import { buildCardPeriodMeanings, PERIOD_FILTERS } from "../lib/period-meanings";
import { READING_OFFERS, readingOfferFacts } from "../lib/products";
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
  `PASS: 366 birthdays, reverse card dates, 52 same-card comparisons, 104 legacy redirects, phone line, 3 offers, analytics, Worker hubs, and 52 compact period seeds (${compactPeriodPayload.length} vs ${expandedPeriodPayload.length} serialized bytes)`,
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
