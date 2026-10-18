import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await mkdir('ui',{recursive:true});
await build({entryPoints:['src/renderer.mjs'],bundle:true,platform:'browser',outfile:'ui/app.js'});
await build({entryPoints:['src/report-renderer.mjs'],bundle:true,platform:'browser',outfile:'ui/report-app.js',loader:{'.ttf':'dataurl','.png':'dataurl'}});
await copyFile('../lib/card-meanings.json','ui/meanings.json');
