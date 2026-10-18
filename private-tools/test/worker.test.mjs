import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {generateKeyPair} from 'jose';
import {fixture, fields, people} from './fixtures.mjs';
import {root} from '../build.mjs';
import {APP_ORIGIN} from '../src/auth.mjs';
import {calculate, buildDocument, buildEngineData, readDraft, renderOfferReport, OFFERS} from '../.test-build/reference.mjs';

const f = await fixture();
const paths = ['/', '/index.html', '/report.html', '/app.js', '/report-app.js', '/style.css', '/report.css', '/private.css', '/meanings.json', '/api/config', '/api/session', '/api/report', '/api/spread', '/api/draft', '/app.js.map', '/.env', '/dist/worker.mjs'];

test('every route denies missing authentication before assets or generation', async () => {
  const before = f.assetCalls();
  for (const path of paths) {
    const response = await f.request(path, path.startsWith('/api/') ? {} : undefined, {token: null});
    assert.equal(response.status, 401, path);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    assert.doesNotMatch(await response.text(), /Sample Client|<html|birth_card/);
  }
  assert.equal(f.assetCalls(), before);
});

test('missing and malformed identity configuration denies access', async () => {
  for (const config of [{}, {ACCESS_AUD: ''}, {ACCESS_TEAM_DOMAIN: 'example.com'}, {ALLOWED_EMAIL: '*'}, {ALLOWED_EMAIL: 'cass@example.test,other@example.test'}]) {
    const env = Object.keys(config).length ? {...f.env, ...config} : {};
    assert.equal((await f.request('/api/session', undefined, {env})).status, 503);
  }
});

test('only a valid, signed exact-user Access assertion is accepted', async () => {
  assert.equal((await f.request('/api/session')).status, 200);
  const otherKey = (await generateKeyPair('RS256')).privateKey;
  const bad = [
    'not-a-jwt', await f.token({email: 'other@example.test'}), await f.token({email: undefined}),
    await f.token({aud: ['b'.repeat(64)]}), await f.token({iss: 'https://other.cloudflareaccess.com'}),
    await f.token({exp: Math.floor(Date.now() / 1000) - 1}), await f.token({exp: undefined}),
    await f.token({iat: Math.floor(Date.now() / 1000) + 300}), await f.token({sub: ''}),
    await f.token({}, otherKey),
  ];
  for (const token of bad) assert.equal((await f.request('/api/session', undefined, {token})).status, 401);
  assert.equal((await f.request('/api/session', undefined, {token: null, headers: {'Cf-Access-Authenticated-User-Email': f.env.ALLOWED_EMAIL}})).status, 401);
});

test('alternate hostnames and previews cannot bypass the origin guard', async () => {
  for (const origin of ['https://cardblueprints-private-tools.example.workers.dev', 'https://version-cardblueprints-private-tools.example.workers.dev', 'https://preview.reports.cardblueprints.com', 'https://cardblueprints.com', 'http://reports.cardblueprints.com', 'https://reports.cardblueprints.com:444']) {
    assert.equal((await f.request('/api/report', fields(), {origin})).status, 421, origin);
  }
  const config = JSON.parse(await readFile(`${root}/wrangler.json`, 'utf8'));
  assert.equal(config.workers_dev, false); assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, []); assert.equal(config.assets.run_worker_first, true);
  assert.deepEqual(Object.values(config.vars), ['', '', '']);
});

