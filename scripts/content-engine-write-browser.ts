import { chromium } from "playwright";
import { writeFileSync } from "fs";

import { STUB_SESSION_ID } from "../lib/content-engine/fixture-session";

const BASE = process.env.CONTENT_ENGINE_TEST_BASE || "http://127.0.0.1:3599";
const report: string[] = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(
  `${BASE}/checkout/success?session_id=${STUB_SESSION_ID}`,
  { waitUntil: "networkidle" },
);

const day1 = page.locator("[data-calendar-day='1']");
await day1.waitFor({ state: "visible", timeout: 15000 });
report.push("/checkout/success fixture: day 1 row visible");

const writeBtn = day1.getByRole("button", { name: /Write this/i });
await writeBtn.click();
await page.waitForSelector("[data-calendar-day='1'] pre", { timeout: 15000 });
const pieceText = await day1.locator("pre").innerText();
const ok = /Sharing the good stuff|croissants|sourdough/i.test(pieceText);
report.push(`/checkout/success fixture: piece rendered after Write: ${ok ? "ok" : "FAIL"}`);
report.push(`snippet: ${pieceText.slice(0, 120).replace(/\n/g, " ")}`);

await browser.close();
writeFileSync("/tmp/cursor-E4-write-playwright.txt", `${report.join("\n")}\n`);
console.log(report.join("\n"));
if (!ok) process.exit(1);
