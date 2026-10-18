import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {root} from '../build.mjs';
import {localServer} from './runtime.mjs';
import {fields, people} from './fixtures.mjs';

const evidence = '/tmp/cardblueprints-individual-timing-qa';
await mkdir(evidence, {recursive: true});
const server = await localServer();
const browser = await chromium.launch({channel: 'chrome', headless: true});
const context = await browser.newContext({viewport: {width: 1440, height: 1000}, timezoneId: 'America/Los_Angeles'});
const page = await context.newPage();
const errors = [], checks = [], pdfChecks = [], expectedRejections = [];
let rejectingLegacy = false;
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() !== 'error') return;
  if (rejectingLegacy && /status of 400/.test(message.text()) && message.location().url === `${server.url}/api/draft`) expectedRejections.push('Legacy Timing draft: HTTP 400');
  else if (!/status of (401|403|404)/.test(message.text())) errors.push(message.text());
});
page.on('dialog', dialog => dialog.accept());
await context.route('**/*', route => route.request().url().startsWith(server.url) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
const downloaded = async id => {
  const pending = page.waitForEvent('download'); await page.locator(id).click();
  const file = await pending; return readFile(await file.path(), 'utf8');
};
const openFixture = async draft => {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/report' && r.status() === 200);
  await page.locator('#draft-file').setInputFiles({name: 'fixture.draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(draft))});
  await response;
  await page.waitForFunction(() => document.getElementById('report-status').textContent.startsWith('Draft opened.') && !document.getElementById('export-html').disabled);
};
const printReport = async (html, label, shots = []) => {
  const printPage = await context.newPage();
  try {
    await printPage.setViewportSize({width: 794, height: 1123});
    await printPage.setContent(html); await printPage.emulateMedia({media: 'print'});
    await printPage.evaluate(() => document.fonts.ready);
    const titles = await printPage.locator('.page > h2:first-of-type').allTextContents();
    const file = await printPage.pdf({path: `${evidence}/${label}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true});
    const physical = (file.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    assert.equal(physical, titles.length, `${label}: physical and numbered page counts`);
    const issues = await printPage.locator('.page').evaluateAll(pages => pages.flatMap((p, i) => {
      const issues = [], box = p.getBoundingClientRect(), footer = p.querySelector('footer').getBoundingClientRect();
      if (box.height > 1123) issues.push(`${p.id}: taller than A4`);
      if (!p.querySelector('header').textContent.includes(`+ ${String(i + 1).padStart(2, '0')} +`)) issues.push(`${p.id}: page number`);
      if (footer.bottom > box.bottom + 1) issues.push(`${p.id}: footer outside page`);
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || node.parentElement.closest('footer')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const text of range.getClientRects()) {
          if (!text.width || !text.height) continue;
          if (text.bottom > footer.top + 1) issues.push(`${p.id}: footer collision: ${node.textContent.slice(0, 60)}`);
          if (text.left < box.left - 1 || text.right > box.right + 1) issues.push(`${p.id}: horizontal clipping: ${node.textContent.slice(0, 60)}`);
          const segment = node.parentElement.closest('.band > span');
          if (segment) { const clip = segment.getBoundingClientRect(); if (text.left < clip.left - 1 || text.right > clip.right + 1) issues.push(`${p.id}: clipped timeline label: ${node.textContent}`); }
        }
      }
      return issues;
    }));
    assert.deepEqual(issues, [], `${label}: A4 clipping and footer checks`);
    for (const [name, title] of shots) {
      const index = title === null ? 0 : titles.indexOf(title); assert.ok(index >= 0, title);
      await printPage.locator('.page').nth(index).screenshot({path: `${evidence}/${label}-${name}.png`});
    }
    const result = {label, logicalPages: titles.length, physicalPages: physical, bytes: file.length, layoutIssues: issues};
    pdfChecks.push(result); console.log(JSON.stringify(result));
  } finally { await printPage.close(); }
};
try {
  await page.goto(`${server.url}/report.html`);
  assert.match(await page.title(), /Report builder/);
  await page.waitForFunction(() => !document.getElementById('load-sample').disabled);
  assert.ok((await page.locator('body').innerText()).includes('Report builder'));
  assert.equal(await page.locator('iframe').getAttribute('sandbox'), 'allow-same-origin allow-modals');
  await page.screenshot({path: `${evidence}/report-empty-desktop.png`});
  await page.locator('#load-sample').click();
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  assert.equal(await page.locator('#additional-people input').count(), 0);
  assert.equal(await page.locator('#family-size-field').isVisible(), false);
  await page.locator('#writing-tab').click();
  await page.locator('#section-copy').fill('<script>fixture()</script> A private plain-text reading.');
  assert.equal(await page.locator('#export-html').isDisabled(), true);
  await page.locator('#update-preview').click();
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  const reportFrame = page.frameLocator('#report-frame');
  assert.equal(await reportFrame.locator('script').count(), 0);
  assert.ok((await reportFrame.locator('body').innerText()).includes('<script>fixture()</script>'));
  await page.screenshot({path: `${evidence}/report-preview-desktop.png`});
  const html = await downloaded('#export-html'); assert.ok(html.includes('&lt;script&gt;'));
  const engine = JSON.parse(await downloaded('#export-engine')); assert.equal(engine.offer, 'timing-map'); assert.equal(engine.people.length, 1);
  const draft = JSON.parse(await downloaded('#save-draft')); assert.equal(draft.version, 3); assert.equal(draft.people.length, 1); assert.equal(draft.sections[0], '<script>fixture()</script> A private plain-text reading.');
  await openFixture(draft);
  await page.locator('#report-page').selectOption({index: 2});
  await page.locator('#report-frame').evaluate(frame => { frame.contentWindow.print = () => frame.dataset.printed = 'yes'; });
  await page.locator('#save-pdf').click();
  assert.equal(await page.locator('#report-frame').getAttribute('data-printed'), 'yes');
  await printReport(html, 'timing-sample', [['cover', null], ['timeline', 'The year on one page'], ['current', 'Right now'], ['appendix', 'The fine print']]);
  checks.push('Report preview, escaped writing, page navigation, draft round-trip, JSON/HTML downloads, print action and A4 PDF');

  const timingCases = [
    ['normal-eight', '1991-02-17', '2026-10-15'],
    ['birthday', '1991-02-17', '2026-02-17'],
    ['birthday-eve', '1991-02-17', '2026-02-16'],
    ['birthday-after', '1991-02-17', '2026-02-18'],
    ['leap-anniversary', '2000-02-29', '2027-02-28'],
    ['leap-day', '2000-02-29', '2028-02-29'],
    ['long-name', '1991-02-17', '2026-10-15'],
    ['maximum-writing', '2000-02-29', '2028-03-01'],
  ];
  for (const [label, birthdate, readingDate] of timingCases) {
    const long = ['long-name', 'maximum-writing'].includes(label), maximum = label === 'maximum-writing';
    const timing = {format: 'card-blueprints-report', version: 3, ...fields(), readingDate, people: [{...people[0], birthdate, ...(long ? {name: 'W'.repeat(60), relation: 'R'.repeat(60)} : {})}], sections: maximum ? Array(4).fill(('<script>fixture()</script> ' + 'W'.repeat(70) + '\n').repeat(100).slice(0, 6000)) : ['', '', '', ''], notes: maximum ? 'N'.repeat(12000) : ''};
    await openFixture(timing);
    const timingHtml = await downloaded('#export-html');
    const exported = JSON.parse(await downloaded('#export-engine'));
    assert.equal(exported.people.length, 1);
    assert.equal(await reportFrame.locator('.season').count(), exported.people[0].windows.length);
    assert.equal(await reportFrame.locator('.rows, .crossing, .ledger').count(), 0);
    await printReport(timingHtml, `timing-${label}`, long ? [['cover', null], ...(maximum ? [['writing-continuation', 'Your Baseline & Yearly Themes / continued'], ['notes-continuation', 'Reader notes / continued']] : [])] : []);
  }
  checks.push('Individual Timing: seven/eight dated windows, birthday/leap boundaries, long unbroken names, escaped maximum writing, A4 page parity, text clipping and footer collisions');

  for (const count of [2, 3]) for (const longNames of [false, true]) {
    const family = {format: 'card-blueprints-report', version: 3, ...fields('family'), people: people.slice(0, count).map((p, i) => longNames ? {...p, name: String(i + 1).repeat(60), relation: 'Relationship'.repeat(5)} : p)};
    await openFixture(family);
    assert.equal(await page.locator('#family-size').inputValue(), String(count));
    assert.equal(await page.locator(`#person-${count - 1}-name`).inputValue(), family.people[count - 1].name);
    assert.equal(await page.locator(`#person-${count}-name`).count(), 0);
    const familyHtml = await downloaded('#export-html');
    const label = count === 2 ? 'two' : 'three';
    await printReport(familyHtml, `family-${label}${longNames ? '-long' : ''}`, longNames ? [['cover', null]] : []);
  }
  await page.locator('#family-size').selectOption('2');
  assert.equal(await page.locator('#person-2-name').count(), 0);
  assert.equal(await page.locator('#export-html').isDisabled(), true);
  await page.locator('#update-preview').click();
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  assert.equal(JSON.parse(await downloaded('#export-engine')).people.length, 2);
  assert.equal(JSON.parse(await downloaded('#save-draft')).people.length, 2);
  await page.locator('#family-size').selectOption('3');
  assert.equal(await page.locator('#person-2-name').inputValue(), '3'.repeat(60));
  await page.locator('#update-preview').click();
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  checks.push('Two- and three-person Family: draft round-trip, size switching without losing inputs, normal/60-character names and numbered A4/PDF page parity');

  await page.locator('#offer').selectOption('timing-map');
  assert.equal(await page.locator('#additional-people input').count(), 0);
  const timingRequest = page.waitForRequest(r => new URL(r.url()).pathname === '/api/report');
  await page.locator('#update-preview').click();
  assert.equal((await timingRequest).postDataJSON().people.length, 1);
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  assert.equal(JSON.parse(await downloaded('#export-engine')).people.length, 1);
  const soloDraft = JSON.parse(await downloaded('#save-draft')); assert.equal(soloDraft.people.length, 1); assert.equal(soloDraft.version, 3);
  const soloHtml = await downloaded('#export-html');
  const legacy = {format: 'card-blueprints-report', version: 2, ...fields(), people: people.slice(0, 3), sections: ['Old baseline', 'Old seasons', 'Do not reinterpret this shared writing', 'Old crossings']};
  rejectingLegacy = true;
  const rejection = page.waitForResponse(r => new URL(r.url()).pathname === '/api/draft' && r.status() === 400);
  await page.locator('#draft-file').setInputFiles({name: 'legacy-timing.draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy))});
  await rejection;
  await page.waitForFunction(() => document.getElementById('report-status').textContent.includes('Nothing has been imported.'));
  rejectingLegacy = false;
  assert.deepEqual(expectedRejections, ['Legacy Timing draft: HTTP 400']);
  assert.equal(await page.locator('#client-name').inputValue(), soloDraft.people[0].name);
  assert.equal(await downloaded('#export-html'), soloHtml);
  assert.deepEqual(JSON.parse(await downloaded('#save-draft')), soloDraft);
  await page.locator('#offer').selectOption('family');
  assert.equal(await page.locator('#person-1-name').inputValue(), '2'.repeat(60));
  assert.equal(await page.locator('#person-2-name').inputValue(), '3'.repeat(60));
  await page.locator('#offer').selectOption('timing-map');
  await page.locator('#update-preview').click();
  await page.waitForFunction(() => !document.getElementById('export-html').disabled);
  checks.push('Family→Timing excludes cached extra people from requests/drafts/exports; switching back preserves them; rejected legacy Timing import preserves current inputs and generated HTML');

  await page.setViewportSize({width: 390, height: 844});
  await page.screenshot({path: `${evidence}/report-mobile.png`, fullPage: true});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({width: 1440, height: 1000});
  const pending = server.delayNext('/api/report');
  await page.locator('#load-sample').click(); await pending.seen;
  await page.locator('#client-name').fill('New unsaved edit'); pending.release();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#client-name').inputValue(), 'New unsaved edit');
  assert.equal(await page.locator('#export-html').isDisabled(), true);
  assert.equal(await page.evaluate(() => { const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); return e.defaultPrevented; }), true);
  checks.push('Late report response cannot replace edited inputs or clear the unsaved-draft guard');
  await downloaded('#save-draft');

  await page.goto(`${server.url}/index.html`);
  assert.match(await page.title(), /Card Blueprints/);
  await page.locator('#birthday').fill('1991-02-17'); await page.locator('#target').fill('2026-10-15');
  await page.getByRole('button', {name: 'Generate spread', exact: true}).click();
  await page.waitForFunction(() => !document.getElementById('export').disabled);
  for (const name of ['Annual spread', 'Life spread', 'Spirit spread', 'Seven-year cycle', 'Weekly spread', 'Full board']) {
    await page.getByRole('button', {name, exact: true}).click(); assert.ok((await page.locator('#content').innerText()).length > 50);
  }
  await page.getByLabel('Board number').selectOption('89');
  assert.equal(await page.locator('.full-board .card').count(), 52);
  await page.locator('.full-board .card').first().click(); assert.equal(await page.locator('#detail').isVisible(), true); await page.locator('#close-detail').click();
  const spread = JSON.parse(await downloaded('#export')); assert.equal(spread.boards.length, 90);
  await page.screenshot({path: `${evidence}/explorer-desktop.png`});
  await page.setViewportSize({width: 390, height: 844});
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({path: `${evidence}/explorer-mobile.png`});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.locator('.full-board').scrollIntoViewIfNeeded();
  await page.screenshot({path: `${evidence}/explorer-mobile-board.png`});
  assert.equal(await page.locator('.full-board .card').count(), 52);
  await page.locator('#target').fill('2026-10-16'); assert.equal(await page.locator('#export').isDisabled(), true);
  checks.push('Explorer six views, all 52 seats on board 89, card details, export, input invalidation and mobile layout');

  server.setSession('expired'); await page.getByRole('button', {name: 'Generate spread', exact: true}).click();
  await page.waitForFunction(() => !document.getElementById('reauth').hidden);
  assert.equal(await page.locator('#export').isDisabled(), true);
  assert.equal(await page.locator('#birthday').inputValue(), '1991-02-17');
  checks.push('Expired server session blocks generation and preserves entered dates');
  server.setSession('valid');
  await page.locator('#logout').click(); await page.waitForURL('**/cdn-cgi/access/logout');
  assert.ok(!(await page.locator('body').innerText()).includes('1991-02-17'));
  checks.push('Sign out clears visible personal data');
  assert.deepEqual(errors, []);
  const result = {status: 'passed', url: server.url, browser: 'installed Google Chrome via Playwright', viewports: ['1440×1000', '390×844'], checks, pdfChecks, consoleErrors: errors, expectedRejections, screenshots: evidence, limitations: 'Synthetic local Access issuer; real Cloudflare account, DNS and revocation propagation not exercised.'};
  await mkdir(`${root}/test-results`, {recursive: true}); await writeFile(`${root}/test-results/browser.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); await server.close(); }
