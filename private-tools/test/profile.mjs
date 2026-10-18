import {writeFile, mkdir, stat} from 'node:fs/promises';
import {cpus} from 'node:os';
import {fixture, fields, people} from './fixtures.mjs';
import {root} from '../build.mjs';

const f = await fixture(), token = await f.token();
const worst = {...fields('family'), people: people.slice(0, 3).map((p, i) => ({...p, name: String(i + 1).repeat(60), relation: 'R'.repeat(60)})), sections: Array(4).fill('W'.repeat(6000)), notes: 'N'.repeat(12000)};
const cases = [
  ['spread', '/api/spread', {birthday: '1900-02-17', targetDate: '2026-10-15'}],
  ...['professional', 'chemistry', 'timing-map', 'family'].map(offer => [offer, '/api/report', fields(offer)]),
  ['family-three-maximum-writing', '/api/report', worst],
];
const results = [];
for (const [name, path, body] of cases) {
  for (let i = 0; i < 2; i++) await (await f.request(path, body, {token})).arrayBuffer();
  const cpu = [], wall = []; let bytes = 0;
  for (let i = 0; i < 20; i++) {
    const start = performance.now(), usage = process.cpuUsage();
    const response = await f.request(path, body, {token});
    if (response.status !== 200) throw Error(`${name}: ${await response.text()}`);
    bytes = (await response.arrayBuffer()).byteLength;
    const elapsed = process.cpuUsage(usage); cpu.push((elapsed.user + elapsed.system) / 1000); wall.push(performance.now() - start);
  }
  cpu.sort((a, b) => a - b); wall.sort((a, b) => a - b);
  results.push({case: name, samples: 20, cpuMedianMs: +cpu[10].toFixed(2), cpuP95Ms: +cpu[18].toFixed(2), wallMedianMs: +wall[10].toFixed(2), responseBytes: bytes});
}
const report = {
  runtime: process.version, cpu: cpus()[0].model, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  method: 'Local Node process CPU (user+system): production Worker bundle, real RSA JWT verification with an in-memory test key, input handling, unchanged generation, JSON serialization and response consumption. Token signing and network JWKS retrieval excluded. Two warmups and 20 samples per case.',
  limitation: 'These are local Node measurements, not Cloudflare billed CPU or a Free-plan guarantee. Cloudflare Free permits 10 ms CPU per invocation; profile an approved protected deployment before selecting a plan. Local workerd functional tests do not enforce the production CPU quota.',
  workerBytes: (await stat(`${root}/dist/worker.mjs`)).size, results,
};
await mkdir(`${root}/test-results`, {recursive: true}); await writeFile(`${root}/test-results/profile.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
