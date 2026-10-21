// Birth Card Blueprint: every calendar day against the public calculator, determinism, and the hosted API.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixture, fields} from './fixtures.mjs';
import {buildBirthCardBlueprint, parseBirthday, calculateBirthCard, buildHostedDocument} from '../.test-build/reference.mjs';

const f = await fixture();
const bible = JSON.parse(await readFile(new URL('../../lib/card-bible.json', import.meta.url), 'utf8'));
// Every day of leap year 2000, so February 29 is included: 366 [month, day] pairs.
const DAYS = [];
for (const date = new Date(Date.UTC(2000, 0, 1)); date.getUTCFullYear() === 2000; date.setUTCDate(date.getUTCDate() + 1)) DAYS.push([date.getUTCMonth() + 1, date.getUTCDate()]);
const iso = (month, day, year = 1996) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const SECTIONS = ['Your birth card', 'The Meaning of Your Birth Card', 'Your strengths', 'Your shadow', 'Strengths &amp; Shadow', '<h2>Love</h2>', '<h2>Work</h2>', 'Love &amp; Work', 'Your ruling card', 'Your Ruling Card', 'Going further', 'The Timing Map · $39', 'The Card Blueprint Reading · $299', 'The fine print'];
const blueprint = (birthdate, extra = {}) => ({...fields('birth-card-blueprint'), people: [{name: 'Sample Reader', birthdate, relation: 'Buyer'}], ...extra});

test('all 366 birthdays match the public calculator for birth and ruling cards', () => {
  assert.equal(DAYS.length, 366);
  const seen = new Set();
  for (const [month, day] of DAYS) {
    const engine = buildBirthCardBlueprint({month, day});
    const reference = calculateBirthCard(month, day);
    assert.ok(reference, `${month}/${day} calculator result`);
    assert.equal(engine.solarValue, 55 - (2 * month + day), `${month}/${day} solar value`);
    assert.equal(engine.birthCard.code, reference.birthCard, `${month}/${day} birth card`);
    assert.deepEqual(engine.rulingCards.map(card => card.code), reference.rulingCards, `${month}/${day} ruling cards`);
    assert.ok(engine.rulingCards.length >= 1 && engine.rulingCards.length <= 3);
    seen.add(engine.birthCard.code);
  }
  assert.equal(seen.size, 53, '52 birth cards plus the Joker');
});

test('December 31 is the Joker, and its only ruling card is the Joker itself', () => {
  const engine = buildBirthCardBlueprint({month: 12, day: 31});
  assert.equal(engine.solarValue, 0); assert.equal(engine.joker, true); assert.equal(engine.birthCard.code, 'Joker');
  assert.deepEqual(engine.rulingCards.map(card => [card.code, card.sameAsBirthCard]), [['Joker', true]]);
  assert.equal(engine.love.composed, true); assert.equal(engine.work.composed, true);
  const {html} = buildHostedDocument(blueprint('1988-12-31'));
  assert.match(html, /The Joker has no separate ruling card\./);
  assert.match(html, /class="tile face f-joker lg"/);
  assert.equal(buildBirthCardBlueprint({month: 12, day: 30}).birthCard.code, 'A♥');
});

test('year is optional, February 29 needs a leap year, and invalid dates are rejected', () => {
  const withYear = buildBirthCardBlueprint({month: 3, day: 14, year: 1990}), without = buildBirthCardBlueprint({month: 3, day: 14});
  assert.equal(withYear.birthCard.code, '9♦'); assert.deepEqual(withYear.rulingCards.map(card => card.code), ['2♠']);
  assert.deepEqual({...withYear, birthday: null}, {...without, birthday: null});
  assert.equal(without.birthday.label, 'March 14'); assert.equal(withYear.birthday.label, 'March 14, 1990');
  assert.deepEqual(parseBirthday('--02-29'), {month: 2, day: 29, year: null});
  assert.deepEqual(parseBirthday('2000-02-29'), {month: 2, day: 29, year: 2000});
  for (const bad of ['2001-02-29', '1990-02-30', '1990-13-01', '1990-00-10', '--04-31', '1990-3-14', '', null]) assert.throws(() => parseBirthday(bad), /valid|complete/, String(bad));
  assert.throws(() => buildBirthCardBlueprint({month: 2, day: 29, year: 2001}), /valid calendar date/);
});

test('every one of the 366 reports generates with every section, deterministically', () => {
  const famous = Object.values(bible).flatMap(entry => (entry.famous || []).map(person => person.name));
  for (const [month, day] of DAYS) {
    const input = blueprint(iso(month, day));
    const first = buildHostedDocument(input), second = buildHostedDocument(structuredClone(input));
    assert.equal(first.html, second.html, `${month}/${day} byte-identical HTML`);
    assert.deepEqual(first.engine, second.engine);
    for (const marker of SECTIONS) assert.ok(first.html.includes(marker), `${month}/${day} missing ${marker}`);
    assert.ok(first.html.includes(first.engine.birthCard.name.replace(/&/g, '&amp;')));
    for (const ruler of first.engine.rulingCards) assert.ok(first.html.includes(ruler.name));
    assert.equal((first.html.match(/<h2>Your ruling card(s · \d of \d)?<\/h2>/g) || []).length, first.engine.rulingCards.length);
    // Only the body: the stylesheet embeds base64 card faces.
    assert.doesNotMatch(first.html.split('</style>')[1], /undefined|\bnull\b|NaN|\[object/);
    const text = first.html + JSON.stringify(first.engine);
    for (const name of famous) assert.ok(!text.includes(name), `${month}/${day} contains a real person's name`);
  }
});

test('hosted API lists the offer and round-trips a one-person v3 draft', async () => {
  const {offers} = await (await f.request('/api/config')).json();
  assert.equal(offers['birth-card-blueprint'].name, 'Birth Card Blueprint');
  assert.equal(offers['birth-card-blueprint'].people, 1); assert.equal(offers['birth-card-blueprint'].sections.length, 4);
  const response = await f.request('/api/report', blueprint('1990-03-14', {sections: ['Meaning note', '', '', 'Ruling note']}));
  assert.equal(response.status, 200);
  const output = await response.json();
  assert.equal(output.draft.version, 3); assert.equal(output.engine.schema, 'my-card-blueprint-engine/birth-card-blueprint/v1');
  assert.match(output.html, /Meaning note/); assert.match(output.html, /Ruling note/);
  const imported = await f.request('/api/draft', output.draft); assert.equal(imported.status, 200);
  assert.deepEqual((await imported.json()).draft, output.draft);
  const two = await f.request('/api/report', {...blueprint('1990-03-14'), people: [{name: 'Sample Reader', birthdate: '1990-03-14', relation: 'Buyer'}, {name: 'Sample Friend', birthdate: '1990-03-15', relation: 'Friend'}]});
  assert.equal(two.status, 400); assert.match(await two.text(), /exactly one person/);
  const legacy = await f.request('/api/draft', {...output.draft, version: 2});
  assert.equal(legacy.status, 400); assert.match(await legacy.text(), /version 3/);
  for (const bad of [blueprint('1990-02-30'), blueprint('1990-03-14', {people: [{name: ' ', birthdate: '1990-03-14', relation: 'Buyer'}]})]) assert.equal((await f.request('/api/report', bad)).status, 400);
});
