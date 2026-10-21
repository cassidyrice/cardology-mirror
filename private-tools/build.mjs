import {build} from 'esbuild';
import {readFile, writeFile, mkdir, rm, copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

export const root = dirname(fileURLToPath(import.meta.url));
export const bundleOptions = {bundle: true, loader: {'.ttf': 'dataurl', '.png': 'dataurl'}, logLevel: 'warning'};

export async function buildApp() {
  const output = join(root, 'dist');
  await rm(output, {recursive: true, force: true});
  await mkdir(join(output, 'assets'), {recursive: true});
  const worker = await build({...bundleOptions, absWorkingDir: root, entryPoints: ['src/worker.mjs'], platform: 'browser', conditions: ['worker', 'browser'], format: 'esm', target: 'es2022', outfile: 'dist/worker.mjs', metafile: true});
  const client = await build({...bundleOptions, absWorkingDir: root, entryPoints: {'app': 'browser/spread.mjs', 'report-app': 'browser/report.mjs'}, platform: 'browser', format: 'iife', target: 'es2022', outdir: 'dist/assets', metafile: true});
  if (Object.keys(client.metafile.inputs).some(path => /(?:engine-core|desktop\/src|professional-reading|card-meanings|engine-data)/.test(path))) throw Error('Calculation/data modules must not enter the browser bundle.');
  for (const file of ['style.css', 'report.css']) await copyFile(join(root, '../desktop/ui', file), join(output, 'assets', file));
  await copyFile(join(root, 'browser/private.css'), join(output, 'assets/private.css'));
  for (const file of ['index.html', 'report.html']) {
    let html = await readFile(join(root, '../desktop/ui', file), 'utf8');
    html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
    html = html.replace('</head>', '<link rel="stylesheet" href="private.css"></head>');
    html = html.replace('● Engine ready · offline', 'Private workspace · Cass only');
    html = html.replace('Drafts stay on this Mac. No autosave.', 'Drafts stay in this tab until you download them. No autosave.');
    if (file === 'report.html') html = html.replace('<option value="professional">', '<option value="birth-card-blueprint">Birth Card Blueprint</option><option value="professional">');
    if (file === 'report.html') html = html.replace('<label for="report-date">', '<div id="family-size-field" hidden><label for="family-size">People, including the buyer</label><select id="family-size"><option value="2">2 people</option><option value="3" selected>3 people</option></select></div><label for="report-date">');
    html = html.replace('<main>', '<main><div class="session-bar"><p id="session-status" role="status" aria-live="polite">Checking private session…</p><a id="reauth" href="' + file + '" target="_blank" rel="noopener noreferrer" hidden>Sign in again in a new tab</a><button id="logout" type="button">Sign out</button></div>');
    await writeFile(join(output, 'assets', file), html);
  }
  await writeFile(join(output, 'build-meta.json'), JSON.stringify({worker: worker.metafile, client: client.metafile}, null, 2));
  console.log('Built private tools; authentication is required for every production route.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildApp();
