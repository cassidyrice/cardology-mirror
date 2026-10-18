import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function session(fetch) {
  const elements = new Map();
  const window = new EventTarget();
  const context = vm.createContext({fetch, Event, Date, Number, Error, JSON, Promise, URL, Blob, console,
    BroadcastChannel: undefined, setTimeout: () => 1, clearTimeout() {}, confirm: () => true,
    location: {replace() {}}, window,
    document: {hidden: false, addEventListener() {}, body: {replaceChildren() {}}, createElement: () => ({}),
      getElementById(id) { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); }},
  });
  const source = (await readFile(new URL('../browser/session.mjs', import.meta.url), 'utf8')).replaceAll('export ', '');
  vm.runInContext(source + '\nglobalThis.callApi=api;', context);
  let expired = 0; window.addEventListener('private-session-expired', () => expired++);
  return {call: context.callApi, logout: () => elements.get('logout').onclick(), expired: () => expired};
}
const response = (expires, json = async () => ({result: 'fixture'})) => ({ok: true, status: 200, headers: new Headers({'Content-Type': 'application/json', ...(expires === undefined ? {} : {'X-Session-Expires': String(expires)})}), json});

test('client rejects expired or missing expiry on successful JSON', async () => {
  for (const exp of [undefined, 'bad', Math.floor(Date.now() / 1000) - 1]) {
    const s = await session(async () => response(exp));
    await assert.rejects(s.call('/api/report', {})); assert.equal(s.expired(), 1);
  }
});
test('signout while the body streams cannot return private results', async () => {
  let release, started;
  const body = new Promise(resolve => release = resolve), seen = new Promise(resolve => started = resolve);
  const s = await session(async () => response(Date.now() / 1000 + 300, () => { started(); return body; }));
  const pending = s.call('/api/report', {}); await seen; s.logout(); release({result: 'must not render'});
  await assert.rejects(pending);
});
test('signout prevents new session or generation requests while navigation is pending', async () => {
  let requests = 0;
  const s = await session(async () => { requests++; return response(Date.now() / 1000 + 300); });
  s.logout(); s.logout();
  await assert.rejects(s.call('/api/session'));
  await assert.rejects(s.call('/api/report', {}));
  assert.equal(requests, 0);
});
test('network failures and auth redirects never return offline generation', async () => {
  const s = await session(async () => { throw Error('network'); });
  await assert.rejects(s.call('/api/spread', {})); assert.equal(s.expired(), 1);
});
test('an obsolete response cannot expire a newly authenticated session', async () => {
  let release, started, call = 0;
  const body = new Promise(resolve => release = resolve), seen = new Promise(resolve => started = resolve);
  const s = await session(async () => {
    call++;
    if (call === 1) return response(Date.now() / 1000 + 300, () => { started(); return body; });
    if (call === 2) throw Error('expired connection');
    return response(Date.now() / 1000 + 300);
  });
  const old = s.call('/api/report', {}); await seen;
  await assert.rejects(s.call('/api/session')); await s.call('/api/session');
  release({result: 'obsolete'}); await assert.rejects(old);
  assert.equal(s.expired(), 1);
});
