import {generateKeyPair, exportJWK, SignJWT} from 'jose';
import {readFile} from 'node:fs/promises';
import {root} from '../build.mjs';
import {APP_ORIGIN} from '../src/auth.mjs';
import {createApp, verifyAccess} from '../dist/worker.mjs';

export const people = [
  {name: 'Sample Client', birthdate: '1991-02-17', relation: 'Buyer'},
  {name: 'Sample Partner', birthdate: '1990-06-12', relation: 'Partner'},
  {name: 'Sample Friend', birthdate: '1988-09-23', relation: 'Friend'},
  {name: 'Sample Relative', birthdate: '2000-02-29', relation: 'Sibling'},
];
export const fields = (offer = 'timing-map') => ({
  offer, readingDate: '2026-10-15', people: people.slice(0, {'timing-map': 1, chemistry: 2, family: 3, professional: 1}[offer]),
  sections: ['', '', '', ''], notes: '', includeNotes: true, reviewed: false,
});

export async function fixture() {
  const {privateKey, publicKey} = await generateKeyPair('RS256');
  const jwk = {...await exportJWK(publicKey), kid: 'local-fixture', alg: 'RS256', use: 'sig'};
  const key = await crypto.subtle.importKey('jwk', jwk, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, true, ['verify']);
  const keys = async () => key;
  const env = {ACCESS_TEAM_DOMAIN: 'local-fixture.cloudflareaccess.com', ACCESS_AUD: 'a'.repeat(64), ALLOWED_EMAIL: 'cass@example.test'};
  let assetCalls = 0;
  env.ASSETS = {async fetch(request) {
    assetCalls++;
    if (request.headers.has('Cookie') || request.headers.has('Cf-Access-Jwt-Assertion')) throw Error('Credentials reached assets');
    const path = new URL(request.url).pathname;
    const mime = path.endsWith('.html') ? 'text/html' : path.endsWith('.css') ? 'text/css' : 'text/javascript';
    try { return new Response(request.method === 'HEAD' ? null : await readFile(`${root}/dist/assets${path}`), {headers: {'Content-Type': `${mime}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600', ETag: 'fixture'}}); }
    catch { return new Response('Missing fixture asset', {status: 404}); }
  }};
  const app = createApp((request, environment) => verifyAccess(request, environment, keys));
  const token = (overrides = {}, key = privateKey) => new SignJWT({
    iss: `https://${env.ACCESS_TEAM_DOMAIN}`, aud: [env.ACCESS_AUD], sub: 'cass-fixture', type: 'app', email: env.ALLOWED_EMAIL,
    iat: Math.floor(Date.now() / 1000) - 1, exp: Math.floor(Date.now() / 1000) + 300, ...overrides,
  }).setProtectedHeader({alg: 'RS256', kid: 'local-fixture'}).sign(key);
  const request = async (path, body, options = {}) => {
    const headers = new Headers({'Origin': APP_ORIGIN, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', ...options.headers});
    if (options.token !== null) headers.set('Cf-Access-Jwt-Assertion', options.token ?? await token());
    return app.fetch(new Request(`${options.origin ?? APP_ORIGIN}${path}`, {
      method: options.method ?? (body === undefined ? 'GET' : 'POST'), headers,
      ...(body === undefined ? {} : {body: options.raw ? body : JSON.stringify(body)}),
    }), options.env ?? env);
  };
  return {app, env, token, request, keys, jwk, assetCalls: () => assetCalls};
}
