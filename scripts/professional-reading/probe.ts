// Local-only browser acceptance check. Fails explicitly if Chromium cannot launch.
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { chromium } from "playwright";
import { buildProfessionalReading } from "./builder";
import { privateOutputPath } from "./private-output";

const path = resolve(process.argv[2] ?? "scripts/professional-reading/private-sample/reading.html");
const out = await privateOutputPath(resolve(dirname(path),"browser-evidence"));
const html = await readFile(path,"utf8");
await mkdir(out,{mode:0o700});
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:850,height:1100}});
  const requests:string[] = [];
  page.on("request", request=>requests.push(request.url()));
  await page.route("**/*",route=>route.abort());
  await page.setContent(html,{waitUntil:"load"});
  assert.equal(requests.length,0,"Report must not fetch runtime assets");
  const expected = buildProfessionalReading("Cass","1991-02-17","2026-09-01");
  for (const board of expected.boards) {
    const element = page.locator(`[data-spread="${board.index}"]`);
    assert.equal(await element.locator('[data-cell="grid"]').count(),49);
    assert.equal(await element.locator('[data-cell="crown"]').count(),3);
    assert.deepEqual(await element.locator('[data-cell="grid"]').evaluateAll(cells=>cells.map(c=>c.getAttribute("data-code"))),board.grid.flatMap(row=>row.toReversed()));
    assert.deepEqual(await element.locator('[data-cell="crown"]').evaluateAll(cells=>cells.map(c=>c.getAttribute("data-code"))),board.crown.toReversed());
  }
  await page.emulateMedia({media:"print"});
  // A4 minus two 12mm margins = 186mm content width and 273mm height.
  await page.setViewportSize({width:Math.floor(186*96/25.4),height:1100});
  const checks = await page.locator(".page").evaluateAll(sections=>sections.map(section=>{
    const rect = section.getBoundingClientRect();
    const footer = section.querySelector("footer")!.getBoundingClientRect();
    const children = [...section.children].filter(c=>c.tagName!=="FOOTER");
    return {title:section.querySelector("h2")?.textContent, height:rect.height, maxHeight:273*96/25.4,
      overflow:children.some(c=>{const b=c.getBoundingClientRect();return b.right>rect.right+1 || b.bottom>footer.top+1;}),
      horizontal:section.scrollWidth>section.clientWidth+1};
  }));
  await writeFile(resolve(out,"layout.json"),JSON.stringify(checks,null,2),{flag:"wx",mode:0o600});
  for (const [i,check] of checks.entries()) {
    await writeFile(resolve(out,`page-${String(i+1).padStart(2,"0")}.png`),await page.locator(".page").nth(i).screenshot(),{flag:"wx",mode:0o600});
    assert.ok(!check.overflow && !check.horizontal && check.height<=check.maxHeight,`Print overflow: ${JSON.stringify(check)}`);
  }
  const pdf = await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true});
  await writeFile(resolve(out,"probed-reading.pdf"),pdf,{flag:"wx",mode:0o600});
  console.log(`PASS: ${checks.length} page sections, ${expected.boards.length} exact 52-card boards, no external requests, no footer overlap. Inspect screenshots and PDF in ${out}`);
} finally { await browser.close(); }
