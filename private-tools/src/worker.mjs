import {verifyAccess, APP_ORIGIN, HttpError} from './auth.mjs';
export {verifyAccess};
import {buildDocument, readDraft, fileStem, OFFERS} from './reports.mjs';
import {calculate} from '../../desktop/src/engine.mjs';
import meanings from '../../lib/card-meanings.json';

const ASSET_PATHS = new Set(['/', '/index.html', '/report.html', '/app.js', '/report-app.js', '/style.css', '/report.css', '/private.css']);
const MAX_BODY = 200000;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' about:; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const json = (value, status = 200) => Response.json(value, {status});

function protect(response, expires) {
  const headers = new Headers(response.headers);
  for (const name of ['etag', 'last-modified', 'access-control-allow-origin', 'access-control-allow-credentials']) headers.delete(name);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.set('Content-Security-Policy', CSP);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (expires) headers.set('X-Session-Expires', String(expires));
  return new Response(response.body, {status: response.status, headers});
}

async function readBody(request) {
  if (request.headers.get('Origin') !== APP_ORIGIN ||
      !['same-origin', null].includes(request.headers.get('Sec-Fetch-Site'))) {
    throw new HttpError(403, 'Use this tool from its private workspace.');
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json' ||
      request.headers.has('Content-Encoding')) throw new HttpError(415, 'Send an uncompressed JSON document.');
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw new HttpError(413, 'This document is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'A JSON document is required.');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new HttpError(413, 'This document is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new HttpError(400, 'Choose a valid JSON document.'); }
}

// Dependency injection is for signed local fixtures only; no environment auth bypass exists.
export function createApp(authenticate = verifyAccess) {
  return {
    async fetch(request, env) {
      let session;
      try {
        const url = new URL(request.url);
        if (url.origin !== APP_ORIGIN) throw new HttpError(421, 'This hostname does not serve the private workspace.');
        session = await authenticate(request, env);
        if (url.search) throw new HttpError(400, 'Query parameters are not supported.');
        const path = url.pathname;
        let response;
        if (path === '/api/session' || path === '/api/config') {
          if (request.method !== 'GET') throw new HttpError(405, 'Use GET for this endpoint.');
          response = json(path === '/api/config' ? {offers: OFFERS} : {authenticated: true});
        } else if (['/api/report', '/api/spread', '/api/draft'].includes(path)) {
          if (request.method !== 'POST') throw new HttpError(405, 'Use POST for this endpoint.');
          const body = await readBody(request);
          if (session.expires <= Date.now() / 1000) throw new HttpError(401, 'Sign in again to continue.');
          try {
            if (path === '/api/spread') {
              if (typeof body.birthday !== 'string' || typeof body.targetDate !== 'string' ||
                  body.birthday.length !== 10 || body.targetDate.length !== 10) throw Error('Enter complete dates.');
              response = json({result: calculate(body.birthday, body.targetDate), meanings});
            } else if (path === '/api/draft') {
              const draft = readDraft(body);
              response = json({draft, filename: fileStem(draft)});
            } else {
              if (!Object.hasOwn(OFFERS, body.offer)) throw Error('Choose a supported offer.');
              response = json(buildDocument(body));
            }
          } catch (error) {
            throw new HttpError(400, error instanceof Error ? error.message : 'Check the report details.');
          }
        } else if (ASSET_PATHS.has(path)) {
          if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'Use GET for this resource.');
          // Drop incoming cookies, JWTs and conditional/range headers at the asset boundary.
          response = await env.ASSETS.fetch(new Request(`${APP_ORIGIN}${path === '/' ? '/index.html' : path}`, {method: request.method}));
        } else throw new HttpError(404, 'Resource not found.');
        if (session.expires <= Date.now() / 1000) throw new HttpError(401, 'Sign in again to continue.');
        return protect(response, session.expires);
      } catch (error) {
        return protect(json({error: error instanceof HttpError ? error.message : 'The request could not be completed.'}, error instanceof HttpError ? error.status : 500), session?.expires);
      }
    },
  };
}
export default createApp();
