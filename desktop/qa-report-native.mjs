import {_electron as electron} from 'playwright';
import {mkdir,readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const output=resolve('reports/native-qa');
await mkdir(output,{recursive:true,mode:0o700});
const app=await electron.launch({executablePath:resolve(process.argv[2]||'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),args:process.argv[2]?[]:['.']});
try{
  const page=await app.firstWindow();
  await page.frameLocator('#report-frame').locator('h1').waitFor();
  assert.ok(await page.evaluate(()=>Boolean(window.desktop?.saveReport)));
  await app.evaluate(({dialog},directory)=>{
    dialog.showSaveDialog=async(_win,options)=>({canceled:false,filePath:`${directory}/${options.defaultPath}`});
  },output);
  await page.locator('#save-pdf').click();
  await page.getByRole('status').filter({hasText:'PDF saved.'}).waitFor({timeout:30000});
  await page.locator('#export-html').click();
  await page.getByRole('status').filter({hasText:'HTML exported.'}).waitFor();
  await page.locator('#save-draft').click();
  await page.getByRole('status').filter({hasText:'Draft saved.'}).waitFor();
  const date=await page.locator('#report-date').inputValue();
  const stem=resolve(output,`my-card-blueprint-timing-map-sample-client-${date}`);
  assert.ok((await readFile(`${stem}.pdf`)).subarray(0,5).toString()==='%PDF-');
  assert.ok((await readFile(`${stem}.html`,'utf8')).includes('Sample Client'));
  assert.equal(JSON.parse(await readFile(`${stem}.draft.json`,'utf8')).format,'card-blueprints-report');
  assert.equal((await stat(`${stem}.pdf`)).mode&0o777,0o600);
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},`${stem}.draft.json`);
  await page.locator('#open-draft').click();
  await page.getByRole('status').filter({hasText:'Draft opened.'}).waitFor();
  console.log('Native Electron: report load, PDF, HTML, draft save/open, and private file permissions passed.');
}finally{await app.close();}
