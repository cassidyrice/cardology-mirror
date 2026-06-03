import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, "shots");
const BASE = "http://localhost:3577";

const PROFILE = {
  name: "Cass",
  birthdate: "1991-02-17",
  createdAt: new Date().toISOString(),
};

// Routes that should render with a seeded profile.
const ROUTES = ["/", "/today", "/self", "/timing", "/bonds", "/journal", "/reading"];

function shotPath(route) {
  const name = route === "/" ? "root" : route.replace(/^\//, "").replace(/\//g, "_");
  return path.join(SHOTS, `${name}.png`);
}

/** Attach console/pageerror collectors to a page. */
function watch(page) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err?.message ?? err)));
  return { consoleErrors, pageErrors };
}

async function seedProfile(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((p) => {
    localStorage.setItem("cardology.profile", JSON.stringify(p));
  }, PROFILE);
}

async function clearProfile(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
}

const results = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // ---- Onboarding: must NOT redirect (no profile) ----
  {
    const page = await context.newPage();
    const w = watch(page);
    try {
      await clearProfile(page);
      await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const stillOnboarding = page.url().includes("/onboarding");
      const bodyText = await page.locator("body").innerText();
      await page.screenshot({ path: shotPath("/onboarding"), fullPage: true });
      results.push({
        route: "/onboarding",
        ok: stillOnboarding && bodyText.length > 20,
        note: stillOnboarding ? "" : "redirected away (should stay)",
        consoleErrors: w.consoleErrors,
        pageErrors: w.pageErrors,
      });
    } catch (e) {
      results.push({ route: "/onboarding", ok: false, note: String(e.message), consoleErrors: w.consoleErrors, pageErrors: w.pageErrors });
    }
    await page.close();
  }

  // ---- Each seeded route ----
  for (const route of ROUTES) {
    const page = await context.newPage();
    const w = watch(page);
    try {
      await seedProfile(page);
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });

      if (route === "/") {
        // splash redirects to /today after ~900ms
        await page.waitForTimeout(1600);
        const redirected = page.url().includes("/today");
        await page.screenshot({ path: shotPath("/"), fullPage: true });
        results.push({
          route: "/",
          ok: redirected,
          note: redirected ? "redirected to /today" : `no redirect (url=${page.url()})`,
          consoleErrors: w.consoleErrors,
          pageErrors: w.pageErrors,
        });
        await page.close();
        continue;
      }

      if (route === "/reading") {
        // Wait for streamed prose to appear.
        let proseLen = 0;
        const deadline = Date.now() + 25000;
        while (Date.now() < deadline) {
          proseLen = await page.evaluate(() => {
            const art = document.querySelector("article");
            return art ? art.innerText.trim().length : 0;
          });
          if (proseLen > 80) break;
          await page.waitForTimeout(800);
        }
        await page.screenshot({ path: shotPath("/reading"), fullPage: true });
        results.push({
          route: "/reading",
          ok: proseLen > 80,
          note: `streamed ${proseLen} chars`,
          consoleErrors: w.consoleErrors,
          pageErrors: w.pageErrors,
        });
        await page.close();
        continue;
      }

      if (route === "/bonds") {
        // Person A is seeded from profile; fill Person B + compare.
        const dateInputs = page.locator('input[type="date"]');
        await dateInputs.nth(1).fill("1985-07-04");
        await page.getByText("Compare patterns").click();
        // wait for result observations
        let ok = false;
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          ok = await page.evaluate(() =>
            /How your patterns meet/i.test(document.body.innerText));
          if (ok) break;
          await page.waitForTimeout(500);
        }
        await page.waitForTimeout(600);
        await page.screenshot({ path: shotPath("/bonds"), fullPage: true });
        results.push({
          route: "/bonds",
          ok,
          note: ok ? "compare rendered result" : "no comparison result",
          consoleErrors: w.consoleErrors,
          pageErrors: w.pageErrors,
        });
        await page.close();
        continue;
      }

      if (route === "/journal") {
        // wait for prompts to load
        await page.waitForTimeout(2000);
        // click first prompt (Prompts render as buttons/cards)
        const promptBtn = page.locator("section button, [role=button]").first();
        let entryOk = false;
        try {
          // Find a prompt card to open the writing sheet.
          await page.locator('text=/Tap one to write/i').waitFor({ timeout: 5000 });
          // The Prompts component renders selectable cards; click the first clickable in that section.
          const clickable = page.locator("button").filter({ hasNotText: "Try again" });
          // Open writing sheet by clicking a prompt card
          const prompts = page.locator('[data-prompt], button');
          // Try: click element containing a question via the prompts list
          await page.evaluate(() => {
            // click first prompt button inside the prompts section if identifiable
          });
          // Click first prompt: prompts are buttons after the "Tap one to write" hint
          const allButtons = await page.locator("button").all();
          for (const b of allButtons) {
            const t = (await b.innerText()).trim();
            if (t && !/try again|done|edit|delete|keep|cancel|save/i.test(t) && t.length > 15) {
              await b.click();
              break;
            }
          }
          await page.waitForTimeout(600);
          const ta = page.locator("textarea");
          await ta.first().fill("QA test entry — sitting with the reflection honestly.");
          // click Save
          await page.getByRole("button", { name: /^save$/i }).click();
          await page.waitForTimeout(800);
          entryOk = await page.evaluate(() =>
            /QA test entry/i.test(document.body.innerText));
        } catch (e) {
          // capture but continue
        }
        await page.screenshot({ path: shotPath("/journal"), fullPage: true });
        results.push({
          route: "/journal",
          ok: entryOk,
          note: entryOk ? "entry saved + visible" : "entry not saved/visible",
          consoleErrors: w.consoleErrors,
          pageErrors: w.pageErrors,
        });
        await page.close();
        continue;
      }

      // Generic seeded route (today, self, timing): wait for an h1.
      await page.waitForSelector("h1", { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const h1 = await page.evaluate(() => {
        const el = document.querySelector("h1");
        return el ? el.innerText.trim() : "";
      });
      await page.screenshot({ path: shotPath(route), fullPage: true });
      results.push({
        route,
        ok: h1.length > 0,
        note: h1 ? `h1="${h1.slice(0, 40)}"` : "no h1 rendered",
        consoleErrors: w.consoleErrors,
        pageErrors: w.pageErrors,
      });
    } catch (e) {
      await page.screenshot({ path: shotPath(route), fullPage: true }).catch(() => {});
      results.push({ route, ok: false, note: String(e.message), consoleErrors: w.consoleErrors, pageErrors: w.pageErrors });
    }
    await page.close();
  }

  await browser.close();

  // ---- Summary ----
  console.log("\n========== QA SMOKE SUMMARY ==========");
  for (const r of results) {
    const status = r.ok ? "OK " : "FAIL";
    console.log(`\n[${status}] ${r.route}  ${r.note ? "— " + r.note : ""}`);
    if (r.consoleErrors.length) {
      console.log(`   console errors (${r.consoleErrors.length}):`);
      r.consoleErrors.forEach((e) => console.log(`     · ${e.replace(/\s+/g, " ").slice(0, 200)}`));
    }
    if (r.pageErrors.length) {
      console.log(`   pageerrors (${r.pageErrors.length}):`);
      r.pageErrors.forEach((e) => console.log(`     · ${e.replace(/\s+/g, " ").slice(0, 200)}`));
    }
  }
  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n======================================`);
  console.log(`${results.length - fails}/${results.length} routes OK, ${fails} fail`);
  console.log(`Screenshots in: ${SHOTS}`);
}

run().catch((e) => {
  console.error("QA RUNNER CRASHED:", e);
  process.exit(1);
});
