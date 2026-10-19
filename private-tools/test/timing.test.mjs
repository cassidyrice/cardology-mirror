import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture, fields, people} from './fixtures.mjs';
import {buildDocument, buildHostedDocument, buildEngineData, readDraft, renderOfferReport, OFFERS} from '../.test-build/reference.mjs';

const f = await fixture();

test('hosted Timing accepts exactly one person and round-trips a v3 draft', async () => {
  const {offers} = await (await f.request('/api/config')).json();
  assert.equal(offers['timing-map'].people, 1);
  assert.deepEqual(offers['timing-map'].sections, ['Your Baseline & Yearly Themes', 'Dated Seasons Across the Next Twelve Months', 'Your Current Season in Practice', 'Questions for the Year Ahead']);
  const input = {...fields(), sections: ['Baseline', 'Dated seasons', 'Current practice', 'Year ahead'], notes: 'Reader notes'};
  const response = await f.request('/api/report', input); assert.equal(response.status, 200);
  const output = await response.json();
  assert.equal(output.draft.version, 3); assert.equal(output.draft.people.length, 1);
  const imported = await f.request('/api/draft', output.draft); assert.equal(imported.status, 200);
  assert.deepEqual((await imported.json()).draft, output.draft);
  for (const count of [0, 2, 3, 4]) {
    const invalid = {...input, people: people.slice(0, count)};
    for (const path of ['/api/report', '/api/draft']) {
      const rejected = await f.request(path, {...invalid, format: 'card-blueprints-report', version: 3});
      assert.equal(rejected.status, 400); assert.match(await rejected.text(), /exactly one person/);
    }
  }
  assert.deepEqual(output.engine.identityLinks, []); assert.deepEqual(output.engine.appearances, []); assert.deepEqual(output.engine.overlaps, []);
  assert.doesNotMatch(output.html, /Where you click|Where you clash|Shared cards|Nobody’s year is a solo act|When They Cross Your Path|A quiet year between you|Read these together|Meanwhile, between the others/);
  assert.match(output.html, /Right now/); assert.match(output.html, /Questions for the Year Ahead/);
  assert.equal((output.html.match(/class="season"/g) || []).length, output.engine.people[0].windows.length);
  assert.ok(output.html.includes(`${output.engine.people[0].windows.length} dated seasons`));
  assert.doesNotMatch(output.html, /seven seasons|seven windows/i);
});

test('legacy three-person Timing imports fail without changing the draft and remain valid in desktop', async () => {
  const legacy = {format: 'card-blueprints-report', version: 2, ...fields(), people: people.slice(0, 3), sections: ['Original baseline', 'Original seasons', 'Original shared writing', 'Original crossings']};
  const original = structuredClone(legacy);
  const rejected = await f.request('/api/draft', legacy);
  assert.equal(rejected.status, 400);
  assert.match(await rejected.text(), /three-person desktop report builder.*Nothing has been imported/);
  assert.deepEqual(legacy, original);
  assert.deepEqual(readDraft(legacy), legacy);
  const desktop = buildDocument(legacy);
  assert.equal(desktop.draft.version, 2); assert.equal(desktop.engine.people.length, 3);
  assert.match(desktop.html, /Original shared writing|Original shared/);
  assert.match(desktop.html, /Shared cards/);
});

test('individual Timing matches unchanged engine data and legacy buyer facts across birthday and leap boundaries', () => {
  const cases = [
    ['1991-02-17', '2026-10-15', 8],
    ['1991-02-17', '2026-02-16', 8],
    ['1991-02-17', '2026-02-17', 7],
    ['1991-02-17', '2026-02-18', 8],
    ['2000-02-29', '2027-02-28', 7],
    ['2000-02-29', '2028-02-29', 7],
    ['2000-02-29', '2028-03-01', 8],
  ];
  for (const [birthdate, readingDate, count] of cases) {
    const input = {...fields(), readingDate, people: [{...people[0], birthdate}]};
    const output = buildHostedDocument(input), expected = buildEngineData(output.draft);
    assert.deepEqual(output.engine, expected, `${birthdate}/${readingDate}`);
    const legacy = buildDocument({...input, people: [...input.people, ...people.slice(1, 3)]});
    assert.deepEqual(output.engine.people[0], legacy.engine.people[0]);
    assert.deepEqual(output.engine.window, legacy.engine.window);
    const windows = output.engine.people[0].windows;
    assert.equal(windows.length, count, `${birthdate}/${readingDate}`);
    assert.equal(windows[0].start, readingDate); assert.equal(windows.at(-1).end, output.engine.window.end);
    for (let i = 1; i < windows.length; i++) assert.equal(Date.parse(windows[i].start) - Date.parse(windows[i - 1].end), 86400000);
    assert.ok(output.html.includes(`${count} dated seasons`));
  }
});

