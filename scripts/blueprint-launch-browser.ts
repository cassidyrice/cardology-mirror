// Public-page browser checks plus an isolated real React form against synthetic HTTP.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
const base = process.env.SEO_BASE_URL || "http://127.0.0.1:3588";
const out = resolve(process.env.LAUNCH_BROWSER_OUT || ".cache/launch-browser");
await mkdir(out, { recursive: true });
await mkdir(".cache", { recursive: true });
await writeFile(".cache/launch-form.tsx", `import React from "react"; import {createRoot} from "react-dom/client"; import {ConsultationRequestForm} from "../components/checkout/ConsultationRequestForm"; createRoot(document.getElementById("root")!).render(<ConsultationRequestForm sessionId="cs_test_browser_fixture"/>);`);
const bundle = await Bun.build({ entrypoints: [".cache/launch-form.tsx"], target: "browser", minify: true, define: { "process.env.NODE_ENV": '"production"' } });
assert.ok(bundle.success, JSON.stringify(bundle.logs));
const js = await bundle.outputs[0].text();
const fixture = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch(req) {
  if (new URL(req.url).pathname === "/form.js") return new Response(js, { headers: { "content-type": "application/javascript" } });
  return new Response('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;margin:24px;max-width:520px}label{display:block;margin:18px 0}input,textarea{display:block;box-sizing:border-box;width:100%;padding:12px;font:inherit}button{padding:12px;font:inherit}[role=alert]{color:#8e321f}</style></head><body><div id="root"></div><script src="/form.js"></script></body></html>', { headers: { "content-type": "text/html" } });
} });
const browser = await chromium.launch({ headless: true });
let checks = 0;
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  for (const path of ["/", "/products/blueprint-report", "/checkout/blueprint-report", "/checkout/blueprint-report-consult", "/my-purchases", "/consultation"]) {
    const response = await page.goto(base + path, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, path); checks++;
    assert.equal(await page.locator("h1").count(), 1, path); checks++;
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path}: mobile overflow`); checks++;
    if (path === "/") {
      assert.ok(await page.getByRole("link", { name: "See the report and both options" }).isVisible());
      assert.ok(await page.getByRole("link", { name: "Read a sample, then ask yours" }).isVisible());
      assert.ok(!(await page.locator("body").innerText()).includes("Written by hand")); checks += 3;
    }
    if (path === "/products/blueprint-report") {
      const data = await page.locator('script[type="application/ld+json"]').allTextContents();
      const prices = data.flatMap(v => { const d = JSON.parse(v); return Array.isArray(d) ? d : [d]; }).filter(v => v["@type"] === "Product").flatMap(v => v.offers.map((o: any) => o.price));
      assert.deepEqual(prices.map(Number).sort((a,b)=>a-b), [129,297]); checks++;
    }
    if (["/my-purchases", "/consultation"].includes(path)) {
      assert.ok((response?.headers()["cache-control"] || "").includes("no-store"));
      assert.equal(response?.headers()["referrer-policy"], "no-referrer");
      assert.equal(await page.locator("textarea").count(), 0); checks += 3;
    }
    await page.screenshot({ path: resolve(out, `${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`), fullPage: true });
  }
  await page.goto(base + "/checkout/blueprint-report?status=unsupported-date", { waitUntil: "domcontentloaded" });
  assert.ok(await page.getByRole("alert").filter({ hasText: "December 31" }).isVisible()); checks++;
  let attempts = 0; const bodies: unknown[] = [];
  await page.route("**/api/consultation", async route => {
    bodies.push(route.request().postDataJSON()); attempts++;
    await route.fulfill({ status: attempts === 1 ? 503 : 200, contentType: "application/json", body: JSON.stringify(attempts === 1 ? {error:"Test service unavailable. Please retry."} : {message:"Your request is received. Cass will contact you to arrange your call."}) });
  });
  await page.goto(`http://127.0.0.1:${fixture.port}`, { waitUntil: "networkidle" });
  await page.getByLabel("What would you like to explore?").fill("How do I deal my yearly boards?");
  await page.getByLabel("Your time zone").fill("America/Denver");
  assert.equal(await page.locator('input[type="email"],input[name="name"]').count(), 0); checks++;
  await page.getByRole("button", { name: "Send my request" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByLabel("What would you like to explore?").inputValue(), "How do I deal my yearly boards?"); checks++;
  await page.screenshot({ path: resolve(out,"form-failed-retry.png"), fullPage: true });
  await page.getByRole("button", { name: "Send my request" }).click();
  await page.getByRole("status").waitFor();
  assert.equal(await page.getByRole("status").innerText(), "Your request is received. Cass will contact you to arrange your call.");
  assert.deepEqual(bodies[0], bodies[1]); assert.equal(attempts, 2); checks += 3;
  await page.screenshot({ path: resolve(out,"form-confirmed.png"), fullPage: true });
  console.log(`PASS: ${checks} browser checks, public pages at ${base}, mobile layout, schema, private-route headers and synthetic React form failure/retry/confirmation.`);
} finally { await browser.close(); fixture.stop(); }
