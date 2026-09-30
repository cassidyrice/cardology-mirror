// Card Blueprint App — the buyer's personal app model, built from the verified
// engine core (lib/engine-core/engine.js) and the reviewed copy libraries
// (card-bible.json for who you are, year-copy.ts for timing). No LLM, nothing
// stored: the birthdate travels in the signed report token and every view is
// recomputed from it.
//
// Index conventions follow docs/cardology-system.md exactly:
//   period spread (Mercury→Neptune, Pluto, Result)  (age + 1) mod 90
//   karma spread (Year Environment / Displacement)  age mod 90
//   Long Range                                      spread floor(age/7)+1, position age mod 7
//   lifetime karma + Life Spread                    spread 1
//   daily card                                      getWeekly(): spread (weeksLived + 1) mod 90
// The ~7.4-day sub-period card inside the active 52-day period (reading.daily)
// is this app's WEEKLY card.
//
// Lifetime karma keeps the site's labels (Karma Gift / Karma Challenge). The
// per-year pair is named "Year Environment" / "Year Displacement" so the two
// series never share a name (cardology-system.md §4).

import { canonicalCalendarDate } from "./birthdate";
import { cardBible, type CardBibleEntry } from "./card-bible";
import { cardology } from "./engine-core/engine.js";
import PLANET_DOMAINS from "./engine-data/planet-domains.json";
import { JokerNotSupportedError, ReadingError } from "./reading";
import type { PlanetName } from "./types";
import { cardCopy, planetCopy, type CardCopy } from "./year-copy";
import { toYearCard, type YearCard } from "./year-blueprint";

export { CARD_APP_SLUG } from "./card-app-slug";

export const PLANETS: PlanetName[] = [
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune",
];

const FIXED_CARDS = new Set(["8♣", "J♥", "K♠"]);
const DAY_MS = 86_400_000;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PLANET_DOMAIN = PLANET_DOMAINS as Record<string, string>;

/** Short position lines, paraphrased from docs/reading-interpretation-reference.md §6–§7. */
export const POSITION_COPY = {
  birth: "Your birth card: the core pattern you play all your life.",
  ruling: "Your ruling card: the part of you that you identify with most. It runs its own year next to your birth card.",
  rulingSecond: "Your second ruling card: also part of who you are. The app times your first ruling card.",
  karmaGift: "A gift you bring in. It tends to show up easily and help.",
  karmaChallenge: "The pattern you're here to make conscious. It repeats until you see it.",
  pluto: "What this year asks you to change. The hard work of the year.",
  result: "What the year pays when you do that work.",
  longRange: "The theme of the whole year. It keeps pulling your attention.",
  yearEnvironment: "This year's support. There's no bad card in this seat; it brings the good side of the card.",
  yearDisplacement: "Where you sit this year. It colors the whole year and brings its own jobs.",
  lifeSaturn: "Your life lesson card: where you're asked to grow up and take responsibility.",
  lifeJupiter: "Your life blessing card: where growth comes easiest.",
  weekly: "A card for about a week, drawn from inside your current 52-day period.",
  daily: "Today's card: one spread per week you've lived, one card per weekday.",
} as const;

export interface AppCardNote {
  card: YearCard;
  note: CardCopy;
}

export interface AppIdentityCard extends AppCardNote {
  title: string;
  coreIdentity: string;
  sweetSpot: string;
  shadow: string;
  cost: string;
  watchFor: string;
  gifts: string[];
  keywords: string[];
  lens: { balanced: string; under: string; over: string } | null;
  lifeDirection: string;
}

export interface AppPeriod {
  planet: PlanetName;
  index: number;
  domain: string;
  frame: string;
  pressure: string;
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  lengthDays: number;
  state: "done" | "now" | "next";
  birth: AppCardNote;
  ruling: AppCardNote | null;
}

export interface AppWeek {
  index: number;
  planet: PlanetName;
  domain: string;
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  state: "done" | "now" | "next";
  birth: AppCardNote;
  ruling: AppCardNote | null;
}

