// Test-only local Access stand-in. Never included in the production build.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fixture} from './fixtures.mjs';
import {root} from '../build.mjs';
import {APP_ORIGIN} from '../src/auth.mjs';

const require = createRequire(import.meta.url);
const {Miniflare, Log, LogLevel} = require(require.resolve('miniflare', {paths: [require.resolve('wrangler')]}));

export async function runtime() {
  const f = await fixture();
  const config = JSON.parse(await readFile(`${root}/wrangler.json`, 'utf8'));
  const {ASSETS, ...bindings} = f.env;
  const mf = new Miniflare({
    modules: true, scriptPath: `${root}/dist/worker.mjs`, compatibilityDate: config.compatibility_date,
    bindings, cf: false, log: new Log(LogLevel.ERROR),
    assets: {directory: `${root}/dist/assets`, binding: 'ASSETS',
      routerConfig: {invoke_user_worker_ahead_of_assets: config.assets.run_worker_first, has_user_worker: true},
      assetConfig: {html_handling: config.assets.html_handling, not_found_handling: config.assets.not_found_handling}},
    outboundService: async request => {
      if (request.url !== `https://${f.env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`) throw Error('Unexpected network request in local test');
      return Response.json({keys: [f.jwk]});
    },
  });
  await mf.ready;
  return {mf, f, close: () => mf.dispose()};
}

export async function localServer() {
  const run = await runtime();
  let session = 'valid', delay = null, origin;
  const server = createServer(async (incoming, outgoing) => {
    try {
      if (incoming.url === '/cdn-cgi/access/logout') {
        session = 'missing'; outgoing.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': 'no-store'});
        outgoing.end('<!doctype html><title>Signed out</title><p>Signed out of the local fixture.</p>'); return;
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      headers.delete('host'); headers.delete('cf-access-jwt-assertion');
      if (headers.get('origin') === origin) headers.set('origin', APP_ORIGIN);
      if (session !== 'missing') headers.set('Cf-Access-Jwt-Assertion', await run.f.token(session === 'expired' ? {exp: Math.floor(Date.now() / 1000) - 1} : {}));
      const chunks = []; for await (const chunk of incoming) chunks.push(chunk);
      const init = {method: incoming.method, headers, redirect: 'manual'};
      if (!['GET', 'HEAD'].includes(incoming.method)) init.body = Buffer.concat(chunks);
      const response = await run.mf.dispatchFetch(`${APP_ORIGIN}${incoming.url}`, init);
      const body = Buffer.from(await response.arrayBuffer());
      if (delay && incoming.url === delay.path) { const pending = delay; delay = null; pending.started(); await pending.wait; }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(body);
    } catch { outgoing.writeHead(500); outgoing.end('Local test fixture failed'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    ...run, url: origin, setSession(value) { session = value; },
    delayNext(path) {
      let started, release;
      const seen = new Promise(resolve => started = resolve), wait = new Promise(resolve => release = resolve);
      delay = {path, started, wait}; return {seen, release};
    },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await run.close(); },
  };
}
