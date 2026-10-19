import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {root} from '../build.mjs';
import {prepareReference} from './reference.mjs';

await prepareReference();

const source = `import {calculate,buildHostedDocument} from './.test-build/reference.mjs';
import {createHash} from 'node:crypto';
const birthdays=['1991-02-17','2000-02-29','2000-07-30','1900-02-17'];
const dates=['2026-03-08','2026-11-01','2027-02-28'];
const values=[];
for(const birthday of birthdays)for(const readingDate of dates){
 values.push(calculate(birthday,readingDate));
 values.push(buildHostedDocument({offer:'professional',readingDate,people:[{name:'Sample',birthdate:birthday,relation:'Buyer'}],sections:['','','',''],notes:'',includeNotes:true,reviewed:false}));
}
console.log(createHash('sha256').update(JSON.stringify(values)).digest('hex'));`;
let expected;
for (const timezone of ['UTC', 'America/Los_Angeles', 'Europe/London', 'Pacific/Auckland']) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {cwd: root, encoding: 'utf8', env: {...process.env, TZ: timezone}});
  assert.equal(result.status, 0, result.stderr);
  const digest = result.stdout.trim(); expected ??= digest; assert.equal(digest, expected, timezone);
  console.log(`${timezone}: identical 12 spread and 12 professional-report cases (${digest.slice(0, 12)})`);
}