export interface AppDay {
  date: string;
  label: string;
  weekday: string;
  birth: AppCardNote;
  ruling: AppCardNote | null;
}

export type AppEventKind = "good" | "watch" | "turn";

export interface AppEvent {
  kind: AppEventKind;
  /** ISO start; `end` is set for windows longer than a day. */
  date: string;
  end?: string;
  label: string;
  title: string;
  detail: string;
  card?: YearCard;
}

export interface AppYearSignal {
  title: string;
  detail: string;
  card: YearCard;
}

export interface AppLifeYear {
  age: number;
  calendarYear: number;
  spreads: { period: number; karma: number; longRange: number };
  birth: { periods: string[]; pluto: string; result: string; longRange: string };
  ruling: { periods: string[]; pluto: string; result: string; longRange: string } | null;
  environment: string | null;
  displacement: string | null;
}

export interface CardApp {
  version: 1;
  birthdate: string;
  birthdateDisplay: string;
  today: string;
  todayLabel: string;
  age: number;
  identity: {
    birth: AppIdentityCard;
    ruling: AppIdentityCard[];
    fixed: boolean;
  };
  karma: {
    gift: AppCardNote | null;
    challenge: AppCardNote | null;
    fixed: boolean;
  };
  lifeSpread: {
    periods: Array<{ planet: PlanetName } & AppCardNote>;
    pluto: AppCardNote;
    result: AppCardNote;
  };
  year: {
    start: string;
    end: string;
    startLabel: string;
    endLabel: string;
    spreads: { period: number; karma: number; longRange: number };
    periods: AppPeriod[];
    current: AppPeriod;
    birth: { pluto: AppCardNote; result: AppCardNote; longRange: AppCardNote & { cycleStartAge: number; cycleEndAge: number; yearInCycle: number; cycle: YearCard[]; projection: boolean } };
    ruling: { pluto: AppCardNote; result: AppCardNote; longRange: AppCardNote } | null;
    environment: AppCardNote | null;
    displacement: AppCardNote | null;
    signals: AppYearSignal[];
    events: AppEvent[];
  };
  week: {
    current: AppWeek;
    all: AppWeek[];
  };
  day: {
    today: AppDay;
    next: AppDay[];
    weeksLived: number;
    spreadUsed: number;
  };
  events: AppEvent[];
  life: AppLifeYear[];
  copy: typeof POSITION_COPY;
}

