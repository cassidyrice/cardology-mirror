/**
 * Local rendered smoke for the keyword-strategy SEO integrity pass.
 *
 * SEO_BASE_URL=http://127.0.0.1:3577 bun scripts/seo-integrity-browser.ts
 */
import assert from "node:assert/strict";
import { chromium, type ConsoleMessage, type Page } from "playwright";

import { birthCardSlug } from "../lib/birth-card-calculator";
import { buildLifePathProfile } from "../lib/life-path";
import { SITE_URL } from "../lib/site";
import { SPREADS, SPREADS_HUB_PATH } from "../lib/spreads";
import { compatibilityPairPath } from "../lib/worker-seo-routes";

const base = (process.env.SEO_BASE_URL || "http://127.0.0.1:3577").replace(
  /\/$/,
  "",
);
const screenshotPath =
  process.env.SEO_SCREENSHOT_PATH || "/tmp/cardblueprints-seo-integrity.png";
const elroyScreenshotPath = screenshotPath.replace(/(\.\w+)?$/, "-elroy$1");

type JsonLd = Record<string, unknown>;

function collectTypes(value: unknown, type: string): JsonLd[] {
  if (!value || typeof value !== "object") return [];

  const record = value as JsonLd;
  const found = record["@type"] === type ? [record] : [];
  return found.concat(
    Object.values(record).flatMap((child) =>
      Array.isArray(child)
        ? child.flatMap((item) => collectTypes(item, type))
        : collectTypes(child, type),
    ),
  );
}

async function jsonLd(page: Page): Promise<JsonLd[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts
        .map((script) => JSON.parse(script.textContent || "null") as unknown)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter(
          (value): value is Record<string, unknown> =>
            Boolean(value) && typeof value === "object",
        ),
    );
}

function consoleLine(message: ConsoleMessage): string {
  return `${message.type()}: ${message.text()}`;
}

function rectanglesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

async function assertHealthyPage(page: Page, path: string): Promise<void> {
  const current = new URL(page.url());
  assert.equal(current.pathname, path, `${path}: page identity pathname`);
  assert.ok((await page.title()).trim(), `${path}: page identity title`);

  const bodyText = (await page.locator("body").innerText()).trim();
  assert.ok(bodyText.length > 80, `${path}: meaningful body content`);
  assert.doesNotMatch(
    bodyText,
    /Application error|Unhandled Runtime Error|Internal Server Error/i,
    `${path}: no framework error text`,
  );

  const visibleNextOverlay = await page.locator("nextjs-portal").evaluateAll(
    (portals) =>
      portals.some((portal) => {
        const style = getComputedStyle(portal);
        const box = portal.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          box.width > 0 &&
          box.height > 0
        );
      }),
  );
  assert.equal(visibleNextOverlay, false, `${path}: no Next.js error overlay`);
}

async function goto(page: Page, path: string): Promise<void> {
  const response = await page.goto(`${base}${path}`, {
    waitUntil: "domcontentloaded",
  });
  assert.ok(response, `${path}: navigation returned a response`);
  assert.ok(response.ok(), `${path}: HTTP ${response.status()}`);
  // SSR controls are visible before React attaches event handlers. Waiting for
  // network idle keeps fast, warm dev-server runs from submitting stale state.
  await page.waitForLoadState("networkidle");
  await assertHealthyPage(page, path);
}

async function assertOneBreadcrumb(page: Page, path: string): Promise<void> {
  await goto(page, path);

  const visibleTrail = page.locator('nav[aria-label="Breadcrumb"]');
  assert.equal(await visibleTrail.count(), 1, `${path}: one breadcrumb nav`);
  assert.equal(await visibleTrail.isVisible(), true, `${path}: visible breadcrumb nav`);

  const graphs = await jsonLd(page);
  assert.equal(
    graphs.flatMap((graph) => collectTypes(graph, "BreadcrumbList")).length,
    1,
    `${path}: one BreadcrumbList`,
  );
}

