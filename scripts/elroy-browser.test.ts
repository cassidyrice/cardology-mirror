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
  const analyticsPayloads: Array<Record<string, unknown>> = [];
  let readingVisibleWhenViewed = false;
  let resolveViewedEvent!: () => void;
  const viewedEventSeen = new Promise<void>((resolve) => {
    resolveViewedEvent = resolve;
  });

  await page.addInitScript({
    content: `
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: () => false
      });
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

  await page.route("**/api/analytics", async (route) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = route.request().postDataJSON() as Record<string, unknown>;
    } catch {
      payload = {};
    }
    analyticsPayloads.push(payload);
    if (payload.eventName === "elroy_micro_reading_viewed") {
      readingVisibleWhenViewed = await page
        .getByText("Core text for browser test.")
        .isVisible()
        .catch(() => false);
      resolveViewedEvent();
    }
    await route.fulfill({ status: 204 });
  });

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

  await page.goto(`${base}/birth-card-calculator`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Open Elroy micro-reading"]', {
    timeout: 15000,
  });

  await page.goto(`${base}/birth-card-calculator?birthdate=2001-01-15`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Queen of Diamonds");
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.waitForSelector("#elroy-birthdate");
  assert.equal(
    await page.inputValue("#elroy-birthdate"),
    "2001-01-15",
    "search-prefilled birth date should survive the calculator-to-launcher effect race",
  );
  await page.keyboard.press("Escape");

  await page.goto(`${base}/privacy-policy`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator('button[aria-label="Open Elroy micro-reading"]').count(),
    0,
  );

  await page.goto(`${base}/birth-card-calculator`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Open Elroy micro-reading"]');
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.waitForSelector("#elroy-title");

  const panelBox = await page.locator("dialog.elroy-panel").boundingBox();
  assert.ok(panelBox, "Elroy dialog should have a bounding box");
  assert.ok(
    1280 - (panelBox.x + panelBox.width) <= 32,
    "desktop dialog should sit at the right edge",
  );
  assert.ok(
    800 - (panelBox.y + panelBox.height) <= 32,
    "desktop dialog should sit at the bottom edge",
  );
  assert.equal(
    await page
      .locator('dialog.elroy-panel [aria-live="polite"], dialog.elroy-panel [role="status"][aria-live]')
      .count(),
    1,
    "Elroy should expose one targeted polite live region",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "elroy-birthdate",
    "opening should focus the current input",
  );
  const closeBox = await page.locator('button[aria-label="Close Elroy"]').boundingBox();
  assert.ok(closeBox && closeBox.width >= 24 && closeBox.height >= 24, "close target is at least 24px");

  await page.keyboard.press("Escape");
  await page.waitForSelector("#elroy-title", { state: "detached" });
  assert.equal(
    await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label"),
    ),
    "Open Elroy micro-reading",
    "Escape should restore launcher focus",
  );
  await page.waitForTimeout(10_500);
  assert.equal(
    await page.getByText("Want the pattern behind your birth card?").count(),
    0,
    "teaser should not repeat after the visitor has opened Elroy",
  );
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
  await page.waitForSelector("text=Ruling card: 7 of Clubs");
  await page.waitForSelector("text=email copy may be delayed");
  await Promise.race([
    viewedEventSeen,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out waiting for viewed analytics")), 2_000),
    ),
  ]);
  assert.equal(
    readingVisibleWhenViewed,
    true,
    "viewed analytics should fire only after the reading is committed to the DOM",
  );
  assert.equal(
    analyticsPayloads.filter(
      (payload) => payload.eventName === "elroy_micro_reading_viewed",
    ).length,
    1,
    "reading viewed analytics should fire exactly once",
  );
  const analyticsJson = JSON.stringify(analyticsPayloads);
  for (const pii of ["elroy-browser@example.test", "2001-01-15", "test-token"]) {
    assert.equal(analyticsJson.includes(pii), false, `analytics must exclude ${pii}`);
  }
  const href = await page
    .locator('a:has-text("See My Personal Card Blueprint")')
    .getAttribute("href");
  assert.equal(href, "/products/personal-card-blueprint");

  // Successful completion suppresses the launcher after the panel closes.
  await page.click('button[aria-label="Close Elroy"]');
  await page.waitForTimeout(50);
  assert.equal(
    await page.locator('button[aria-label="Open Elroy micro-reading"]').count(),
    0,
  );

  // Joker boundary
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Open Elroy micro-reading"]');
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

  // Narrow mobile viewport keeps the dialog and protected composer reachable.
  await page.click('button[aria-label="Close Elroy"]');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click('button[aria-label="Open Elroy micro-reading"]');
  await page.waitForSelector("#elroy-birthdate");
  const mobileDialogFits = await page.locator("dialog.elroy-panel").evaluate((dialog) => {
    const box = dialog.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth;
  });
  assert.equal(mobileDialogFits, true, "mobile dialog must stay within the viewport");
  await page.fill("#elroy-birthdate", "2001-01-15");
  await page.click('button:has-text("Show my card")');
  await page.click('button:has-text("Get the deeper pattern")');
  const mobileComposerFits = await page.locator(".elroy-composer").evaluate((composer) =>
    composer.scrollWidth <= composer.clientWidth,
  );
  assert.equal(mobileComposerFits, true, "mobile composer must not overflow horizontally");
  const mobileSubmitBox = await page
    .locator('button:has-text("Send my reading")')
    .boundingBox();
  assert.ok(
    mobileSubmitBox &&
      mobileSubmitBox.x >= 0 &&
      mobileSubmitBox.x + mobileSubmitBox.width <= 320 &&
      mobileSubmitBox.y < 640,
    "mobile submit control must remain reachable",
  );

  await browser.close();
  console.log("PASS: elroy browser smoke");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
