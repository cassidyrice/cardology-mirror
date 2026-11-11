// Deterministic Cardology spread fact builder for $26 Timing Map and $39 Chemistry Check readings.
// Every card, ruling card, permanent Life Spread seat, yearly spread card, and 52-day calendar
// date window comes straight from lib/engine-core/engine.js + lib/reading.ts + lib/year-blueprint.ts.
// Zero invented symbolism; December 31 (Joker) throws JokerNotSupportedError so no buyer is ever
// silently mapped to K♠.

import { canonicalCalendarDate } from "./birthdate";
import { resolvePublicBirth } from "./birth-card-truth";
import { parseCard } from "./cards";
import { cardology } from "./engine-core/engine.js";
import { buildLifePathProfileForCard, type LifePathCardProfile } from "./life-path";
import { buildReading, JokerNotSupportedError } from "./reading";
import { getCardSeo } from "./seo-cards";
import type { PlanetName } from "./types";
import { buildYearBlueprint } from "./year-blueprint";

export type QuestionTrack = "timing-map" | "chemistry-check";

export interface PeriodWindowFact {
  planet: PlanetName;
  index: number;
  bcCard: string;
  bcLabel: string;
  prcCard: string | null;
  prcLabel: string | null;
  startIso: string;
  endIso: string;
  rangeLabel: string;
  state: "done" | "now" | "next";
  sweetSpot: string;
  under: string;
  over: string;
}

export interface AgeYearFact {
  age: number;
  spreadYear: number;
  karmaSpreadYear: number;
  yearStartIso: string;
  yearEndIso: string;
  yearRangeLabel: string;
  longRangeCard: string;
  longRangeLabel: string;
  prcLongRangeCard: string | null;
  plutoCard: string;
  plutoLabel: string;
  resultCard: string;
  resultLabel: string;
  prcPlutoCard: string | null;
  prcResultCard: string | null;
  environmentCard: string | null;
  displacementCard: string | null;
  prcEnvironmentCard: string | null;
  prcDisplacementCard: string | null;
  selfEnvironmentAndDisplacement: boolean;
  periods: PeriodWindowFact[];
  activePeriod: PeriodWindowFact;
  nextPeriod: PeriodWindowFact | null;
}

export interface PersonSpreadFacts {
  name: string;
  birthdate: string;
  birthdateDisplay: string;
  birthCard: string;
  birthCardLabel: string;
  birthCardSlug: string;
  birthCardTitle: string;
  rulingCard: string;
  rulingCardLabel: string;
  rulingCards: string[];
  suitDomain: string;
  coreIdentity: string;
  gifts: string[];
  shadow: string;
  sweetSpot: string;
  under: string;
  over: string;
  lifetimeEnvironment: string | null;
  lifetimeDisplacement: string | null;
  moonCard: string;
  venusCard: string;
  marsCard: string;
  saturnCard: string;
  currentYear: AgeYearFact;
  nextYear: {
    age: number;
    opensIso: string;
    opensLabel: string;
    longRangeCard: string;
    plutoCard: string;
    resultCard: string;
    prcResultCard: string | null;
    environmentCard: string | null;
    displacementCard: string | null;
    prcEnvironmentCard: string | null;
    prcDisplacementCard: string | null;
  };
}

export interface PermanentSeatHit {
  subjectCard: string;
  subjectCardKind: "birth" | "ruling";
  ownerSpreadCard: string;
  ownerSpreadKind: "birth" | "ruling";
  seatKey: string;
  seatTitle: string;
  relationshipMeaning: string;
}

export interface OverlappingCardWindow {
  card: string;
  cardLabel: string;
  startIso: string;
  endIso: string;
  rangeLabel: string;
  days: number;
  person1Planet: PlanetName;
  person2Planet: PlanetName;
}

export interface CrossYearAppearance {
  whoAppears: "person1_in_person2" | "person2_in_person1";
  card: string;
  cardKind: "birth" | "ruling";
  where: string;
  whenLabel: string;
}

