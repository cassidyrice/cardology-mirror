import packager from '@electron/packager';
import {readFile,readdir,stat} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
// The bundled ZIP reader can stall on Node 26. Use the installed Node 24 runtime
// when available; no runtime installation or download is performed here.
if(Number(process.versions.node.split('.')[0])>=26){
  const compatible=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node');
  try{
    await stat(compatible);
    const version=spawnSync(compatible,['--version'],{encoding:'utf8'}).stdout;
    if(/^v24\./.test(version)){
      const result=spawnSync(compatible,[fileURLToPath(import.meta.url)],{stdio:'inherit'});
      process.exit(result.status??1);
    }
  }catch{}
}
const electron=JSON.parse(await readFile('node_modules/electron/package.json','utf8'));
const cache=join(homedir(),'Library/Caches/electron');
let electronZipDir;
try{
  for(const entry of await readdir(cache)){
    const directory=join(cache,entry);
    try{if((await stat(join(directory,`electron-v${electron.version}-darwin-arm64.zip`))).isFile()){electronZipDir=directory;break;}}catch{}
  }
}catch{}
const paths=await packager({dir:'.',name:'My Card Blueprint Reports',platform:'darwin',arch:'arm64',out:'dist',overwrite:true,asar:true,
  appBundleId:'com.mycardblueprint.reports',appCategoryType:'public.app-category.productivity',
  electronVersion:electron.version,...(electronZipDir?{electronZipDir}:{}),
  ignore:[/^\/dist($|\/)/,/^\/prepare-card-faces/,/^\/design($|\/)/,/^\/src($|\/)/,/^\/node_modules($|\/)/,/^\/reports($|\/)/,/^\/qa-/,/^\/test-report/,/^\/package\.mjs$/]
});
for(const path of paths)console.log(`Packaged: ${path}`);
