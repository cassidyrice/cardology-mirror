import {build} from 'esbuild';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {root, buildApp, bundleOptions} from '../build.mjs';
import {prepareReference} from './reference.mjs';

await buildApp();
await prepareReference();
await build({...bundleOptions, absWorkingDir: root, entryPoints: ['../desktop/src/report-model.test.mjs'], platform: 'node', format: 'cjs', outfile: '.test-build/desktop.test.cjs'});
const result = spawnSync(process.execPath, ['--test', 'test/worker.test.mjs', 'test/timing.test.mjs', 'test/session.test.mjs', 'test/runtime.test.mjs', '.test-build/desktop.test.cjs', '../desktop/src/engine.test.mjs'], {cwd: root, encoding: 'utf8', env: {...process.env, TZ: 'UTC'}});
await mkdir(`${root}/test-results`, {recursive: true});
await writeFile(`${root}/test-results/unit.txt`, result.stdout + result.stderr);
process.stdout.write(result.stdout); process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
