import { cardology } from "../../lib/engine-core/engine.js";
import { buildReading } from "../../lib/reading";

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error("Use YYYY-MM-DD dates");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  if (year < 100 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw Error("Invalid calendar date");
  return date;
}

export function buildProfessionalReading(name: string, birthdate: string, readingDate: string) {
  const birth = parseDate(birthdate);
  const target = parseDate(readingDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (!name.trim() || name.length > 60) throw Error("Client name must be 1 to 60 characters");
  if (birth > today || target < birth) throw Error("Birth date must not be future; reading date must be on or after birth");
  const reading = buildReading(birthdate, readingDate);
  const age = reading.timing.age;
  const indexes = { annual: age % 90, period: (age + 1) % 90, longRange: Math.floor(age / 7) + 1 };
  const slot = age % 7;
  // Use the engine's calculateAge anniversary rule: Feb 29 becomes Feb 28.
  // UTC is only used for calendar-day arithmetic, never to calculate card positions.
  const anniversary = (year: number) => {
    const date = new Date(Date.UTC(year, birth.getMonth(), birth.getDate()));
    if (date.getUTCMonth() !== birth.getMonth()) date.setUTCDate(0);
    return date.getTime();
  };
  const start = anniversary(birth.getFullYear() + age);
  const next = anniversary(birth.getFullYear() + age + 1);
  const iso = (time: number) => new Date(time).toISOString().split("T")[0];
  const targetDay = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const periods = cardology.PLANET_NAMES.map((planet, i) => {
    const from = start + i * 52 * 86400000;
    const to = i === 6 ? next - 86400000 : start + ((i + 1) * 52 - 1) * 86400000;
    return { planet, start: iso(from), end: iso(to), active: targetDay >= from && targetDay <= to };
  });
  const lookup = cardology.getPlanetaryRulingCard(birth.getMonth() + 1, birth.getDate());
  const prcs = Array.isArray(lookup) ? lookup : lookup ? [lookup] : [];
  const anchors = [reading.archetype.birth_card, ...prcs].map((card, i) => ({
    id: i === 0 ? "BC" : `PRC${i}`, card,
    annual: cardology.getEnvironmentDisplacement(card, indexes.annual),
    walk: cardology.cardsFrom(card, indexes.period, 9)!,
    longRange: { cards: cardology.cardsFrom(card, indexes.longRange, 7)! },
  }));
  const jobs = new Map<number, string[]>();
  for (const [index, job] of [[0, "Environment/Displacement reference"], [indexes.annual, "Annual position / Environment / Displacement"], [indexes.period, "Annual period walk / Pluto / Result"], [indexes.longRange % 90, "Long Range"]] as const) {
    jobs.set(index, [...(jobs.get(index) ?? []), job]);
  }
  const boards = [...jobs].map(([index, jobs]) => ({ index, jobs, ...cardology.getSpread(index) }));
  const roles = new Map<string, string[]>();
  const add = (card: string, role: string) => roles.set(card, [...(roles.get(card) ?? []), role]);
  for (const anchor of anchors) {
    add(anchor.card, anchor.id);
    anchor.walk.forEach((card, i) => add(card, `${anchor.id} ${[...cardology.PLANET_NAMES, "Pluto", "Result"][i]}`));
    anchor.longRange.cards.forEach((card, i) => add(card, `${anchor.id} Long Range slot ${i + 1}`));
    if (anchor.annual) {
      add(anchor.annual.environment, `${anchor.id} Environment`);
      add(anchor.annual.displacement, `${anchor.id} Displacement`);
    }
  }
  const congruence = [...roles].filter(([, roles]) => roles.length > 1).map(([card, roles]) => ({ card, roles }));
  return { congruence, boards, projection: age >= 90, name, birthdate, readingDate, age, indexes, slot, anchors, periods };
}
