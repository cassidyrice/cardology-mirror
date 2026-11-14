import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'card-report-tests-'));
try{
  const output=join(directory,'report.test.cjs');
  await build({entryPoints:['src/report-model.test.mjs'],bundle:true,platform:'node',format:'cjs',outfile:output,loader:{'.ttf':'dataurl','.png':'dataurl'}});
  const result=spawnSync(process.execPath,['--test',output],{stdio:'inherit'});
  if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{await rm(directory,{recursive:true,force:true});}