test('assets are allowlisted, protected and never receive auth credentials', async () => {
  for (const file of await readdir(`${root}/dist/assets`)) {
    const response = await f.request(`/${file}`, undefined, {headers: {Cookie: 'private=fixture'}});
    assert.equal(response.status, 200, file);
    assert.match(response.headers.get('Cache-Control'), /private, no-store/);
    assert.equal(response.headers.get('CDN-Cache-Control'), 'no-store');
    assert.equal(response.headers.get('ETag'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  }
  for (const path of ['/meanings.json', '/app.js.map', '/dist/worker.mjs', '/.env', '/unknown', '/report.html/extra']) assert.equal((await f.request(path)).status, 404, path);
  assert.equal((await f.request('/api/session?birthdate=1991-02-17')).status, 400);
});

test('API method, same-origin, media type and byte limits are enforced', async () => {
  for (const path of ['/api/report', '/api/spread', '/api/draft']) assert.equal((await f.request(path)).status, 405);
  assert.equal((await f.request('/api/report', fields(), {headers: {Origin: 'https://evil.example'}})).status, 403);
  assert.equal((await f.request('/api/report', fields(), {headers: {'Sec-Fetch-Site': 'cross-site'}})).status, 403);
  assert.equal((await f.request('/api/report', fields(), {headers: {'Content-Type': 'text/plain'}})).status, 415);
  assert.equal((await f.request('/api/report', fields(), {headers: {'Content-Encoding': 'gzip'}})).status, 415);
  assert.equal((await f.request('/api/report', 'x'.repeat(200001), {raw: true, headers: {'Content-Length': '1'}})).status, 413);
  for (const body of ['{', 'null', '[]', '42']) assert.equal((await f.request('/api/report', body, {raw: true})).status, 400);
  assert.equal((await f.request('/api/report', {...fields(), notes: 'x'.repeat(12001)})).status, 400);
  assert.equal((await f.request('/api/report', {...fields(), offer: '__proto__'})).status, 400);
});

test('report calculations preserve shared engine facts and existing templates', async () => {
  for (const offer of ['timing-map', 'chemistry', 'family', 'professional']) {
    const input = fields(offer); input.notes = '<script>fixture()</script>'; input.sections[0] = '<img src=x onerror=fixture()>';
    const response = await f.request('/api/report', input);
    assert.equal(response.status, 200);
    const output = await response.json();
    if (offer === 'family') assert.deepEqual(output.engine, JSON.parse(JSON.stringify(buildEngineData(output.draft))));
    else assert.deepEqual(output, JSON.parse(JSON.stringify(buildDocument(input))));
    assert.ok(!output.html.includes('<script>'));
  }
  const legacy = {format: 'card-blueprints-report', version: 1, name: 'Sample', birthdate: '2000-02-29', readingDate: '2027-02-28', notes: '', includeNotes: true, html: '<script>ignored()</script>'};
  const migrated = await (await f.request('/api/draft', legacy)).json();
  assert.deepEqual(migrated.draft, readDraft(legacy)); assert.equal(migrated.draft.html, undefined);
});

test('private Family supports two or three people with the unchanged engine and template', async () => {
  const input = fields('family');
  for (const count of [2, 3]) {
    const response = await f.request('/api/report', {...input, people: people.slice(0, count)}); assert.equal(response.status, 200);
    const output = await response.json(), engine = buildEngineData(output.draft);
    assert.equal(output.draft.version, 3); assert.equal(output.engine.people.length, count);
    assert.deepEqual(output.engine, JSON.parse(JSON.stringify(engine)));
    assert.equal(output.html, renderOfferReport(output.draft, engine, OFFERS.family));
    const imported = await f.request('/api/draft', output.draft); assert.equal(imported.status, 200);
    assert.deepEqual((await imported.json()).draft, output.draft);
    for (const person of people.slice(0, count)) assert.ok(output.html.includes(person.name));
  }
  const old = {format: 'card-blueprints-report', version: 2, ...input, people};
  assert.equal((await f.request('/api/draft', old)).status, 400);
  for (const list of [[], people.slice(0, 1), people, [...people, people[0]]]) assert.equal((await f.request('/api/report', {...input, people: list})).status, 400);
});

test('a body arriving after token expiry is rejected before generation validation', async () => {
  const expiry = Math.floor(Date.now() / 1000) + 2;
  const token = await f.token({exp: expiry});
  const body = new ReadableStream({start(controller) {
    setTimeout(() => { controller.enqueue(new TextEncoder().encode('{"offer":"invalid"}')); controller.close(); }, expiry * 1000 - Date.now() + 30);
  }});
  const response = await f.app.fetch(new Request(`${APP_ORIGIN}/api/report`, {method: 'POST', body, duplex: 'half', headers: {'Cf-Access-Jwt-Assertion': token, Origin: APP_ORIGIN, 'Content-Type': 'application/json'}}), f.env);
  assert.equal(response.status, 401);
});

test('spread output exactly preserves leap days, fixed cards, age 126 and all boards', async () => {
  for (const birthday of ['1991-02-17', '2000-02-29', '2000-07-30', '2000-08-29', '1900-02-17']) {
    const input = {birthday, targetDate: '2026-10-15'};
    const response = await f.request('/api/spread', input); assert.equal(response.status, 200);
    const {result} = await response.json(); assert.deepEqual(result, calculate(birthday, input.targetDate));
    assert.equal(result.boards.length, 90);
    for (const board of result.boards) assert.equal(new Set([...board.grid.flat(), ...board.crown]).size, 52);
  }
  for (const birthday of ['2001-02-29', '2000-12-31', '2999-01-01', 'x']) assert.equal((await f.request('/api/spread', {birthday, targetDate: '2026-10-15'})).status, 400);
});

test('expired sessions cannot generate or fetch assets even after a prior valid request', async () => {
  assert.equal((await f.request('/api/spread', {birthday: '1991-02-17', targetDate: '2026-10-15'})).status, 200);
  const token = await f.token({exp: Math.floor(Date.now() / 1000) - 1});
  for (const path of ['/api/report', '/api/spread', '/api/draft', '/report.html']) assert.equal((await f.request(path, fields(), {token})).status, 401);
});

test('browser bundles contain only UI code and the deployment contains no test identity', async () => {
  const meta = JSON.parse(await readFile(`${root}/dist/build-meta.json`, 'utf8'));
  assert.ok(Object.keys(meta.worker.inputs).some(path => path.endsWith('desktop/src/engine.mjs')));
  assert.ok(Object.keys(meta.worker.inputs).some(path => path.endsWith('desktop/src/offer-model.mjs')));
  assert.ok(Object.keys(meta.client.inputs).every(path => path.startsWith('browser/')));
  const worker = await readFile(`${root}/dist/worker.mjs`, 'utf8');
  assert.ok(!worker.includes('cass@example.test')); assert.ok(!worker.includes('local-fixture'));
  assert.equal(APP_ORIGIN, 'https://reports.cardblueprints.com');
});