export interface CompatibilitySpreadFacts {
  person1InPerson2: PermanentSeatHit[];
  person2InPerson1: PermanentSeatHit[];
  directionality: "mutual" | "one-way-2-to-1" | "one-way-1-to-2" | "indirect";
  directionSummary: string;
  hasMoonConnection: boolean;
  sharedWindowCards: { card: string; label: string }[];
  overlappingWindows: OverlappingCardWindow[];
  crossYearAppearances: CrossYearAppearance[];
}

export interface QuestionReadingFacts {
  track: QuestionTrack;
  targetDateIso: string;
  question: string;
  relationshipContext: string;
  person1: PersonSpreadFacts;
  person2: PersonSpreadFacts | null;
  compatibility: CompatibilitySpreadFacts | null;
  summaryBullets: string[];
}

const SHORT_MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function labelFromCode(code: string | null | undefined): string {
  if (!code) return "";
  return parseCard(code)?.label ?? code;
}

function formatIsoRange(startIso: string, endIso: string): string {
  const [, sm, sd] = startIso.split("-").map(Number);
  const [, em, ed] = endIso.split("-").map(Number);
  return `${SHORT_MONTH[sm - 1]} ${sd} – ${SHORT_MONTH[em - 1]} ${ed}`;
}

function formatIsoDateWithYear(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${SHORT_MONTH[m - 1]} ${d}, ${y}`;
}

function addOneDayIso(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

function yearlyEnvDisp(card: string | null, age: number): { environment: string | null; displacement: string | null } {
  if (!card || ["8♣", "J♥", "K♠"].includes(card)) {
    return { environment: null, displacement: null };
  }
  const karmaSpread = ((age % 90) + 90) % 90;
  const raw = cardology.getEnvironmentDisplacement(card, karmaSpread) as
    | { environment: string; displacement: string }
    | null;
  return {
    environment: raw?.environment ?? null,
    displacement: raw?.displacement ?? null,
  };
}

async function buildPersonFacts(
  birthdateInput: string,
  rawName: string,
  fallbackName: string,
  targetIso: string,
): Promise<PersonSpreadFacts> {
  const iso = canonicalCalendarDate(birthdateInput);
  if (!iso) {
    throw new Error(`invalid birthdate: ${birthdateInput}`);
  }
  const [, month, day] = iso.split("-").map(Number);
  const publicBirth = resolvePublicBirth(month, day);
  if (publicBirth.kind === "joker") {
    throw new JokerNotSupportedError();
  }

  const reading = buildReading(iso, targetIso);
  const yearBp = await buildYearBlueprint(iso, targetIso);
  const bc = reading.archetype.birth_card;
  const prc = reading.archetype.prc;
  const prcRaw = cardology.getPlanetaryRulingCard(month, day) as string | string[] | null;
  const rulingCards = Array.isArray(prcRaw) ? prcRaw : prcRaw ? [prcRaw] : [prc];

  const seo = getCardSeo(bc);
  const lifeProfile = buildLifePathProfileForCard(bc);
  const bcEnvDisp = yearlyEnvDisp(bc, reading.timing.age);
  const prcEnvDisp = yearlyEnvDisp(prc, reading.timing.age);

  const periods: PeriodWindowFact[] = yearBp.chapters.map((ch) => {
    const prcCard = reading.prc_spread.periods[ch.planet] ?? null;
    const periodSeo = getCardSeo(ch.card.code);
    return {
      planet: ch.planet,
      index: ch.index,
      bcCard: ch.card.code,
      bcLabel: ch.card.name,
      prcCard,
      prcLabel: prcCard ? labelFromCode(prcCard) : null,
      startIso: ch.start,
      endIso: ch.end,
      rangeLabel: formatIsoRange(ch.start, ch.end),
      state: ch.state,
      sweetSpot: periodSeo?.sweetSpot ?? ch.copy.light,
      under: periodSeo?.under ?? ch.copy.shadow,
      over: periodSeo?.over ?? ch.copy.dare,
    };
  });

  const activePeriod = periods.find((p) => p.state === "now") ?? periods[periods.length - 1];
  const nextPeriod = periods[activePeriod.index + 1] ?? null;

  // Next age year starts the day after yearBp.yearEnd
  const nextYearStartIso = addOneDayIso(yearBp.yearEnd);
  const nextReading = buildReading(iso, nextYearStartIso);
  const nextBcEnvDisp = yearlyEnvDisp(bc, nextReading.timing.age);
  const nextPrcEnvDisp = yearlyEnvDisp(prc, nextReading.timing.age);

  const findRoleCard = (key: string) =>
    lifeProfile?.allCards.find((item) => item.key === key)?.card ?? "";

  return {
    name: rawName.trim() || fallbackName,
    birthdate: iso,
    birthdateDisplay: yearBp.birthdateDisplay,
    birthCard: bc,
    birthCardLabel: seo?.label ?? labelFromCode(bc),
    birthCardSlug: seo?.slug ?? yearBp.birthCard.slug,
    birthCardTitle: seo?.title ?? yearBp.birthCard.title,
    rulingCard: prc,
    rulingCardLabel: labelFromCode(prc),
    rulingCards,
    suitDomain: seo?.suitDomain ?? "",
    coreIdentity: seo?.coreIdentity ?? yearBp.birthIdentity,
    gifts: seo?.gifts ?? [],
    shadow: seo?.shadow ?? yearBp.birthShadowLong,
    sweetSpot: seo?.sweetSpot ?? "",
    under: seo?.under ?? "",
    over: seo?.over ?? "",
    lifetimeEnvironment: seo?.karma?.environment ?? null,
    lifetimeDisplacement: seo?.karma?.displacement ?? null,
    moonCard: findRoleCard("moon"),
    venusCard: findRoleCard("venus"),
    marsCard: findRoleCard("mars"),
    saturnCard: findRoleCard("saturn"),
    currentYear: {
      age: reading.timing.age,
      spreadYear: reading.timing.sy_nav,
      karmaSpreadYear: ((reading.timing.age % 90) + 90) % 90,
      yearStartIso: yearBp.yearStart,
      yearEndIso: yearBp.yearEnd,
      yearRangeLabel: `${yearBp.yearStartLabel} – ${yearBp.yearEndLabel}`,
      longRangeCard: reading.long_range.bc.card,
      longRangeLabel: labelFromCode(reading.long_range.bc.card),
      prcLongRangeCard: reading.long_range.prc?.card ?? null,
      plutoCard: reading.birth_card_spread.pluto,
      plutoLabel: labelFromCode(reading.birth_card_spread.pluto),
      resultCard: reading.birth_card_spread.result,
      resultLabel: labelFromCode(reading.birth_card_spread.result),
      prcPlutoCard: reading.prc_spread.pluto ?? null,
      prcResultCard: reading.prc_spread.result ?? null,
      environmentCard: bcEnvDisp.environment,
      displacementCard: bcEnvDisp.displacement,
      prcEnvironmentCard: prcEnvDisp.environment,
      prcDisplacementCard: prcEnvDisp.displacement,
      selfEnvironmentAndDisplacement:
        bcEnvDisp.environment === bc && bcEnvDisp.displacement === bc,
      periods,
      activePeriod,
      nextPeriod,
    },
    nextYear: {
      age: nextReading.timing.age,
      opensIso: nextYearStartIso,
      opensLabel: formatIsoDateWithYear(nextYearStartIso),
      longRangeCard: nextReading.long_range.bc.card,
      plutoCard: nextReading.birth_card_spread.pluto,
      resultCard: nextReading.birth_card_spread.result,
      prcResultCard: nextReading.prc_spread.result ?? null,
      environmentCard: nextBcEnvDisp.environment,
      displacementCard: nextBcEnvDisp.displacement,
      prcEnvironmentCard: nextPrcEnvDisp.environment,
      prcDisplacementCard: nextPrcEnvDisp.displacement,
    },
  };
}

function collectPermanentHits(
  subject: PersonSpreadFacts,
  owner: PersonSpreadFacts,
): PermanentSeatHit[] {
  const hits: PermanentSeatHit[] = [];
  const subjectCards: { card: string; kind: "birth" | "ruling" }[] = [
    { card: subject.birthCard, kind: "birth" },
  ];
  if (subject.rulingCard && subject.rulingCard !== subject.birthCard) {
    subjectCards.push({ card: subject.rulingCard, kind: "ruling" });
  }

  const ownerSpreads: { card: string; kind: "birth" | "ruling"; profile: LifePathCardProfile | null }[] = [
    {
      card: owner.birthCard,
      kind: "birth",
      profile: buildLifePathProfileForCard(owner.birthCard),
    },
  ];
  if (owner.rulingCard && owner.rulingCard !== owner.birthCard) {
    ownerSpreads.push({
      card: owner.rulingCard,
      kind: "ruling",
      profile: buildLifePathProfileForCard(owner.rulingCard),
    });
  }

  const seatDisplayTitle = (key: string, shortTitle: string): string => {
    if (key === "princess") return "Result / Cosmic Reward";
    if (key === "prince") return "Cosmic Lesson";
    return shortTitle;
  };

  for (const subj of subjectCards) {
    for (const own of ownerSpreads) {
      if (!own.profile) continue;
      for (const item of own.profile.allCards) {
        if (item.key === "birth") continue;
        if (item.card === subj.card) {
          hits.push({
            subjectCard: subj.card,
            subjectCardKind: subj.kind,
            ownerSpreadCard: own.card,
            ownerSpreadKind: own.kind,
            seatKey: item.key,
            seatTitle: seatDisplayTitle(item.key, item.shortTitle),
            relationshipMeaning: item.relationship,
          });
        }
      }
    }
  }
  return hits;
}

async function computeOverlappingWindows(
  person1: PersonSpreadFacts,
  person2: PersonSpreadFacts,
  targetIso: string,
): Promise<OverlappingCardWindow[]> {
  // Collect all 52-day chapters across current + next year for both people so a 365-day
  // lookahead catches overlaps even across a birthday boundary.
  const p1NextBp = await buildYearBlueprint(person1.birthdate, person1.nextYear.opensIso);
  const p2NextBp = await buildYearBlueprint(person2.birthdate, person2.nextYear.opensIso);

  const horizonEndIso = (() => {
    const [y, m, d] = targetIso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 365)).toISOString().slice(0, 10);
  })();

  const p1All = [
    ...person1.currentYear.periods.map((p) => ({
      planet: p.planet,
      card: p.bcCard,
      startIso: p.startIso,
      endIso: p.endIso,
    })),
    ...p1NextBp.chapters.map((ch) => ({
      planet: ch.planet,
      card: ch.card.code,
      startIso: ch.start,
      endIso: ch.end,
    })),
  ];

  const p2All = [
    ...person2.currentYear.periods.map((p) => ({
      planet: p.planet,
      card: p.bcCard,
      startIso: chStart(p),
      endIso: p.endIso,
    })),
    ...p2NextBp.chapters.map((ch) => ({
      planet: ch.planet,
      card: ch.card.code,
      startIso: ch.start,
      endIso: ch.end,
    })),
  ];

  function chStart(p: { startIso: string }) {
    return p.startIso;
  }

  const overlaps: OverlappingCardWindow[] = [];
  for (const w1 of p1All) {
    if (w1.endIso < targetIso || w1.startIso > horizonEndIso) continue;
    for (const w2 of p2All) {
      if (w2.card !== w1.card) continue;
      const startIso = w1.startIso > w2.startIso ? w1.startIso : w2.startIso;
      const endIso = w1.endIso < w2.endIso ? w1.endIso : w2.endIso;
      if (startIso <= endIso && endIso >= targetIso && startIso <= horizonEndIso) {
        const sMs = Date.parse(`${startIso}T00:00:00Z`);
        const eMs = Date.parse(`${endIso}T00:00:00Z`);
        const days = Math.round((eMs - sMs) / 86_400_000) + 1;
        overlaps.push({
          card: w1.card,
          cardLabel: labelFromCode(w1.card),
          startIso,
          endIso,
          rangeLabel: formatIsoRange(startIso, endIso),
          days,
          person1Planet: w1.planet,
          person2Planet: w2.planet,
        });
      }
    }
  }
  return overlaps;
}

function collectCrossYearAppearances(
  person1: PersonSpreadFacts,
  person2: PersonSpreadFacts,
): CrossYearAppearance[] {
  const out: CrossYearAppearance[] = [];
  const checkDirection = (
    subject: PersonSpreadFacts,
    owner: PersonSpreadFacts,
    tag: CrossYearAppearance["whoAppears"],
  ) => {
    const cards: { card: string; kind: "birth" | "ruling" }[] = [
      { card: subject.birthCard, kind: "birth" },
    ];
    if (subject.rulingCard && subject.rulingCard !== subject.birthCard) {
      cards.push({ card: subject.rulingCard, kind: "ruling" });
    }
    for (const c of cards) {
      const cy = owner.currentYear;
      if (cy.longRangeCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Long Range (birth spread)", whenLabel: cy.yearRangeLabel });
      }
      if (cy.plutoCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Pluto (birth spread)", whenLabel: cy.yearRangeLabel });
      }
      if (cy.resultCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Result (birth spread)", whenLabel: cy.yearRangeLabel });
      }
      if (cy.prcResultCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Result (ruling spread)", whenLabel: cy.yearRangeLabel });
      }
      if (cy.environmentCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Environment (birth spread)", whenLabel: cy.yearRangeLabel });
      }
      if (cy.displacementCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: "Displacement (birth spread)", whenLabel: cy.yearRangeLabel });
      }
      for (const p of cy.periods) {
        if (p.bcCard === c.card) {
          out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `${p.planet} 52-day period`, whenLabel: p.rangeLabel });
        }
      }
      const ny = owner.nextYear;
      if (ny.longRangeCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Long Range (age ${ny.age})`, whenLabel: `from ${ny.opensLabel}` });
      }
      if (ny.resultCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Result (age ${ny.age}, birth spread)`, whenLabel: `from ${ny.opensLabel}` });
      }
      if (ny.prcResultCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Result (age ${ny.age}, ruling spread)`, whenLabel: `from ${ny.opensLabel}` });
      }
      if (ny.environmentCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Environment (age ${ny.age})`, whenLabel: `from ${ny.opensLabel}` });
      }
      if (ny.displacementCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Displacement (age ${ny.age})`, whenLabel: `from ${ny.opensLabel}` });
      }
      if (ny.prcDisplacementCard === c.card) {
        out.push({ whoAppears: tag, card: c.card, cardKind: c.kind, where: `Next year Displacement (age ${ny.age}, ruling spread)`, whenLabel: `from ${ny.opensLabel}` });
      }
    }
  };

  checkDirection(person1, person2, "person1_in_person2");
  checkDirection(person2, person1, "person2_in_person1");
  return out;
}

