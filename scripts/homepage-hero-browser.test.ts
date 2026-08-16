/**
 * Browser verification for the calculator-first homepage hero.
 * HOMEPAGE_HERO_BASE_URL=http://127.0.0.1:3577 bun scripts/homepage-hero-browser.test.ts
 */
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";

const base = process.env.HOMEPAGE_HERO_BASE_URL || "http://127.0.0.1:3577";

async function reveal(page: Page, date: string) {
  await page.waitForLoadState("networkidle");
  const hero = page.locator('section[aria-labelledby="home-calculator-title"]');
  const input = hero.locator("#home-birthdate");
  await input.fill(date);
  await input.press("Enter");
  return hero;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const analyticsPayloads: Array<Record<string, unknown>> = [];
  const coursePayloads: Array<Record<string, unknown>> = [];
  let courseAttempt = 0;

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript({
    content: `Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: () => false });`,
  });

  await page.route("**/api/analytics", async (route) => {
    try {
      analyticsPayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    } catch {
      analyticsPayloads.push({});
    }
    await route.fulfill({ status: 204 });
  });

  await page.route("**/api/free-course/signup", async (route) => {
    courseAttempt += 1;
    coursePayloads.push(route.request().postDataJSON() as Record<string, unknown>);
    if (courseAttempt === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Course access is temporarily unavailable. Please try again." }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accessUrl: `${base}/free-course` }),
    });
  });

  await page.goto(base, { waitUntil: "domcontentloaded" });
  const hero = page.locator('section[aria-labelledby="home-calculator-title"]');
  await hero.getByRole("heading", { name: "Which playing card were you born under?" }).waitFor();
  assert.equal(await hero.locator('input[name="email"]').count(), 0, "email must not appear before the result");

  const submitBox = await hero.getByRole("button", { name: "Reveal my birth card" }).boundingBox();
  assert.ok(submitBox && submitBox.y < 800, "calculator action must be in the initial desktop viewport");

  await reveal(page, "1990-01-15");
  await hero.getByRole("heading", { name: "Queen of Diamonds" }).waitFor();
  assert.equal(
    await hero.getByRole("link", { name: "Read the Queen of Diamonds meaning →" }).getAttribute("href"),
    "/birth-card/queen-of-diamonds",
  );
  await hero.getByText("Want to learn how to read your card?").waitFor();
  await hero.getByRole("link", { name: "Get the complete Personal Blueprint · $13" }).waitFor();

  const analyticsJson = JSON.stringify(analyticsPayloads);
  assert.equal(analyticsJson.includes("1990-01-15"), false, "analytics must exclude the birthday");
  assert.ok(
    analyticsPayloads.some((payload) => payload.eventName === "calculator_completed" && payload.placement === "home-hero"),
    "homepage completion must be placement-attributed",
  );
  const calculatorStarts = analyticsPayloads.filter(
    (payload) => payload.eventName === "calculator_started",
  );
  assert.equal(calculatorStarts.length, 1, "homepage must emit one calculator start per flow");
  assert.equal(calculatorStarts[0]?.placement, "home-hero");

  await hero.locator('input[name="name"]').fill("Browser Tester");
  await hero.locator('input[name="email"]').fill("browser@example.test");
  await hero.getByRole("button", { name: "Send me the free course →" }).click();
  await hero.getByRole("alert").waitFor();
  await hero.getByRole("heading", { name: "Queen of Diamonds" }).waitFor();
  assert.equal(coursePayloads[0]?.source, "home-hero-result");
  assert.deepEqual(Object.keys(coursePayloads[0]).sort(), ["company", "email", "name", "source"]);

  await hero.getByRole("button", { name: "Send me the free course →" }).click();
  await page.waitForURL("**/free-course");
  assert.equal(coursePayloads.length, 2, "course signup should be retryable");

  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const mobileInitialHero = page.locator('section[aria-labelledby="home-calculator-title"]');
  const mobileSubmitBox = await mobileInitialHero
    .getByRole("button", { name: "Reveal my birth card" })
    .boundingBox();
  assert.ok(
    mobileSubmitBox && mobileSubmitBox.y + mobileSubmitBox.height <= 640,
    "calculator action must be fully visible in the initial 320×640 viewport",
  );
  const mobileHero = await reveal(page, "2000-02-29");
  await mobileHero.getByRole("heading", { name: "9 of Clubs" }).waitFor();
  const mobileFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  assert.equal(mobileFits, true, "homepage must not overflow horizontally on mobile");

  await page.goto(base, { waitUntil: "domcontentloaded" });
  const jokerHero = await reveal(page, "2000-12-31");
  await jokerHero.getByRole("heading", { name: "The Joker" }).waitFor();
  assert.equal(
    await jokerHero.getByRole("link", { name: /Read the .* meaning/ }).count(),
    0,
    "Joker result must not offer a nonexistent meaning page",
  );
  await jokerHero.getByRole("link", { name: "Get the complete Personal Blueprint · $13" }).waitFor();

  await browser.close();
  console.log("PASS: homepage calculator hero browser flow, privacy, retry, mobile, leap day, and Joker");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
