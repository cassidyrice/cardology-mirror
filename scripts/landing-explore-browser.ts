import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE = "http://127.0.0.1:3599";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const report: string[] = [];

async function noHScroll(label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  const ok = overflow.scrollWidth <= overflow.clientWidth + 1;
  report.push(
    `${label}: h-scroll ${ok ? "ok" : "FAIL"} (${overflow.scrollWidth}/${overflow.clientWidth})`,
  );
  return ok;
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const field = page.locator("#home-birthdate");
const button = page.getByRole("button", { name: /Show my card/i });
await field.waitFor({ state: "visible" });
await button.waitFor({ state: "visible" });

const fieldBox = await field.boundingBox();
const buttonBox = await button.boundingBox();
report.push(
  `/: field in first screen: ${Boolean(fieldBox && fieldBox.y + fieldBox.height < 844)} (y=${fieldBox?.y?.toFixed(0)})`,
);
report.push(
  `/: button in first screen: ${Boolean(buttonBox && buttonBox.y + buttonBox.height < 844)} (y=${buttonBox?.y?.toFixed(0)})`,
);
await noHScroll("/");
await page.screenshot({ path: "/tmp/cursor-F2-home-390.png", fullPage: false });

const cue = page.locator("[data-home-cue]");
await cue.waitFor({ state: "visible" });
const cueBox = await cue.boundingBox();
const cueInTwoScreens = Boolean(cueBox && cueBox.y < 844 * 2);
report.push(
  `/: cue block visible within two screens: ${cueInTwoScreens} (y=${cueBox?.y?.toFixed(0)}, h=${cueBox?.height?.toFixed(0)})`,
);
await page.screenshot({ path: "/tmp/cursor-F2-home-cue-390.png", fullPage: true });
await noHScroll("/ with cue");

await field.fill("1988-02-20");
await button.click();
await page.waitForSelector("[data-reveal]", { timeout: 10000 });
const revealText = await page.locator("[data-reveal]").innerText();
report.push(
  `/: reveal after 1988-02-20: ${/5 of Diamonds|strength|trips/i.test(revealText) ? "ok" : "check"}`,
);
report.push(`/: reveal snippet: ${revealText.slice(0, 200).replace(/\n/g, " | ")}`);
await page.screenshot({ path: "/tmp/cursor-S1b-home-reveal-390.png", fullPage: false });
await noHScroll("/ reveal");

await page.goto(`${BASE}/explore`, { waitUntil: "networkidle" });
await page.waitForSelector("h1");
report.push(`/explore h1: ${await page.locator("h1").innerText()}`);
await noHScroll("/explore");
await page.screenshot({ path: "/tmp/cursor-S1b-explore-390.png", fullPage: false });

await browser.close();
writeFileSync("/tmp/cursor-S1b-playwright.txt", `${report.join("\n")}\n`);
console.log(report.join("\n"));
