import {OFFERS as DESKTOP_OFFERS, buildDocument as buildDesktop, readDraft as readDesktop, buildEngineData, fileStem} from '../../desktop/src/offer-model.mjs';
import {renderOfferReport} from '../../desktop/src/offer-render.mjs';
export {fileStem};

export const OFFERS = {...DESKTOP_OFFERS, family: {...DESKTOP_OFFERS.family, people: 3}};

// Private Family uses exactly three people. Its v3 drafts are explicit about the
// incompatibility with the unchanged desktop v2 four-person Family format.
export function readDraft(value) {
  if (value?.offer !== 'family') return readDesktop(value);
  if (value.version === 2) throw Error('This desktop Family draft uses four people. The private Family Snapshot requires a new three-person draft.');
  if (value.format !== 'card-blueprints-report' || value.version !== 3 ||
      !Array.isArray(value.people) || value.people.length !== 3) throw Error('Family Snapshot requires exactly three people.');
  const text = (value, max, label) => { if (typeof value !== 'string' || value.length > max) throw Error(`Invalid ${label}.`); return value; };
  if (!Array.isArray(value.sections) || value.sections.length !== 4 || typeof value.includeNotes !== 'boolean' || typeof value.reviewed !== 'boolean') throw Error('Invalid report settings.');
  return {
    format: 'card-blueprints-report', version: 3, offer: 'family', readingDate: text(value.readingDate, 10, 'reading date'),
    people: value.people.map(person => ({name: text(person?.name, 60, 'person name'), birthdate: text(person?.birthdate, 10, 'birth date'), relation: text(person?.relation, 60, 'relationship')})),
    sections: value.sections.map(section => text(section, 6000, 'section writing')), notes: text(value.notes, 12000, 'reader notes'), includeNotes: value.includeNotes, reviewed: value.reviewed,
  };
}

export function buildDocument(fields) {
  if (fields.offer !== 'family') return buildDesktop(fields);
  const draft = readDraft({...fields, format: 'card-blueprints-report', version: 3});
  const engine = buildEngineData(draft); // Unchanged shared calculation, including complete reference data.
  return {draft, engine, html: renderOfferReport(draft, engine, OFFERS.family)};
}
