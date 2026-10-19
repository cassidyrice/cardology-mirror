import {OFFERS as DESKTOP_OFFERS, buildDocument as buildDesktop, readDraft as readDesktop, buildEngineData, fileStem} from '../../desktop/src/offer-model.mjs';
import {renderOfferReport} from '../../desktop/src/offer-render.mjs';
export {fileStem};

export const OFFERS = {
  ...DESKTOP_OFFERS,
  'timing-map': {...DESKTOP_OFFERS['timing-map'], people: 1,
    parts: ['Your Core Cards & Yearly Themes', 'Your Year in Practice'],
    sections: ['Your Baseline & Yearly Themes', 'Dated Seasons Across the Next Twelve Months', 'Your Current Season in Practice', 'Questions for the Year Ahead']},
  family: {...DESKTOP_OFFERS.family, people: 3},
};

// Private Timing and Family use v3 rather than silently dropping people or
// reinterpreting the writing in legacy desktop v2 drafts.
export function readDraft(value) {
  const timing = value?.offer === 'timing-map';
  if (!timing && value?.offer !== 'family') return readDesktop(value);
  if (value.version === 2) throw Error(timing
    ? 'Legacy Timing v2 drafts belong to the three-person desktop report builder. Open this file there, or start a new one-person Timing Map here. Nothing has been imported.'
    : 'This desktop Family draft uses four people. Start a new private Family Snapshot with two or three people.');
  if (value.format !== 'card-blueprints-report' || value.version !== 3 ||
      !Array.isArray(value.people) || (timing ? value.people.length !== 1 : ![2, 3].includes(value.people.length))) throw Error(timing ? 'Timing Map supports exactly one person.' : 'Family Snapshot supports two or three people.');
  const text = (value, max, label) => { if (typeof value !== 'string' || value.length > max) throw Error(`Invalid ${label}.`); return value; };
  if (!Array.isArray(value.sections) || value.sections.length !== 4 || typeof value.includeNotes !== 'boolean' || typeof value.reviewed !== 'boolean') throw Error('Invalid report settings.');
  return {
    format: 'card-blueprints-report', version: 3, offer: value.offer, readingDate: text(value.readingDate, 10, 'reading date'),
    people: value.people.map(person => ({name: text(person?.name, 60, 'person name'), birthdate: text(person?.birthdate, 10, 'birth date'), relation: text(person?.relation, 60, 'relationship')})),
    sections: value.sections.map(section => text(section, 6000, 'section writing')), notes: text(value.notes, 12000, 'reader notes'), includeNotes: value.includeNotes, reviewed: value.reviewed,
  };
}

export function buildDocument(fields) {
  if (fields.offer !== 'family' && fields.offer !== 'timing-map') return buildDesktop(fields);
  const draft = readDraft({...fields, format: 'card-blueprints-report', version: 3});
  const engine = buildEngineData(draft); // Unchanged shared calculation, including complete reference data.
  return {draft, engine, html: renderOfferReport(draft, engine, OFFERS[draft.offer], draft.offer === 'timing-map' ? 'individual-timing' : 'default')};
}
