// Downscales the site's CC0 card faces (public/share-cards/faces, 1000×1500 PNG) into ui/cards/
// at 360px tall, so the report can embed real card images without bloating the bundle.
// Uses macOS `sips`; rerun after the source faces change.
import {mkdir,copyFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
const source='../public/share-cards/faces',target='ui/cards';
await mkdir(target,{recursive:true});
for(const file of await readdir(source)){
  if(!file.endsWith('.png')||file==='joker.png')continue;
  const result=spawnSync('sips',['-Z','360','-s','format','png',join(source,file),'--out',join(target,file)],{stdio:'pipe'});
  if(result.status!==0)throw Error(`sips failed for ${file}: ${result.stderr}`);
}
await copyFile(join(source,'ATTRIBUTION.txt'),join(target,'ATTRIBUTION.txt'));
console.log('card faces ready in',target);