// --- dates --------------------------------------------------------------------

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function isoOf(d: Date): string {
  return `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return utc(y, m, d);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function shortLabel(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function weekday(d: Date): string {
  return WEEKDAYS[(d.getUTCDay() + 6) % 7];
}

/** Local-noon Date for the engine's local-time day math (DST-safe, as in reading.ts). */
function engineDate(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
}

/** The birthday in calendar year y. Feb 29 reads as Feb 28 in non-leap years. */
function birthdayIn(y: number, bm: number, bd: number): Date {
  const d = utc(y, bm, bd);
  return d.getUTCMonth() !== bm - 1 ? utc(y, bm, bd - 1) : d;
}

// --- engine wrappers --------------------------------------------------------

const mod90 = (n: number) => ((n % 90) + 90) % 90;

function walk(anchor: string, spreadIndex: number, count: number): string[] {
  const cards = cardology.extractCards(anchor, cardology.getSpread(mod90(spreadIndex)), count);
  if (!cards || cards.length < count) {
    throw new ReadingError(`engine returned no cards for ${anchor} at spread ${spreadIndex}`);
  }
  return cards;
}

function longRangeFor(anchor: string, age: number): { card: string; cycle: string[]; spread: number } {
  const spread = Math.floor(mod90(age) / 7) + 1;
  const cycle = walk(anchor, spread, 7);
  return { card: cycle[mod90(age) % 7], cycle, spread };
}

function yearKarmaFor(anchor: string, age: number) {
  if (FIXED_CARDS.has(anchor)) return null;
  return cardology.getEnvironmentDisplacement(anchor, mod90(age));
}

function dailyCard(anchor: string, by: number, bm: number, bd: number, d: Date) {
  const w = cardology.getWeekly(anchor, by, bm, bd, engineDate(d));
  if (!w) throw new ReadingError(`engine returned no daily card for ${anchor}`);
  return w;
}

function note(code: string): AppCardNote {
  return { card: toYearCard(code), note: cardCopy(code) };
}

function identity(code: string): AppIdentityCard {
  const bible: CardBibleEntry | null = cardBible(code);
  return {
    ...note(code),
    title: bible?.title ?? "",
    coreIdentity: bible?.coreIdentity ?? "",
    sweetSpot: bible?.sweetSpot ?? "",
    shadow: bible?.shadow ?? "",
    cost: bible?.cost ?? "",
    watchFor: bible?.watchFor ?? "",
    gifts: bible?.gifts ?? [],
    keywords: bible?.keywords ?? [],
    lens: bible?.lens ?? null,
    lifeDirection: bible?.lifeDirection ?? "",
  };
}

// --- one birthday year ------------------------------------------------------

interface YearFrame {
  age: number;
  start: Date;
  end: Date;
  periodSpread: number;
  birth9: string[];
  ruling9: string[] | null;
  periodDates: Array<{ planet: PlanetName; start: Date; end: Date }>;
  environment: string | null;
  displacement: string | null;
  longRange: string;
}

function yearFrame(bc: string, prc: string | null, by: number, bm: number, bd: number, startYear: number): YearFrame {
  const start = birthdayIn(startYear, bm, bd);
  const end = addDays(birthdayIn(startYear + 1, bm, bd), -1);
  const age = startYear - by;
  const periodSpread = mod90(age + 1);
  const periodDates = PLANETS.map((planet, i) => {
    const s = addDays(start, i * 52);
    return { planet, start: s, end: i === 6 ? end : addDays(s, 51) };
  });
  const k = yearKarmaFor(bc, age);
  return {
    age,
    start,
    end,
    periodSpread,
    birth9: walk(bc, periodSpread, 9),
    ruling9: prc ? walk(prc, periodSpread, 9) : null,
    periodDates,
    environment: k?.environment ?? null,
    displacement: k?.displacement ?? null,
    longRange: longRangeFor(bc, age).card,
  };
}

function frameFor(date: Date, frames: YearFrame[]): YearFrame | undefined {
  return frames.find((f) => date >= f.start && date <= f.end);
}

function periodIndexOn(date: Date, f: YearFrame): number {
  const idx = f.periodDates.findIndex((p) => date >= p.start && date <= p.end);
  return idx < 0 ? 6 : idx;
}

// --- weekly (sub-period) ----------------------------------------------------

function buildWeeks(
  period: { start: Date; end: Date },
  birthPeriodCard: string,
  rulingPeriodCard: string | null,
  periodSpread: number,
  today: Date,
): AppWeek[] {
  const lengthDays = daysBetween(period.start, period.end) + 1;
  const sub = 52 / 7;
  const birth7 = walk(birthPeriodCard, periodSpread, 7);
  const ruling7 = rulingPeriodCard ? walk(rulingPeriodCard, periodSpread, 7) : null;
  return PLANETS.map((planet, k) => {
    const startOffset = Math.ceil(k * sub);
    const endOffset = k === 6 ? lengthDays - 1 : Math.ceil((k + 1) * sub) - 1;
    const start = addDays(period.start, startOffset);
    const end = addDays(period.start, endOffset);
    const state: AppWeek["state"] = today > end ? "done" : today >= start ? "now" : "next";
    return {
      index: k,
      planet,
      domain: PLANET_DOMAIN[planet] ?? "",
      start: isoOf(start),
      end: isoOf(end),
      startLabel: shortLabel(start),
      endLabel: shortLabel(end),
      state,
      birth: note(birth7[k]),
      ruling: ruling7 ? note(ruling7[k]) : null,
    };
  });
}

// --- events (good days, watch days, turning points) -------------------------

const EVENT_WINDOW_DAYS = 365;

function buildEvents(
  bc: string,
  prc: string | null,
  by: number,
  bm: number,
  bd: number,
  frames: YearFrame[],
  lifetime: { gift: string | null; challenge: string | null },
  today: Date,
  window?: { start: Date; end: Date },
): AppEvent[] {
  const events: AppEvent[] = [];
  const windowStart = window?.start ?? today;
  const windowEnd = window?.end ?? addDays(today, EVENT_WINDOW_DAYS - 1);
  const inWindow = (d: Date) => d >= windowStart && d <= windowEnd;

  for (const f of frames) {
    if (inWindow(f.start)) {
      events.push({
        kind: "turn",
        date: isoOf(f.start),
        label: shortLabel(f.start),
        title: "Your birthday: a new year of cards starts",
        detail: `Age ${f.age}. Your Long Range card becomes ${toYearCard(f.longRange).name} and all seven 52-day periods change.`,
        card: toYearCard(f.longRange),
      });
    }
    f.periodDates.forEach((p, i) => {
      const card = f.birth9[i];
      if (i > 0 && inWindow(p.start)) {
        events.push({
          kind: "turn",
          date: isoOf(p.start),
          label: shortLabel(p.start),
          title: `${p.planet} period starts`,
          detail: `${toYearCard(card).name} rules the next ${daysBetween(p.start, p.end) + 1} days. ${planetCopy(p.planet).frame}`,
          card: toYearCard(card),
        });
      }
      if (p.planet === "Jupiter" && p.end >= windowStart && p.start <= windowEnd) {
        events.push({
          kind: "good",
          date: isoOf(p.start),
          end: isoOf(p.end),
          label: `${shortLabel(p.start)} – ${shortLabel(p.end)}`,
          title: "Jupiter period: your blessing window",
          detail: `The year's main growth window, with ${toYearCard(card).name} as its card. Luck helps most when you meet it halfway.`,
          card: toYearCard(card),
        });
      }
    });
  }

  // Daily-card matches: the day your daily card is one of your key cards.
  for (let d = windowStart; d <= windowEnd; d = addDays(d, 1)) {
    const f = frameFor(d, frames);
    if (!f) continue;
    const code = dailyCard(bc, by, bm, bd, d).current_card;
    const jupiter = f.birth9[3];
    const saturn = f.birth9[4];
    const matches: Array<[AppEventKind, string, string]> = [];
    // Events are dated, often weeks ahead, so the copy says "that day", not "today".
    // (No birth-card day: a daily card is drawn from the birth card's own spread,
    // so it is never the birth card itself.)
    if (code === f.birth9[8]) matches.push(["good", "Result card day", "Your card that day is this year's Result card: what the year pays. A good day to ask, close, or finish."]);
    if (code === f.environment) matches.push(["good", "Support card day", "Your card that day is this year's Environment card. Help tends to come easier."]);
    if (code === jupiter) matches.push(["good", "Jupiter card day", "Your card that day is this year's Jupiter card. A good day to grow something."]);
    if (code === lifetime.gift) matches.push(["good", "Gift card day", "Your card that day is your karma gift card. Lean on what comes naturally."]);
    if (prc && prc !== bc && code === prc) matches.push(["good", "Ruling card day", "Your card that day is your ruling card. A strong day for the part of you that leads."]);
    if (code === lifetime.challenge) matches.push(["watch", "Challenge card day", "Your card that day is your karma challenge card. Notice the old pattern before it runs you."]);
    if (code === saturn) matches.push(["watch", "Saturn card day", "Your card that day is this year's Saturn card. Slow down, do the work, skip the shortcut."]);
    if (code === f.birth9[7]) matches.push(["watch", "Pluto card day", "Your card that day is this year's Pluto card. Change pushes hardest then; don't force it."]);
    for (const [kind, title, detail] of matches) {
      events.push({ kind, date: isoOf(d), label: shortLabel(d), title, detail, card: toYearCard(code) });
    }
  }

  const rank: Record<AppEventKind, number> = { turn: 0, good: 1, watch: 2 };
  return events.sort((a, b) => a.date.localeCompare(b.date) || rank[a.kind] - rank[b.kind]);
}

