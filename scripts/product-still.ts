/**
 * Render product still shots of the purchased 52xSeven Blueprint.
 *
 *   bun scripts/product-still.ts [birthdate] [--port 3599]
 *
 * Boots the production build with PRODUCT_STILL=1 (which un-404s the internal
 * render harness at /internal/product-still), screenshots the phone at 3x on a
 * transparent background, downsamples to WEB_WIDTH, and writes
 * public/product/52xseven-<screen>.png.
 * Run `bun run build` first. Re-run whenever the app's design changes.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

const SCREENS = ["now", "story"] as const;
const OUT_DIR = join(import.meta.dir, "..", "public", "product");
/** Shipped asset width in px: 2x a ~350px display slot. */
const WEB_WIDTH = 600;
/** Example birthday used for the marketing still. */
const DEFAULT_BIRTHDATE = "1991-02-17";

const args = process.argv.slice(2);
const birthdate = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? DEFAULT_BIRTHDATE;
const portArg = args.indexOf("--port");
const port = portArg >= 0 ? Number(args[portArg + 1]) : 3599;
const base = `http://127.0.0.1:${port}`;

mkdirSync(OUT_DIR, { recursive: true });

const server = spawn("npx", ["next", "start", "-p", String(port)], {
  cwd: join(import.meta.dir, ".."),
  env: { ...process.env, PRODUCT_STILL: "1" },
  stdio: "ignore",
});

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 404) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not start on ${base}`);
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 1100 },
    deviceScaleFactor: 3,
  });
  // Freeze the fade-in so every shot is fully opaque.
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const screen of SCREENS) {
    const url = `${base}/internal/product-still?birthdate=${birthdate}&screen=${screen}`;
    const res = await page.goto(url, { waitUntil: "networkidle" });
    if (res?.status() !== 200) {
      throw new Error(`${url} returned ${res?.status()}`);
    }
    const stage = page.locator("#still-stage");
    await stage.waitFor();
    // Tight crop: the device only. The shadow is applied in CSS at render time.
    await stage.evaluate((el) => {
      (el as HTMLElement).style.padding = "0";
    });
    const file = join(OUT_DIR, `52xseven-${screen}.png`);
    await stage.screenshot({ path: file, omitBackground: true });
    // Downsample the 3x master to the shipped size (macOS sips; skipped elsewhere).
    const resized = spawnSync("sips", ["--resampleWidth", String(WEB_WIDTH), file, "--out", file], {
      stdio: "ignore",
    });
    if (resized.error || resized.status !== 0) {
      console.warn(`  (sips unavailable — ${file} left at 3x)`);
    }
    console.log(`wrote ${file}`);
  }

  await browser.close();
} finally {
  server.kill();
}