async function assertArticle(
  page: Page,
  path: string,
  expectedHeadline: string,
): Promise<void> {
  await goto(page, path);
  const articles = (await jsonLd(page)).flatMap((graph) =>
    collectTypes(graph, "Article"),
  );
  assert.equal(articles.length, 1, `${path}: one Article`);
  assert.equal(articles[0]?.headline, expectedHeadline, `${path}: Article headline`);
  assert.equal(articles[0]?.url, `${SITE_URL}${path}`, `${path}: Article URL`);
  assert.equal(
    (articles[0]?.mainEntityOfPage as JsonLd | undefined)?.["@id"],
    `${SITE_URL}${path}`,
    `${path}: Article mainEntityOfPage`,
  );
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleProblems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleProblems.push(consoleLine(message));
  });
  page.on("pageerror", (error) => {
    consoleProblems.push(`pageerror: ${error.message}`);
  });

  try {
    await goto(page, "/birth-card-calculator");
    await page.locator("#bd").fill("2001-01-15");
    await page.getByRole("button", { name: "Reveal my birth card" }).click();
    const januaryLink = page
      .locator('a[href="/born-on/january-15"]')
      .filter({ hasText: "Read the January 15 birth-card page" });
    await januaryLink.waitFor();
    assert.equal(await januaryLink.count(), 1, "January 15: one Worker anchor");
    assert.equal(await januaryLink.getAttribute("href"), "/born-on/january-15");
    assert.equal(
      (await januaryLink.innerText()).trim(),
      "Read the January 15 birth-card page →",
    );

    await page.locator("#bd").fill("2000-02-29");
    await page.getByRole("button", { name: "Reveal my birth card" }).click();
    const leapLink = page
      .locator('a[href="/born-on/february-29"]')
      .filter({ hasText: "Read the February 29 birth-card page" });
    await leapLink.waitFor();
    assert.equal(await leapLink.count(), 1, "February 29: one Worker anchor");
    assert.equal(await leapLink.getAttribute("href"), "/born-on/february-29");
    assert.equal(
      (await leapLink.innerText()).trim(),
      "Read the February 29 birth-card page →",
    );
    assert.equal(
      await page
        .locator('a[href="/born-on/january-15"]')
        .filter({ hasText: "Read the January 15 birth-card page" })
        .count(),
      0,
      "birth result keeps only the latest submitted Worker link",
    );

    const first = "2000-01-15";
    const second = "2000-02-29";
    const firstProfile = buildLifePathProfile(first, "First");
    const secondProfile = buildLifePathProfile(second, "Second");
    assert.ok(firstProfile && secondProfile, "compatibility fixtures resolve");
    const expectedPair = compatibilityPairPath(
      birthCardSlug(firstProfile.birthCard)!,
      birthCardSlug(secondProfile.birthCard)!,
    );
    assert.ok(expectedPair, "compatibility fixture has a canonical pair path");

    await goto(page, "/birth-card-compatibility-calculator");
    await page.locator("#da").fill(first);
    await page.locator("#db").fill(second);
    await page
      .getByRole("button", { name: "Compare birth cards and Life Paths" })
      .click();
    let pairLinks = page.locator(`a[href="${expectedPair}"]`);
    await pairLinks.waitFor();
    assert.equal(await pairLinks.count(), 1, "forward inputs: one canonical pair link");

    await page.locator("#da").fill(second);
    await page.locator("#db").fill(first);
    await page
      .getByRole("button", { name: "Compare birth cards and Life Paths" })
      .click();
    pairLinks = page.locator(`a[href="${expectedPair}"]`);
    await pairLinks.waitFor();
    assert.equal(await pairLinks.count(), 1, "reversed inputs: one canonical pair link");

    await goto(page, "/birth-card");
    const popular = page.locator('section[aria-labelledby="popular-card-meanings"]');
    assert.equal(
      await popular.locator('a[href="/birth-card/queen-of-hearts"]').count(),
      1,
      "popular meanings includes Queen of Hearts",
    );
    assert.equal(
      await popular.locator('a[href="/birth-card/queen-of-clubs"]').count(),
      1,
      "popular meanings includes Queen of Clubs",
    );
    assert.equal(
      await page
        .locator('footer a[href="/how-to-read-playing-cards"]')
        .isVisible(),
      true,
      "footer exposes How to Read Playing Cards",
    );
    assert.equal(
      await page
        .locator(
          'nav[aria-label="Primary"] a[href="/birth-card-compatibility-calculator"]',
        )
        .count(),
      1,
      "desktop primary nav exposes Compatibility",
    );

    await page.setViewportSize({ width: 820, height: 800 });
    await goto(page, "/");
    assert.equal(
      await page.getByText("Menu", { exact: true }).isVisible(),
      true,
      "820px: Menu is visible",
    );
    assert.equal(
      await page.locator('nav[aria-label="Primary"]').isVisible(),
      false,
      "820px: desktop primary nav is hidden",
    );

    await page.setViewportSize({ width: 1024, height: 800 });
    await page.reload({ waitUntil: "networkidle" });
    await assertHealthyPage(page, "/");
    assert.equal(
      await page.locator('nav[aria-label="Primary"]').isVisible(),
      true,
      "1024px: desktop primary nav is visible",
    );
    assert.equal(
      await page.locator("header").evaluate(
        (header) => header.scrollWidth <= header.clientWidth,
      ),
      true,
      "1024px: header has no horizontal overflow",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, "/");
    await page.getByText("Menu", { exact: true }).click();
    assert.equal(
      await page
        .locator(
          'nav[aria-label="Mobile primary"] a[href="/birth-card-compatibility-calculator"]',
        )
        .isVisible(),
      true,
      "390px: mobile nav exposes Compatibility",
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await goto(page, "/products/personal-card-blueprint");
    const elroyLauncher = page.locator(
      'button[aria-label="Open Elroy micro-reading"]',
    );
    const primaryBlueprintCta = page
      .locator('main a[href="/checkout/personal-card-blueprint"]')
      .first();
    await elroyLauncher.waitFor();
    const launcherBox = await elroyLauncher.boundingBox();
    const ctaBox = await primaryBlueprintCta.boundingBox();
    assert.ok(launcherBox && ctaBox, "mobile Blueprint CTA overlap is measurable");
    assert.equal(
      rectanglesOverlap(launcherBox, ctaBox),
      false,
      "390px: Elroy launcher does not cover the primary Blueprint CTA",
    );
    await elroyLauncher.click();
    const elroyPanel = page.locator("dialog.elroy-panel");
    await elroyPanel.waitFor();
    const panelBox = await elroyPanel.boundingBox();
    assert.ok(
      panelBox &&
        panelBox.x >= 0 &&
        panelBox.y >= 0 &&
        panelBox.x + panelBox.width <= 390 &&
        panelBox.y + panelBox.height <= 844,
      "390px: manually opened Elroy panel fits the viewport",
    );
    await page.screenshot({ path: elroyScreenshotPath, fullPage: false });
    await page.getByRole("button", { name: "Close Elroy" }).click();

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of [
      "/playing-card-spreads/three-card",
      "/blog/four-suits-in-cardology",
      "/blog/pillar/cardology-foundations",
      "/birth-card/queen-of-hearts",
    ]) {
      await assertOneBreadcrumb(page, path);
    }

    await goto(page, SPREADS_HUB_PATH);
    const collections = (await jsonLd(page)).flatMap((graph) =>
      collectTypes(graph, "CollectionPage"),
    );
    assert.equal(collections.length, 1, "spreads hub: one CollectionPage");
    assert.equal(
      collections[0]?.url,
      `${SITE_URL}${SPREADS_HUB_PATH}`,
      "spreads hub: CollectionPage URL",
    );
    const itemLists = collectTypes(collections[0], "ItemList");
    assert.equal(itemLists.length, 1, "spreads hub: one ItemList");
    assert.equal(
      itemLists[0]?.numberOfItems,
      SPREADS.length,
      "spreads hub: ItemList count",
    );
    const items = itemLists[0]?.itemListElement as JsonLd[];
    assert.equal(items.length, SPREADS.length, "spreads hub: ListItem count");
    assert.deepEqual(
      items.map((item) => item.position),
      SPREADS.map((_, index) => index + 1),
      "spreads hub: consecutive ListItem positions",
    );
    assert.deepEqual(
      items.map((item) => item.url),
      SPREADS.map((spread) => `${SITE_URL}${spread.path}`),
      "spreads hub: visible spoke URLs",
    );

    await assertArticle(
      page,
      "/how-to-read-playing-cards",
      "How to Read Playing Cards",
    );
    await assertArticle(
      page,
      "/52-card-astrology-explained",
      "Playing Cards Birthday Chart & 52-Card Astrology",
    );

    assert.deepEqual(
      consoleProblems,
      [],
      `browser console/page errors:\n${consoleProblems.join("\n")}`,
    );
  } finally {
    await browser.close();
  }

  console.log(
    `PASS: SEO integrity browser smoke (screenshot: ${screenshotPath})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