// --- year signals (docs/reading-interpretation-reference.md §6) -------------

function buildSignals(
  f: YearFrame,
  bc: string,
  prc: string | null,
  life9: string[],
  lifetime: { gift: string | null; challenge: string | null },
): AppYearSignal[] {
  const signals: AppYearSignal[] = [];
  const add = (title: string, detail: string, code: string) =>
    signals.push({ title, detail, card: toYearCard(code) });
  const lifeJupiter = life9[3];
  const lifeSaturn = life9[4];
  const lifePluto = life9[7];
  const yearSaturn = f.birth9[4];

  if (lifetime.challenge && yearSaturn === lifetime.challenge) {
    add("Your challenge card is this year's Saturn card", "The pattern you're here to fix sits in the lesson seat this year. Big chance to finally change it.", yearSaturn);
  }
  if (f.longRange === lifeSaturn) {
    add("Your life lesson card is this year's Long Range", "The lesson you carry for life is the theme of the whole year.", lifeSaturn);
  }
  const plutoSeats: Array<[string, string | null]> = [
    ["Long Range", f.longRange],
    ["Pluto", f.birth9[7]],
    ["Result", f.birth9[8]],
    ["Year Environment", f.environment],
    ["Year Displacement", f.displacement],
  ];
  for (const [seat, code] of plutoSeats) {
    if (code && code === lifePluto) {
      add(`Your life Pluto card is this year's ${seat}`, "The deep change you're here for is active this year.", lifePluto);
    }
  }
  if (f.environment === lifeJupiter || f.birth9[8] === lifeJupiter) {
    add("Your life blessing card lands in a reward seat", "Your Jupiter card is this year's Environment or Result. A strong year for growth.", lifeJupiter);
  }
  if (prc && prc !== bc) {
    if (f.birth9.includes(prc)) {
      add("Your ruling card shows up in your birth card's year", "Both sides of you are working on the same thing this year.", prc);
    }
    if (f.ruling9?.includes(bc)) {
      add("Your birth card shows up in your ruling card's year", "Both sides of you are working on the same thing this year.", bc);
    }
  }

  // Repeats: any card holding two or more seats this year.
  const seats = new Map<string, string[]>();
  const put = (code: string | null, seat: string) => {
    if (!code) return;
    seats.set(code, [...(seats.get(code) ?? []), seat]);
  };
  PLANETS.forEach((p, i) => put(f.birth9[i], `${p} period`));
  put(f.birth9[7], "Pluto");
  put(f.birth9[8], "Result");
  put(f.longRange, "Long Range");
  put(f.environment, "Year Environment");
  // The engine pairs a card with itself at karma spreads 0/45 and for Semi-Fixed
  // cards; that's one seat, not a repeat.
  if (f.displacement !== f.environment) put(f.displacement, "Year Displacement");
  if (f.ruling9) {
    PLANETS.forEach((p, i) => put(f.ruling9![i], `ruling-card ${p} period`));
    put(f.ruling9[7], "ruling-card Pluto");
    put(f.ruling9[8], "ruling-card Result");
  }
  for (const [code, list] of seats) {
    const unique = [...new Set(list)];
    if (unique.length >= 2) {
      add(`${toYearCard(code).name} shows up ${unique.length} times`, `It sits in ${unique.join(", ")}. When the year repeats a card, it's making a point.`, code);
    }
  }
  return signals;
}