function collectSharedWindowCards(
  person1: PersonSpreadFacts,
  person2: PersonSpreadFacts,
): { card: string; label: string }[] {
  const bag = (p: PersonSpreadFacts) => {
    const s = new Set<string>();
    const cy = p.currentYear;
    for (const per of cy.periods) s.add(per.bcCard);
    s.add(cy.longRangeCard);
    s.add(cy.plutoCard);
    s.add(cy.resultCard);
    if (cy.environmentCard) s.add(cy.environmentCard);
    if (cy.displacementCard) s.add(cy.displacementCard);
    s.add(p.nextYear.longRangeCard);
    s.add(p.nextYear.resultCard);
    return s;
  };
  const s1 = bag(person1);
  const s2 = bag(person2);
  const out: { card: string; label: string }[] = [];
  for (const c of s1) {
    if (s2.has(c)) {
      out.push({ card: c, label: labelFromCode(c) });
    }
  }
  return out;
}

export async function buildQuestionReadingFacts(args: {
  track: QuestionTrack;
  birth1: string;
  name1?: string;
  birth2?: string;
  name2?: string;
  rel2?: string;
  question: string;
  targetDate?: string;
}): Promise<QuestionReadingFacts> {
  const nowIso = args.targetDate
    ? canonicalCalendarDate(args.targetDate) ?? new Date().toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const person1 = await buildPersonFacts(args.birth1, args.name1 ?? "", "You", nowIso);

  if (args.track === "timing-map" || !args.birth2?.trim()) {
    const cy = person1.currentYear;
    const summaryBullets = [
      `${person1.name}: ${person1.birthCard} (${person1.birthCardLabel}) birth card, ${person1.rulingCard} ruling card.`,
      `Age ${cy.age} (${cy.yearRangeLabel}): Long Range ${cy.longRangeCard}, Pluto ${cy.plutoCard}, Result ${cy.resultCard}${
        cy.environmentCard ? `, Environment ${cy.environmentCard}, Displacement ${cy.displacementCard}` : ""
      }.`,
      `Active now: ${cy.activePeriod.planet} ${cy.activePeriod.bcCard} (${cy.activePeriod.rangeLabel})${
        cy.nextPeriod ? `; next: ${cy.nextPeriod.planet} ${cy.nextPeriod.bcCard} (${cy.nextPeriod.rangeLabel}).` : "."
      }`,
      `Next year (age ${person1.nextYear.age}, opens ${person1.nextYear.opensLabel}): Long Range ${person1.nextYear.longRangeCard}, Pluto ${person1.nextYear.plutoCard}, Result ${person1.nextYear.resultCard}.`,
    ];

    return {
      track: "timing-map",
      targetDateIso: nowIso,
      question: args.question.trim(),
      relationshipContext: "",
      person1,
      person2: null,
      compatibility: null,
      summaryBullets,
    };
  }

  const person2 = await buildPersonFacts(args.birth2, args.name2 ?? "", "Person B", nowIso);
  const person1InPerson2 = collectPermanentHits(person1, person2);
  const person2InPerson1 = collectPermanentHits(person2, person1);

  const directionality: CompatibilitySpreadFacts["directionality"] =
    person1InPerson2.length > 0 && person2InPerson1.length > 0
      ? "mutual"
      : person1InPerson2.length > 0
        ? "one-way-2-to-1"
        : person2InPerson1.length > 0
          ? "one-way-1-to-2"
          : "indirect";

  const directionSummary =
    directionality === "mutual"
      ? `Mutual permanent seats: ${person1.name} lands in ${person2.name}'s spread and ${person2.name} lands in ${person1.name}'s spread.`
      : directionality === "one-way-2-to-1"
        ? `One-way permanent pull from ${person2.name} toward ${person1.name}: ${person1.name}'s cards land in ${person2.name}'s spread, while ${person2.name}'s cards do not land in ${person1.name}'s spread.`
        : directionality === "one-way-1-to-2"
          ? `One-way permanent pull from ${person1.name} toward ${person2.name}: ${person2.name}'s cards land in ${person1.name}'s spread, while ${person1.name}'s cards do not land in ${person2.name}'s spread.`
          : `No direct permanent Life Spread seat in either direction; connection runs through suits, ruling cards, shared yearly cards, and 52-day timing windows.`;

  const hasMoonConnection = [...person1InPerson2, ...person2InPerson1].some(
    (h) => h.seatKey === "moon",
  );
  const sharedWindowCards = collectSharedWindowCards(person1, person2);
  const overlappingWindows = await computeOverlappingWindows(person1, person2, nowIso);
  const crossYearAppearances = collectCrossYearAppearances(person1, person2);

  const summaryBullets = [
    `${person1.name}: ${person1.birthCard} birth / ${person1.rulingCard} ruling · Now ${person1.currentYear.activePeriod.planet} ${person1.currentYear.activePeriod.bcCard} (${person1.currentYear.activePeriod.rangeLabel}).`,
    `${person2.name}: ${person2.birthCard} birth / ${person2.rulingCard} ruling · Now ${person2.currentYear.activePeriod.planet} ${person2.currentYear.activePeriod.bcCard} (${person2.currentYear.activePeriod.rangeLabel}).`,
    directionSummary,
    overlappingWindows.length > 0
      ? `Same card at the same time: ${overlappingWindows
          .map(
            (w) =>
              `${w.card} (${w.rangeLabel}, ${person1.name} in ${w.person1Planet} / ${person2.name} in ${w.person2Planet})`,
          )
          .join("; ")}.`
      : `Shared cards across this 12-month cycle: ${
          sharedWindowCards.map((c) => c.card).join(", ") || "none"
        }.`,
  ];

  return {
    track: "chemistry-check",
    targetDateIso: nowIso,
    question: args.question.trim(),
    relationshipContext: (args.rel2 ?? "").trim(),
    person1,
    person2,
    compatibility: {
      person1InPerson2,
      person2InPerson1,
      directionality,
      directionSummary,
      hasMoonConnection,
      sharedWindowCards,
      overlappingWindows,
      crossYearAppearances,
    },
    summaryBullets,
  };
}
