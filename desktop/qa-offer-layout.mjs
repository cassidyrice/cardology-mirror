import {build} from 'esbuild';
import {chromium} from 'playwright';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'offer-layout-'));
const output=resolve('reports/layout-qa');await mkdir(output,{recursive:true,mode:0o700});
let browser;
try{
  const file=join(directory,'model.mjs');
  await build({entryPoints:['src/offer-model.mjs'],bundle:true,platform:'node',format:'esm',outfile:file,loader:{'.ttf':'dataurl','.png':'dataurl'}});
  const {buildDocument,OFFERS}=await import(pathToFileURL(file).href);
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage({viewport:{width:900,height:1100}});
  const fixtures=['timing-map','chemistry','family','identical-family','long-writing'];
  for(const fixture of fixtures){
    const offer=['identical-family','long-writing'].includes(fixture)?'family':fixture;
    const people=Array.from({length:OFFERS[offer].people},(_,i)=>({name:`Sample ${i+1}`,birthdate:fixture==='identical-family'?'1991-02-17':['1991-02-17','2000-02-29','1988-09-23','1966-03-28'][i],relation:i?'Family member':'Buyer'}));
    const r=buildDocument({offer,readingDate:'2026-10-15',people,sections:fixture==='long-writing'?['W'.repeat(6000),'😀'.repeat(3000),'Many personal observations.\n'.repeat(50),'']:['','','',''],notes:fixture==='long-writing'?'W'.repeat(12000):'',includeNotes:true,reviewed:false});
    await page.setContent(r.html);await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({media:'print'});
    const problems=await page.locator('.page').evaluateAll(sections=>sections.map((section,index)=>{
      const footer=section.querySelector('footer').getBoundingClientRect(),rect=section.getBoundingClientRect();
      return {index,title:section.querySelector('h2').textContent,height:rect.height,overflow:section.scrollWidth>section.clientWidth,overlap:[...section.children].filter(child=>child.tagName!=='FOOTER').some(child=>child.getBoundingClientRect().bottom>footer.top+1)};
    }).filter(section=>section.height>1123||section.overflow||section.overlap));
    await writeFile(join(output,`${fixture}.json`),JSON.stringify(problems,null,2));
    if(problems.length)console.log(fixture,JSON.stringify(problems));
    assert.deepEqual(problems,[],`${fixture} has print layout problems`);
    console.log(`${fixture}: ${await page.locator('.page').count()} pages checked`);
    if(fixture==='timing-map'){
      await page.emulateMedia({media:'screen'});
      await page.screenshot({path:join(output,'timing-map-cover.png')});
    }
  }
}finally{if(browser)await browser.close();await rm(directory,{recursive:true,force:true});}
