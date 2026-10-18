import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runtime} from './runtime.mjs';
import {APP_ORIGIN} from '../src/auth.mjs';
import {fields} from './fixtures.mjs';

test('actual workerd asset routing and remote-JWKS verification preserve the auth boundary', async () => {
  const run = await runtime();
  try {
    for (const path of ['/', '/index.html', '/report.html', '/app.js', '/report-app.js', '/private.css']) {
      const denied = await run.mf.dispatchFetch(`${APP_ORIGIN}${path}`, {redirect: 'manual'});
      assert.equal(denied.status, 401, path); await denied.text();
      const response = await run.mf.dispatchFetch(`${APP_ORIGIN}${path}`, {headers: {'Cf-Access-Jwt-Assertion': await run.f.token()}, redirect: 'manual'});
      assert.equal(response.status, 200, path); assert.equal(response.headers.get('Location'), null);
      assert.match(response.headers.get('Cache-Control'), /no-store/); assert.ok((await response.text()).length > 10);
    }
    for (const count of [2, 3]) {
      const input = fields('family'); input.people = input.people.slice(0, count);
      const response = await run.mf.dispatchFetch(`${APP_ORIGIN}/api/report`, {method: 'POST', headers: {'Cf-Access-Jwt-Assertion': await run.f.token(), Origin: APP_ORIGIN, 'Content-Type': 'application/json'}, body: JSON.stringify(input)});
      assert.equal(response.status, 200); assert.equal((await response.json()).engine.people.length, count);
    }
    const expired = await run.mf.dispatchFetch(`${APP_ORIGIN}/api/session`, {headers: {'Cf-Access-Jwt-Assertion': await run.f.token({exp: 1})}});
    assert.equal(expired.status, 401); await expired.text();
    const alternate = await run.mf.dispatchFetch('https://preview.example.workers.dev/app.js', {headers: {'Cf-Access-Jwt-Assertion': await run.f.token()}});
    assert.equal(alternate.status, 421); await alternate.text();
  } finally { await run.close(); }
});
