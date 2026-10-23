import {build} from 'esbuild';
import {chromium} from 'playwright';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'offer-layout-'));
const output=resolve(process.argv[2]||'reports/layout-qa');await mkdir(output,{recursive:true,mode:0o700});
// Chromium leaves its PDF catalog and page-tree dictionaries uncompressed.
// Check the printed page count too: DOM sections alone can miss extra PDF sheets.
function pdfPageCount(pdf){
  const source=pdf.toString('latin1');
  const root=source.match(/\/Type\s*\/Catalog\b[\s\S]*?\/Pages\s+(\d+)\s+(\d+)\s+R/);
  assert.ok(root,'PDF catalog has a page tree');
  const tree=source.match(new RegExp(`(?:^|[\\r\\n])${root[1]} ${root[2]} obj\\s*([\\s\\S]*?)endobj`));
  const count=tree?.[1].match(/\/Count\s+(\d+)/);
  assert.ok(count,'PDF page tree has a page count');
  return Number(count[1]);
}
let browser;
try{
  const file=join(directory,'model.mjs');
  await build({entryPoints:['src/offer-model.mjs'],bundle:true,platform:'node',format:'esm',outfile:file,loader:{'.ttf':'dataurl','.png':'dataurl'}});
  const {buildDocument,OFFERS}=await import(pathToFileURL(file).href);
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage({viewport:{width:794,height:1123}});
  const offers=['timing-map','chemistry','family'];
  const longNames=['Alexandra Montgomery-Worthington','Christopher Sebastian Wainwright','Elizabeth Charlotte Van der Meer','Maximilian Alexander Fitzgerald'];
  const fixtures=[...offers.map(offer=>({fixture:offer,offer})),...['identical-family','long-writing'].map(fixture=>({fixture,offer:'family'})),...['long-names','max-inputs','unbroken-names'].flatMap(names=>offers.map(offer=>({fixture:`${offer}-${names}`,offer,names}))),{fixture:'family-max-inputs-identical',offer:'family',names:'max-inputs',identical:true}];
  const summary=[];
  for(const {fixture,offer,names,identical} of fixtures){
    const people=Array.from({length:OFFERS[offer].people},(_,i)=>({name:names==='long-names'?longNames[i]:names==='max-inputs'?`Alexandra ${'W'.repeat(49)}${i}`:names==='unbroken-names'?['Alexandra','Christopher','Elizabeth','Maximilian'][i].padEnd(60,'W'):`Sample ${i+1}`,birthdate:identical||fixture==='identical-family'?'1991-02-17':['1991-02-17','2000-02-29','1988-09-23','1966-03-28'][i],relation:names==='max-inputs'||names==='unbroken-names'?'W'.repeat(60):i?'Family member':'Buyer'}));
    const r=buildDocument({offer,readingDate:'2026-10-15',people,sections:fixture==='long-writing'?['W'.repeat(6000),'😀'.repeat(3000),'Many personal observations.\n'.repeat(50),'']:['','','',''],notes:fixture==='long-writing'?'W'.repeat(12000):'',includeNotes:true,reviewed:false});
    await page.setContent(r.html);await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({media:'print'});
    const sections=await page.locator('.page').evaluateAll(sections=>sections.map((section,index)=>{
      const footer=section.querySelector('footer').getBoundingClientRect(),rect=section.getBoundingClientRect();
      return {index,title:section.querySelector('h2').textContent,height:rect.height,overflow:section.scrollWidth>section.clientWidth,overlap:[...section.children].filter(child=>child.tagName!=='FOOTER').some(child=>child.getBoundingClientRect().bottom>footer.top+1)};
    }));
    const problems=sections.filter(section=>section.height>1123||section.overflow||section.overlap);
    const pdf=await page.pdf({path:join(output,`${fixture}.pdf`),printBackground:true,preferCSSPageSize:true,format:'A4'});
    const printedPages=pdfPageCount(pdf);
    summary.push({fixture,pages:sections.length,printedPages,problems});
    await writeFile(join(output,'summary.json'),JSON.stringify(summary,null,2));
    await writeFile(join(output,`${fixture}.json`),JSON.stringify(problems,null,2));
    if(problems.length)console.log(fixture,JSON.stringify(problems));
    console.log(`${fixture}: ${sections.length} HTML sections / ${printedPages} PDF pages checked`);
    if(fixture==='family-max-inputs'){
      await writeFile(join(output,`${fixture}.html`),r.html);
      for(const title of ['The year on one page','Meanwhile, between the others','The pattern, and the way out']){
        const section=page.locator('.page').filter({has:page.getByRole('heading',{name:title,exact:true})});
        await section.screenshot({path:join(output,`${fixture}-${title.toLowerCase().replaceAll(/[^a-z]+/g,'-')}.png`)});
      }
    }
    if(names||fixture==='timing-map'){
      await page.locator('.page').first().screenshot({path:join(output,`${fixture}-cover.png`)});
    }
  }
  assert.deepEqual(summary.filter(result=>result.problems.length||result.pages!==result.printedPages),[],'Every A4 section fits one PDF page without overflow or footer collisions');
}finally{if(browser)await browser.close();await rm(directory,{recursive:true,force:true});}
