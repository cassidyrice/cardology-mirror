/** Rendered regression: calculator birthday survives app sample → checkout on mobile/desktop. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.APP_QA_ORIGIN||'http://127.0.0.1:3577';
const browser=await chromium.launch({headless:true});
try {
 for(const width of [320,390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}}); const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/birth-card-calculator',{waitUntil:'networkidle'});
  await page.getByLabel('Enter your birthday').fill('1988-06-15');
  await page.getByRole('button',{name:'Reveal my birth card',exact:true}).click();
  const cta=page.getByRole('link',{name:'Explore the app sample →'}); await cta.waitFor(); await cta.click();
  await page.waitForURL('**/products/card-blueprint-app*');
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://cardblueprints.com/products/card-blueprint-app');
  assert.ok(!(await page.locator('meta[name="robots"]').getAttribute('content').catch(()=>''))?.includes('noindex'));
  assert.ok((await page.locator('body').innerText()).includes('$69 once'));
  assert.ok((await page.locator('body').innerText()).includes('sample'));
  await page.getByRole('button',{name:'Get my app — $69',exact:true}).first().click();
  await page.waitForURL('**/checkout/card-blueprint-app*');
  await page.getByLabel('Your birth date').waitFor();
  assert.equal(await page.getByLabel('Your birth date').inputValue(),'1988-06-15');
  assert.ok(!page.url().includes('1988'));
  assert.ok(await page.getByRole('button',{name:/Continue to Secure Checkout — \$69/}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), 'no horizontal checkout overflow');
  assert.deepEqual(errors,[]);
  if(width===390)await page.screenshot({path:process.env.APP_QA_SCREENSHOT||'/tmp/cardblueprints-app-checkout-mobile.png',fullPage:true});
  await page.close(); console.log('PASS calculator → app → birthday review at '+width+'px');
 }
 const page=await browser.newPage();
 for(const route of ['/cardology-compatibility','/birth-card-compatibility-calculator']){
  await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(await page.getByRole('link',{name:'Explore the app sample →'}).count(),1);
 }
 console.log('PASS compatibility acquisition links');
}finally{await browser.close();}
