// Run against a local server with the calculator's embedded checkout flag enabled.
import assert from "node:assert/strict";
import { chromium, type Locator } from "playwright";

const origin = new URL(process.env.CHECKOUT_QA_ORIGIN ?? "http://127.0.0.1:3841").origin;
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname), "local test servers only");

const stripeStub = `
  window.Stripe = function (key) {
    if (key !== "pk_test_browser_qa") throw Error("Unexpected publishable key");
    return { async createEmbeddedCheckoutPage({clientSecret, onComplete}) {
      if (clientSecret !== "cs_test_browser_qa_secret") throw Error("Unexpected client secret");
      const button = document.createElement("button");
      button.textContent = "Simulate payment completion (local mock)";
      button.onclick = () => onComplete();
      return {
        mount(container) { container.append(button); },
        destroy() {
          button.remove();
          document.body.dataset.checkoutDestroys = String(Number(document.body.dataset.checkoutDestroys || 0) + 1);
        }
      };
    }};
  }; `;

async function assertInViewport(locator: Locator) {
  await locator.page().waitForFunction(el => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
  }, await locator.elementHandle(), {timeout: 3000});
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE_PATH });
try {
  for (const viewport of [{width: 375, height: 667}, {width: 1440, height: 900}]) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const page = await context.newPage();
    const bodies: { month: number; day: number; attemptId: string }[] = [];
    const stripeRequests: string[] = [];
    const errors: string[] = [];
    let failNext = false;
    page.on("pageerror", e => errors.push(e.message));
    await context.route("**/*", async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname.endsWith(".stripe.com") || url.hostname === "stripe.com") {
        stripeRequests.push(url.href);
        if (url.hostname === "js.stripe.com" && request.resourceType() === "script") {
          return route.fulfill({contentType: "application/javascript", body: stripeStub});
        }
        return route.abort();
      }
      if (url.origin !== origin) return route.abort();
      if (url.pathname === "/api/checkout/birth-card-blueprint") {
        assert.equal(request.method(), "POST");
        assert.equal(url.search, "");
        bodies.push(request.postDataJSON());
        if (failNext) {
          failNext = false;
          return route.fulfill({status: 503, json: {error: "Mock checkout unavailable"}});
        }
        return route.fulfill({json: {clientSecret: "cs_test_browser_qa_secret", publishableKey: "pk_test_browser_qa"}});
      }
      // Never forward unrecognized checkout requests or analytics calls to a real handler.
      if (url.pathname.startsWith("/api/") || request.method() !== "GET") return route.fulfill({status: 204});
      return route.continue();
    });

    try {
      await page.goto(origin + "/birth-card-calculator", {waitUntil: "networkidle"});
      const birthday = page.getByLabel("Enter your birthday");
      const show = page.getByRole("button", {name: "Show me my birth card"});
      const purchase = page.getByRole("button", {name: "Get my Birth Card Blueprint · $13", exact: true});
      const mockPayment = page.getByRole("button", {name: "Simulate payment completion (local mock)"});
      await birthday.fill("1990-01-15");
      await show.click();
      await purchase.waitFor();
      const card = page.getByRole("heading", {name: "Queen of Diamonds", exact: true});
      // No artificial scrolling to the offer: inspect where the result actually landed.
      await assertInViewport(card);
      await assertInViewport(purchase);
      const offerBox = await purchase.boundingBox();
      assert.ok(offerBox);
      console.log(`$13 CTA spans y=${Math.round(offerBox.y)}–${Math.round(offerBox.y + offerBox.height)} in the ${viewport.width}×${viewport.height} viewport`);
      assert.deepEqual(bodies, []);
      assert.deepEqual(stripeRequests, []);
      if (viewport.width === 375 && process.env.CHECKOUT_QA_RESULT_SCREENSHOT) {
        await page.screenshot({
          path: process.env.CHECKOUT_QA_RESULT_SCREENSHOT,
          animations: "disabled",
          style: "nextjs-portal {visibility: hidden}", // Omit the local Next.js developer badge.
        });
      }

      await purchase.click();
      await mockPayment.waitFor();
      assert.equal(bodies.length, 1);
      assert.equal(stripeRequests.length, 1);
      const first = bodies[0];
      assert.deepEqual(Object.keys(first).sort(), ["attemptId", "day", "month"]);
      assert.deepEqual([first.month, first.day], [1, 15]);
      assert.match(first.attemptId, /^[0-9a-f-]{36}$/i);
      assert.equal(new URL(page.url()).pathname, "/birth-card-calculator");

      await page.getByRole("button", {name: "Wrong birthday? Change it"}).click();
      await mockPayment.waitFor({state: "detached"});
      assert.equal(await page.locator("body").getAttribute("data-checkout-destroys"), "1");
      await birthday.fill("1991-02-17");
      await show.click();
      await purchase.waitFor();
      assert.equal(bodies.length, 1);
      failNext = true;
      await purchase.click();
      await page.getByRole("button", {name: "Try checkout again"}).click();
      await mockPayment.waitFor();
      assert.equal(bodies.length, 3);
      const retry = bodies[1];
      assert.deepEqual(Object.keys(retry).sort(), ["attemptId", "day", "month"]);
      assert.deepEqual([retry.month, retry.day], [2, 17]);
      assert.notEqual(retry.attemptId, first.attemptId);
      assert.deepEqual(bodies[2], retry, "retry reuses the same purchase attempt");
      await mockPayment.click();
      await page.getByText("Checkout complete", {exact: true}).waitFor();
      assert.equal(page.url(), origin + "/birth-card-calculator");
      assert.deepEqual(errors, []);
      console.log(`PASS ${viewport.width}×${viewport.height}: visible result and offer, lazy checkout, minimum private payload, reset, retry, inline completion (mock Stripe)`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
