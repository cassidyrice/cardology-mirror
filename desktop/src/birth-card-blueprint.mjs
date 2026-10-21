// Birth Card Blueprint engine: a birthday (month/day, year optional) in, one deterministic data record out.
// Card lookup uses the engine-core tables (solar value 55 - (2*month + day) through SOLAR_TO_CARD, ruling
// cards through PRC_DATA). Every sentence is copied from existing card data; nothing is generated here.
import {SOLAR_TO_CARD, PRC_DATA} from '../../lib/engine-core/engine_data.js';
import bible from '../../lib/card-bible.json';
import notes from '../../lib/card-reading-notes.json';

export const BLUEPRINT_SCHEMA = 'my-card-blueprint-engine/birth-card-blueprint/v1';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const list = value => Array.isArray(value) ? value : value ? [value] : [];

/** Validates a birthday. Without a year, February 29 is allowed (checked against leap year 2000). */
export function readBirthday({month, day, year = null}) {
  if (!Number.isInteger(month) || !Number.isInteger(day) || (year !== null && (!Number.isInteger(year) || year < 100 || year > 9999))) throw Error('Enter a valid birth date.');
  const probe = new Date(Date.UTC(year ?? 2000, month - 1, day));
  if (year !== null) probe.setUTCFullYear(year, month - 1, day);
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) throw Error('Enter a valid calendar date.');
  return {month, day, year};
}

/** Parses the builder's YYYY-MM-DD field, or a month/day-only --MM-DD value. */
export function parseBirthday(value) {
  const match = typeof value === 'string' && /^(?:(\d{4})|-)-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw Error('Enter a complete birth date.');
  return readBirthday({month: Number(match[2]), day: Number(match[3]), year: match[1] ? Number(match[1]) : null});
}

/** The birth card for a month/day: solar value 0 (December 31) is the Joker. */
export function birthCardFor(month, day) {
  const solarValue = 55 - (2 * month + day);
  return {code: SOLAR_TO_CARD[String(solarValue)], solarValue};
}
/** Ruling card(s) in PRC_DATA order; dual-ruler dates return two or three cards. */
export const rulingCardsFor = (month, day) => list(PRC_DATA[`${month}/${day}`]);

// Only these card-bible fields enter the engine record; famous-person lists and page links stay out.
function profile(code) {
  const entry = bible[code];
  if (!entry) throw Error(`No card-bible record for ${code}.`);
  const note = notes[entry.slug] || null;
  return {
    code, name: entry.name, title: entry.title, slug: entry.slug, suit: entry.suit,
    coreIdentity: entry.coreIdentity, lifeDirection: entry.lifeDirection ?? null, keywords: entry.keywords,
    sweetSpot: entry.sweetSpot, gifts: entry.gifts ?? [], surfaceTruth: entry.surfaceTruth ?? null,
    lightName: entry.lightName ?? null, inTheLight: entry.inTheLight ?? null,
    shadow: entry.shadow, cost: entry.cost, watchFor: entry.watchFor,
    under: entry.lens?.under ?? null, over: entry.lens?.over ?? null,
    archetype: entry.archetype ?? null, coreShadow: entry.coreShadow ?? null, prompts: entry.prompts ?? [],
    love: note?.love ?? null, work: note?.work ?? null, reading: note?.reading ?? null,
    relationships: entry.analog?.relationships ?? null, career: entry.analog?.career ?? null,
  };
}

// Love and Work prefer the reading notes; the Joker has none, so its own core lines stand in, labelled.
function area(card, key, fallbackLabel) {
  if (card[key]) return {text: card[key], detail: card[key === 'love' ? 'relationships' : 'career'], source: `lib/card-reading-notes.json · ${card.slug}.${key}`};
  return {text: card.sweetSpot, detail: card.watchFor, composed: true,
    note: `No separate ${fallbackLabel} notes exist for ${card.name}; this section uses its own sweet-spot and watch-for lines.`,
    source: `lib/card-bible.json · ${card.code}.sweetSpot + watchFor (composed)`};
}

/**
 * Builds the Birth Card Blueprint record for one birthday.
 * @param {{month:number, day:number, year?:number|null}} input  Year is optional and changes nothing but the label.
 * @returns Plain JSON: birth card, ruling card(s), and the sourced text for every report section.
 */
export function buildBirthCardBlueprint(input) {
  const {month, day, year} = readBirthday(input);
  const {code, solarValue} = birthCardFor(month, day);
  const birth = profile(code);
  const rulingCodes = rulingCardsFor(month, day);
  if (!rulingCodes.length) throw Error(`No ruling card is listed for ${MONTHS[month - 1]} ${day}.`);
  const joker = code === 'Joker';
  const ruling = rulingCodes.map(profile);
  return {
    schema: BLUEPRINT_SCHEMA, offer: 'birth-card-blueprint',
    birthday: {month, day, year, label: `${MONTHS[month - 1]} ${day}${year === null ? '' : `, ${year}`}`},
    solarValue, joker, birthCard: birth,
    rulingCards: ruling.map(card => ({...card, sameAsBirthCard: card.code === code})),
    love: area(birth, 'love', 'love'), work: area(birth, 'work', 'work'),
    method: {
      birthCard: 'Solar value = 55 − (2 × month + day), looked up in the engine-core SOLAR_TO_CARD table. December 31 has solar value 0, the Joker.',
      rulingCard: 'Planetary ruling card(s) from the engine-core PRC_DATA table for the birthday, in table order. Dates with two or three rulers list each card. The table assigns the Joker to December 31 itself.',
      year: 'The birth year does not change either card; it is shown only as a label.',
      source: 'lib/engine-core/engine_data.js (SOLAR_TO_CARD, PRC_DATA); lib/card-bible.json; lib/card-reading-notes.json',
    },
  };
}
