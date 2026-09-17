/**
 * Run against a separately started local production server:
 * SEO_BASE_URL=http://127.0.0.1:3589 bun scripts/ruling-card-reference-browser.ts
 * Optional: SEO_OUTPUT_DIR=/absolute/output/path (or the first CLI argument).
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

import { buildRulingCardReference, rulingCardReferenceCsv } from "../lib/ruling-card-reference";
import { SITE_URL } from "../lib/site";

const base = (process.env.SEO_BASE_URL || "http://127.0.0.1:3589").replace(/\/$/, "");
const output = process.env.SEO_OUTPUT_DIR || process.argv[2]
  || "/Users/main/cardblueprints-ops/outputs/authority-2026-09-17";
const path = "/planetary-ruling-card";
const csvPath = "/data/planetary-ruling-card-chart.csv";
const expected = buildRulingCardReference();
const checks: string[] = [];
const applicationErrors: string[] = [];
const externalAnalyticsFailures: string[] = [];
const screenshots: string[] = [];
type JsonLd = Record<string, unknown>;

function collectTypes(value: unknown, type: string): JsonLd[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectTypes(item, type));
  const record = value as JsonLd;
  return [
    ...(record["@type"] === type ? [record] : []),
    ...Object.values(record).flatMap((child) => collectTypes(child, type)),
  ];
}

function watchErrors(page: Page, label: string): void {
  const isExternalAnalytics = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return /(^|\.)(google-analytics\.com|googletagmanager\.com|cloudflareinsights\.com|posthog\.com|posthog\.net)$/.test(host);
    } catch {
      return false;
    }
  };
  page.on("pageerror", (error) => applicationErrors.push(`${label}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const url = message.location().url;
    const line = `${label}: ${message.text()} (${url})`;
    (isExternalAnalytics(url) ? externalAnalyticsFailures : applicationErrors).push(line);
  });
  page.on("requestfailed", (request) => {
    // Navigating between test cases can cancel an in-flight prefetch normally.
    if (request.failure()?.errorText === "net::ERR_ABORTED") return;
    // Chrome blocks preloaded scripts by design in a JavaScript-disabled context.
    if (label === "no-JavaScript" && request.resourceType() === "script" && request.failure()?.errorText === "csp") return;
    const line = `${label}: ${request.url()} ${request.failure()?.errorText ?? "request failed"}`;
    if (isExternalAnalytics(request.url())) externalAnalyticsFailures.push(line);
    else if (new URL(request.url()).origin === new URL(base).origin) applicationErrors.push(line);
  });
}

async function visit(page: Page, suffix = ""): Promise<void> {
  // A same-document hash navigation returns no HTTP response in Playwright.
  // Start fresh here; hashchange behavior is exercised separately below.
  await page.goto("about:blank");
  const response = await page.goto(`${base}${path}${suffix}`, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `page request succeeded: ${response?.status()}`);
  await page.getByLabel("Search a birthday or card", { exact: true }).waitFor();
}

async function rowCount(page: Page, count: number): Promise<void> {
  await page.waitForFunction((expectedCount) =>
    document.querySelectorAll("[data-ruling-date]").length === expectedCount, count);
  assert.equal(await page.locator("[data-ruling-date]").count(), count);
}

async function noOverflow(page: Page, label: string): Promise<void> {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(widths.document <= widths.viewport + 1, `${label}: document overflow ${JSON.stringify(widths)}`);
  assert.ok(widths.body <= widths.viewport + 1, `${label}: body overflow ${JSON.stringify(widths)}`);
}

async function screenshot(page: Page, name: string): Promise<void> {
  const file = join(output, name);
  await page.screenshot({ path: file, fullPage: false });
  screenshots.push(file);
}

async function main(): Promise<void> {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
  let failure: string | null = null;
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    context.setDefaultTimeout(15_000);

    // This response is read before any page navigation or React hydration.
    const raw = await context.request.get(`${base}${path}`);
    assert.equal(raw.status(), 200);
    const html = await raw.text();
    const rawDates = [...html.matchAll(/<tr\b[^>]*\bdata-ruling-date="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(rawDates, expected.map((row) => `${row.month}/${row.day}`));
    assert.equal(new Set(rawDates).size, 366);
    const rawDetails = [...html.matchAll(/<details\b[^>]*\bdata-ruling-month="\d+"[^>]*>/g)].map((match) => match[0]);
    assert.equal(rawDetails.length, 12);
    assert.ok(rawDetails.every((tag) => !/\sopen(?:\s|=|>)/.test(tag)), "all month sections start closed in raw HTML");
    checks.push("Raw HTML contains all 366 distinct birthdays and 12 closed native month sections");

    const csvResponse = await context.request.get(`${base}${csvPath}`);
    assert.equal(csvResponse.status(), 200);
    assert.match(csvResponse.headers()["content-type"], /^text\/csv;\s*charset=utf-8$/i);
    assert.equal(csvResponse.headers()["content-disposition"], 'attachment; filename="card-blueprints-planetary-ruling-card-chart.csv"');
    const csvBytes = await csvResponse.body();
    assert.deepEqual([...csvBytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    assert.equal(csvBytes.toString("utf8"), rulingCardReferenceCsv());
    const csvLines = csvBytes.toString("utf8").replace(/^\uFEFF/, "").trimEnd().split("\r\n");
    assert.equal(csvLines.length, 367, "CSV has one header plus 366 data rows");
    assert.ok(csvLines.every((line) => line.split(",").length === 8));
    checks.push("HTTP CSV serves a named UTF-8 attachment with all 366 complete reference rows");

    const page = await context.newPage();
    watchErrors(page, "390px/1280px");
    await visit(page);
    assert.equal(await page.locator("[data-ruling-month]").count(), 12);
    assert.equal(await page.locator("[data-ruling-month][open]").count(), 0);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), `${SITE_URL}${path}`);
    const title = await page.title();
    assert.match(title, /Planetary Ruling Card Chart/);
    assert.ok(title.length >= 35 && title.length <= 65, `title length ${title.length}`);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    assert.ok(description && description.length >= 100 && description.length <= 170, `description length ${description?.length}`);
    const graphs = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => JSON.parse(script.textContent || "null") as unknown));
    const articles = collectTypes(graphs, "Article");
    const datasets = collectTypes(graphs, "Dataset");
    const faqs = collectTypes(graphs, "FAQPage");
    assert.equal(articles.length, 1);
    assert.equal(articles[0].headline, title);
    assert.equal(datasets.length, 1);
    assert.equal(datasets[0].isAccessibleForFree, true);
    const downloads = collectTypes(datasets[0].distribution, "DataDownload");
    assert.equal(downloads.length, 1);
    assert.equal(downloads[0].encodingFormat, "text/csv");
    assert.equal(downloads[0].contentUrl, `${SITE_URL}${csvPath}`);
    assert.equal(faqs.length, 1);
    const questions = collectTypes(faqs[0], "Question");
    assert.ok(questions.length >= 6);
    for (const question of questions) {
      assert.equal(await page.locator("#faq").getByRole("heading", { name: String(question.name), exact: true }).count(), 1);
    }
    checks.push(`Metadata and Article/FAQPage/Dataset markup pass; title ${title.length}, description ${description!.length} characters`);

    await noOverflow(page, "390px initial page");
    await screenshot(page, "ruling-card-mobile-hero.png");
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download all 366 birthdays (CSV)", exact: true }).click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), "card-blueprints-planetary-ruling-card-chart.csv");
    assert.equal(await download.failure(), null);
    checks.push("Visible CSV download link initiates a successful named download");

    const search = page.getByLabel("Search a birthday or card", { exact: true });
    await search.fill("1/15");
    await rowCount(page, 1);
    assert.equal(await page.locator("#january-15").isVisible(), true);
    assert.deepEqual(await page.locator("#january-15 td a").allTextContents(), ["Queen of Diamonds", "7 of Clubs"]);
    assert.match(await page.locator("[data-ruling-card-chart]").getByRole("status").innerText(), /^1 of 366 birthdays/);
    await search.fill("October 23");
    await rowCount(page, 1);
    assert.equal(await page.locator("#october-23").isVisible(), true);
    assert.deepEqual(await page.locator("#october-23 td a").allTextContents(), ["Queen of Hearts", "8 of Diamonds", "King of Spades", "5 of Clubs"]);
    await noOverflow(page, "390px three-card result");
    await page.locator("#october-23").evaluate((row) => row.scrollIntoView({ block: "center" }));
    await screenshot(page, "ruling-card-mobile-october-23.png");
    checks.push("Numeric and named birthday searches return exact rows and preserve all three October 23 ruling cards");

    await search.fill("queen spades");
    const queenOfSpadesDates = expected.filter((row) =>
      [row.birthCard, ...row.rulingCards].some((card) => card.code === "Q♠"));
    await rowCount(page, queenOfSpadesDates.length);
    assert.deepEqual(await page.locator("[data-ruling-date]").evaluateAll((rows) => rows.map((row) => row.id)),
      queenOfSpadesDates.map((row) => row.id));
    checks.push("Card-name search matches words within one card, without mixing a rank from one card and a suit from another");

    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    await rowCount(page, 366);
    await page.getByLabel("Month", { exact: true }).selectOption("2");
    await rowCount(page, 29);
    assert.equal(await page.locator('[data-ruling-month="2"][open]').count(), 1);
    assert.equal(await page.locator("#february-29").isVisible(), true);
    await search.fill("no-such-birthday-or-card");
    await rowCount(page, 0);
    assert.equal(await page.getByText(/^No birthdays match\./).isVisible(), true);
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    await rowCount(page, 366);
    assert.equal(await search.inputValue(), "");
    assert.equal(await page.getByLabel("Month", { exact: true }).inputValue(), "all");
    checks.push("February filter includes 29 dates; empty state explains recovery; clearing restores all 366");

    await visit(page, "#october-23");
    await page.locator('[data-ruling-month="10"][open]').waitFor();
    assert.equal(await page.locator("#october-23").isVisible(), true);
    await search.fill("1/15");
    await rowCount(page, 1);
    await page.evaluate(() => { window.location.hash = "february-29"; });
    await page.locator('[data-ruling-month="2"][open]').waitFor();
    await rowCount(page, 366);
    assert.equal(await page.locator("#february-29").isVisible(), true);
    assert.equal(await search.inputValue(), "");
    checks.push("Initial birthday deep links and subsequent hash changes reveal the target and clear conflicting filters");

    await visit(page, "#january-15");
    await page.locator('[data-ruling-month="1"][open]').waitFor();
    await page.getByLabel("Month", { exact: true }).selectOption("2");
    await rowCount(page, 29);
    await page.getByRole("link", { name: "January 15", exact: true }).click();
    await rowCount(page, 366);
    assert.equal(await page.getByLabel("Month", { exact: true }).inputValue(), "all");
    assert.equal(await page.locator("#january-15").isVisible(), true);
    await page.locator('[data-ruling-month="1"] summary').click();
    assert.equal(await page.locator("#january-15").isVisible(), false);
    await page.getByRole("link", { name: "January 15", exact: true }).click();
    assert.equal(await page.locator("#january-15").isVisible(), true);
    checks.push("Clicking the same birthday hash after filtering or manually closing its month restores and reveals that birthday");

    await page.getByLabel("Enter your birthday", { exact: true }).fill("2000-01-15");
    await page.getByRole("button", { name: "Reveal my birth card", exact: true }).click();
    const calculator = page.locator("#calculator");
    await calculator.getByRole("link", { name: "Queen of Diamonds meaning", exact: true }).waitFor();
    assert.equal(await calculator.getByText("7 of Clubs", { exact: false }).isVisible(), true);
    assert.equal(await calculator.locator('a[href="/born-on/january-15"]').count(), 1);
    assert.equal(await calculator.getByRole("button", { name: "Not your birthday? Change it", exact: true }).isVisible(), true);
    await noOverflow(page, "390px calculator result");
    checks.push("Existing labeled date calculator reveals Queen of Diamonds and 7 of Clubs for January 15");

    await page.setViewportSize({ width: 1280, height: 900 });
    await visit(page);
    await noOverflow(page, "1280px initial page");
    await screenshot(page, "ruling-card-desktop.png");
    await page.locator('[data-ruling-month="10"] summary').click();
    assert.equal(await page.locator("#october-23").isVisible(), true);
    await noOverflow(page, "1280px expanded October table");
    checks.push("390px mobile and 1280px desktop fit the viewport, including expanded tables and calculator results");

    const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const noJsPage = await noJsContext.newPage();
    watchErrors(noJsPage, "no-JavaScript");
    const noJsResponse = await noJsPage.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    assert.ok(noJsResponse?.ok());
    assert.equal(await noJsPage.locator("[data-ruling-date]").count(), 366);
    assert.equal(await noJsPage.locator("[data-ruling-month][open]").count(), 0);
    assert.equal(await noJsPage.getByLabel("Search a birthday or card", { exact: true }).count(), 0);
    await noJsPage.locator('[data-ruling-month="2"] summary').click();
    assert.equal(await noJsPage.locator("#february-29").isVisible(), true);
    assert.deepEqual(await noJsPage.locator("#february-29 td a").allTextContents(), ["9 of Clubs", "2 of Diamonds"]);
    await noOverflow(noJsPage, "390px no-JavaScript February table");
    checks.push("With JavaScript disabled, all dates remain available and native February disclosure reveals leap day");

    assert.deepEqual(applicationErrors, [], `Application or hydration errors:\n${applicationErrors.join("\n")}`);
    checks.push("No browser application, hydration, or first-party request errors");
  } catch (error) {
    failure = error instanceof Error ? error.stack ?? error.message : String(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    const report = { status: failure ? "failed" : "passed", base, checkedAt: new Date().toISOString(), checks, screenshots, applicationErrors, externalAnalyticsFailures: [...new Set(externalAnalyticsFailures)], failure };
    const reportPath = join(output, "ruling-card-browser-results.json");
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
