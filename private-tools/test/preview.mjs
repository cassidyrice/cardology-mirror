import {localServer} from './runtime.mjs';

const server = await localServer();
console.log(`Local synthetic-session preview: ${server.url}/report.html`);
console.log('Loopback only. Use fictional data. This is not a Cloudflare Access login test.');
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await server.close();
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