test('individual presentation is explicitly guarded and writing stays escaped at permitted limits', async () => {
  const output = buildHostedDocument(fields());
  const {offers} = await (await f.request('/api/config')).json();
  for (const draft of [{...output.draft, version: 2}, {...output.draft, offer: 'family'}, {...output.draft, people}]) {
    assert.throws(() => renderOfferReport(draft, output.engine, offers['timing-map'], 'individual-timing'), /Individual Timing requires/);
  }
  assert.throws(() => renderOfferReport(output.draft, {...output.engine, people}, offers['timing-map'], 'individual-timing'), /Individual Timing requires/);
  assert.throws(() => renderOfferReport(output.draft, output.engine, offers['timing-map'], 'unknown'), /Unsupported report presentation/);
  const input = {...fields(), people: [{...people[0], name: 'W'.repeat(60), relation: 'R'.repeat(60)}], sections: Array(4).fill('<script>x()</script> & '.repeat(300).slice(0, 6000)), notes: 'N'.repeat(12000)};
  const response = await f.request('/api/report', input); assert.equal(response.status, 200);
  const maximum = await response.json();
  assert.deepEqual(maximum.draft.sections, input.sections); assert.equal(maximum.draft.notes.length, 12000);
  assert.ok(maximum.html.includes('W'.repeat(60))); assert.match(maximum.html, /&lt;script&gt;/);
  assert.doesNotMatch(maximum.html, /<script>|<img[^>]+onerror/);
  for (const change of [{sections: ['x'.repeat(6001), '', '', '']}, {notes: 'x'.repeat(12001)}, {people: [{...people[0], name: 'x'.repeat(61)}]}]) {
    assert.equal((await f.request('/api/report', {...fields(), ...change})).status, 400);
  }
});

// Captured from unmodified 6c1f088 before the individual renderer was added.
// These guard the entire legacy HTML, including text, geometry and embedded faces.
const baseline = {
  'timing-map-3-normal': '32801e2e8243f396c4af88a335035492b8d4b026838c9e544943300c8e2923c1',
  'timing-map-3-long': 'f1bc052946854b90bdf18e6dbcdc18a8590bd0b28cfa10c01c3c73802490c626',
  'chemistry-2-normal': 'c4cc56883a42098b59f34fee52dfc132467af510c5b0e1ed627b7847a4b8d227',
  'chemistry-2-long': '34906cbad83c731be40a7e5db71091c9ffe99510de2c78beca0f0d199b50e129',
  'family-2-normal': 'c884146295219dbdb185f6365da598bfcd4cc6161dc99ece07f121312618acff',
  'family-2-long': 'c99282af62db4f287eea7f2c9f65949cc996e37087485adf05f6c164cd98a10d',
  'family-3-normal': 'c81a380f4e4ee06f2e608d97635f37eb8c5c260f53e0b6ea3ae24adbefd5664b',
  'family-3-long': '3ae20291c38c606308e9454ff8685e679829842614e15634be4f0f837355e767',
  'family-4-normal': 'e445a9f3bb2caabd95799537efb94402c3b4beee2c37157b3f45503e9b3af1ea',
  'family-4-long': 'd5b5486665f25113358845019005b7828bdb021646b26a1b6feabf52fbf29933',
};
test('default renderer preserves all ten legacy Timing, Chemistry and Family HTML fixtures byte for byte', () => {
  for (const [offer, count] of [['timing-map', 3], ['chemistry', 2], ['family', 2], ['family', 3], ['family', 4]]) for (const long of [false, true]) {
    const draft = {format: 'card-blueprints-report', version: 2, ...fields(offer), people: people.slice(0, count).map((p, i) => long ? {...p, name: String(i + 1).repeat(60), relation: 'R'.repeat(60)} : p), sections: ['Legacy <writing> & review.', '', '', ''], notes: 'Preserve all original people.'};
    const hash = createHash('sha256').update(renderOfferReport(draft, buildEngineData(draft), OFFERS[offer])).digest('hex');
    const label = `${offer}-${count}-${long ? 'long' : 'normal'}`;
    assert.equal(hash, baseline[label], label);
  }
});
