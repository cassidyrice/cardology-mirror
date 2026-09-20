import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { parseArgs } from "node:util";
import { buildProfessionalReading } from "./builder";
import { renderReport } from "./render";
import { privateOutputPath } from "./private-output";

async function main() {
  const { values, positionals } = parseArgs({args: process.argv.slice(2), allowPositionals:true, options:{out:{type:"string"}, "html-only":{type:"boolean"}, help:{type:"boolean"}}});
  if (values.help) {
    console.log('Usage: bun scripts/professional-reading/cli.ts "Client name" YYYY-MM-DD YYYY-MM-DD --out /private/output/directory [--html-only]\nDates: birth date, then reading date. Files: reading.html and reading.pdf (when local Chromium is available). Existing files are never replaced.');
    return;
  }
  if (positionals.length !== 3 || !values.out) throw Error('Supply client name, birth date, reading date, and --out directory. Use --help for an example.');
  const report = buildProfessionalReading(positionals[0], positionals[1], positionals[2]);
  const out = await privateOutputPath(values.out);
  await mkdir(out,{recursive:true,mode:0o700});
  const html = renderReport(report);
  const htmlPath = resolve(out,"reading.html");
  await writeFile(htmlPath,html,{flag:"wx",mode:0o600});
  console.log(`HTML: ${htmlPath}`);
  if (values["html-only"]) return;
  let browser;
  try { browser = await chromium.launch({headless:true}); }
  catch (error) {
    console.error(`PDF unavailable: local Chromium could not launch. HTML is complete; open it and Print → Save as PDF. ${error instanceof Error ? error.message.split("\n")[0] : "Launch failed"}`);
    return;
  }
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.abort());
    await page.setContent(html, {waitUntil:"load"});
    await page.emulateMedia({media:"print"});
    const pdf = await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true});
    const pdfPath = resolve(out,"reading.pdf");
    await writeFile(pdfPath,pdf,{flag:"wx",mode:0o600});
    console.log(`PDF: ${pdfPath}`);
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error instanceof Error ? error.message : String(error));process.exitCode=1;});
