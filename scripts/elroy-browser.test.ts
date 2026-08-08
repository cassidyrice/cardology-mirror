/**
 * Lightweight browser smoke for Elroy launcher eligibility + free reveal.
 * Uses the Playwright library (not @playwright/test).
 *
 * ELROY_BASE_URL=http://127.0.0.1:3577 bun scripts/elroy-browser.test.ts
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ELROY_BASE_URL || "http://127.0.0.1:3577";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.route("**/challenges.cloudflare.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        window.turnstile = {
          render(el, opts) {
            el.dataset.ready = "1";
            setTimeout(() => opts.callback && opts.callback("test-token"), 10);
            return "w1";
          },
          reset() {},
          remove() {}
        };
      `,
    });
  });

  await page.route("**/api/elroy/micro-reading", async (route) => {
    const body = route.request().postDataJSON() as { birthdate?: string };
    assert.equal(body?.birthdate, "2001-01-15");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        card: {
          birthCard: "Q♦",
          birthCardLabel: "Queen of Diamonds",
          rulingCards: ["7♣"],
        },
        reading: {
          core: "Core text for browser test.",
          tension: "Tension text for browser test.",
          reflection: "Where could you practice this now?",
          disclaimer: "Use this as a reflection prompt.",
        },
        emailSent: false,
      }),
    });
  });

  await page.goto(`${base}/birth-card-calculator`, { waitUntil: "networkidle" });
  await page.waitForSelector('button[aria-label="Open Elroy micro-reading"]', {
    timeout: 15000,
  });

  await page.goto(`${base}/privacy-policy`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator('button[aria-label="Open Elroy micro-reading"]').count(),
    0,
  );

  await page.goto(`${base}/birth-card-calculator`, { waitUntil: "networkidle" });
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.waitForSelector("#elroy-title");
  await page.fill("#elroy-birthdate", "2001-01-15");
  await page.click('button:has-text("Show my card")');
  await page.waitForSelector("text=Queen of Diamonds");
  await page.click('button:has-text("Get the deeper pattern")');
  await page.fill("#elroy-email", "elroy-browser@example.test");
  await page.check('input[type="checkbox"]');
  await page.waitForTimeout(50);
  await page.click('button:has-text("Send my reading")');
  await page.waitForSelector("text=Core text for browser test");
  await page.waitForSelector("text=email copy may be delayed");
  const href = await page
    .locator('a:has-text("See My Personal Card Blueprint")')
    .getAttribute("href");
  assert.equal(href, "/products/personal-card-blueprint");

  // Joker boundary
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.fill("#elroy-birthdate", "1990-12-31");
  await page.click('button:has-text("Show my card")');
  await page.waitForSelector("text=Joker boundary");
  assert.equal(await page.locator("#elroy-email").count(), 0);

  // February 29
  await page.click('button[aria-label="Close Elroy"]');
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.fill("#elroy-birthdate", "2000-02-29");
  await page.click('button:has-text("Show my card")');
  await page.waitForSelector("text=9 of Clubs");

  await browser.close();
  console.log("PASS: elroy browser smoke");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