// --- main builder -------------------------------------------------------------

/**
 * A `?date=` from the viewer's browser, accepted only within a day of the
 * server's UTC date, and never before `birthdate` (a baby born "today" in UTC
 * can still be "tomorrow" on a buyer's clock west of UTC).
 */
export function appDateParam(date: string | undefined, birthdate?: string): string | undefined {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const offset = Math.abs(Date.parse(`${date}T00:00:00Z`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`));
  if (!Number.isFinite(offset) || offset > 86_400_000) return undefined;
  return birthdate && date < birthdate ? birthdate : date;
}

/**
 * Build the whole app for one birthdate. `todayIso` defaults to today (UTC);
 * the page passes the buyer's local date when it has one.
 */
export function buildCardApp(birthdate: string, todayIso?: string): CardApp {
  const birthIso = canonicalCalendarDate(birthdate);
  if (!birthIso) throw new ReadingError(`invalid birthdate: ${birthdate}`);
  const [by, bm, bd] = birthIso.split("-").map(Number);
  if (bm === 12 && bd === 31) throw new JokerNotSupportedError();

  const now = new Date();
  const todayCanon = todayIso ? canonicalCalendarDate(todayIso) : null;
  if (todayIso && !todayCanon) throw new ReadingError(`invalid date: ${todayIso}`);
  const today = todayCanon ? fromIso(todayCanon) : utc(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
  if (today < utc(by, bm, bd)) throw new ReadingError("date is before the birthdate");

  const [bc] = cardology.getBirthCard(bm, bd);
  const prcRaw = cardology.getPlanetaryRulingCard(bm, bd);
  const prcList = (Array.isArray(prcRaw) ? prcRaw : prcRaw ? [prcRaw] : []).filter(Boolean) as string[];
  // The timed ruling card is the first one that isn't the birth card. For Leos the
  // ruler IS the birth card, so there's no second stream (and Aug 22/23 time their
  // other ruler, 2♦ / 3♠, instead of repeating the birth card).
  const prc = prcList.find((c) => c !== bc) ?? null;

  let startYear = today.getUTCFullYear();
  if (birthdayIn(startYear, bm, bd) > today) startYear -= 1;
  const frames = [yearFrame(bc, prc, by, bm, bd, startYear), yearFrame(bc, prc, by, bm, bd, startYear + 1)];
  const f = frames[0];
  const age = f.age;

  // Lifetime layer: Life Spread walk + karma, both from spread 1.
  const life9 = walk(bc, 1, 9);
  const fixed = FIXED_CARDS.has(bc);
  const lifeKarma = fixed ? null : cardology.getEnvironmentDisplacement(bc, 1);
  const lifetime = { gift: lifeKarma?.environment ?? null, challenge: lifeKarma?.displacement ?? null };

  // This year's seven 52-day periods.
  const periods: AppPeriod[] = f.periodDates.map((p, i) => {
    const pc = planetCopy(p.planet);
    return {
      planet: p.planet,
      index: i,
      domain: PLANET_DOMAIN[p.planet] ?? "",
      frame: pc.frame,
      pressure: pc.pressure,
      start: isoOf(p.start),
      end: isoOf(p.end),
      startLabel: shortLabel(p.start),
      endLabel: shortLabel(p.end),
      lengthDays: daysBetween(p.start, p.end) + 1,
      state: today > p.end ? "done" : today >= p.start ? "now" : "next",
      birth: note(f.birth9[i]),
      ruling: f.ruling9 ? note(f.ruling9[i]) : null,
    };
  });
  const currentIdx = periodIndexOn(today, f);
  const current = periods[currentIdx];

  const weeks = buildWeeks(
    f.periodDates[currentIdx],
    f.birth9[currentIdx],
    f.ruling9 ? f.ruling9[currentIdx] : null,
    f.periodSpread,
    today,
  );
  const currentWeek = weeks.find((w) => w.state === "now") ?? weeks[6];

  // Daily cards: today and the next six days, each resolved on its own date so a
  // week boundary (which falls on the birth weekday) is honoured.
  const dayOn = (d: Date): AppDay => ({
    date: isoOf(d),
    label: shortLabel(d),
    weekday: weekday(d),
    birth: note(dailyCard(bc, by, bm, bd, d).current_card),
    ruling: prc ? note(dailyCard(prc, by, bm, bd, d).current_card) : null,
  });
  const todayWeekly = dailyCard(bc, by, bm, bd, today);
  const next = Array.from({ length: 6 }, (_, i) => dayOn(addDays(today, i + 1)));

  const lr = longRangeFor(bc, age);
  // The strip follows the same canonical age as the card (mod 90, doctrine §10),
  // labelled with real ages. Cycle 12 (ages 84–89) holds six years, not seven (§9).
  const canonAge = mod90(age);
  const cycleYears = canonAge >= 84 ? 6 : 7;
  const cycleStartAge = Math.floor(canonAge / 7) * 7 + (age - canonAge);
  const prcLr = prc ? longRangeFor(prc, age) : null;

  const life: AppLifeYear[] = Array.from({ length: 90 }, (_, a) => {
    const b9 = walk(bc, a + 1, 9);
    const r9 = prc ? walk(prc, a + 1, 9) : null;
    const k = yearKarmaFor(bc, a);
    return {
      age: a,
      calendarYear: by + a,
      spreads: { period: mod90(a + 1), karma: mod90(a), longRange: longRangeFor(bc, a).spread },
      birth: { periods: b9.slice(0, 7), pluto: b9[7], result: b9[8], longRange: longRangeFor(bc, a).card },
      ruling: r9 && prc ? { periods: r9.slice(0, 7), pluto: r9[7], result: r9[8], longRange: longRangeFor(prc, a).card } : null,
      environment: k?.environment ?? null,
      displacement: k?.displacement ?? null,
    };
  });

  return {
    version: 1,
    birthdate: birthIso,
    birthdateDisplay: `${MONTHS[bm - 1]} ${bd}, ${by}`,
    today: isoOf(today),
    todayLabel: `${weekday(today)}, ${shortLabel(today)}, ${today.getUTCFullYear()}`,
    age,
    identity: {
      birth: identity(bc),
      ruling: prcList.map(identity),
      fixed,
    },
    karma: {
      gift: lifetime.gift ? note(lifetime.gift) : null,
      challenge: lifetime.challenge ? note(lifetime.challenge) : null,
      fixed,
    },
    lifeSpread: {
      periods: PLANETS.map((planet, i) => ({ planet, ...note(life9[i]) })),
      pluto: note(life9[7]),
      result: note(life9[8]),
    },
    year: {
      start: isoOf(f.start),
      end: isoOf(f.end),
      startLabel: `${shortLabel(f.start)}, ${f.start.getUTCFullYear()}`,
      endLabel: `${shortLabel(f.end)}, ${f.end.getUTCFullYear()}`,
      spreads: { period: f.periodSpread, karma: mod90(age), longRange: lr.spread },
      periods,
      current,
      birth: {
        pluto: note(f.birth9[7]),
        result: note(f.birth9[8]),
        longRange: {
          ...note(lr.card),
          cycleStartAge,
          cycleEndAge: cycleStartAge + cycleYears - 1,
          yearInCycle: (canonAge % 7) + 1,
          cycle: lr.cycle.slice(0, cycleYears).map(toYearCard),
          projection: age >= 90,
        },
      },
      ruling: f.ruling9 && prcLr
        ? { pluto: note(f.ruling9[7]), result: note(f.ruling9[8]), longRange: note(prcLr.card) }
        : null,
      environment: f.environment ? note(f.environment) : null,
      displacement: f.displacement ? note(f.displacement) : null,
      events: buildEvents(bc, prc, by, bm, bd, frames, lifetime, today, { start: f.start, end: f.end }),
      signals: buildSignals(f, bc, prc, life9, lifetime),
    },
    week: { current: currentWeek, all: weeks },
    day: {
      today: dayOn(today),
      next,
      weeksLived: todayWeekly.weeks_lived,
      spreadUsed: todayWeekly.spread_used,
    },
    events: buildEvents(bc, prc, by, bm, bd, frames, lifetime, today),
    life,
    copy: POSITION_COPY,
  };
}
