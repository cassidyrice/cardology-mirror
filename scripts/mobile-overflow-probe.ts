/**
 * Mobile horizontal overflow probe — every sitemap URL at 390×844.
 *
 * SEO_BASE_URL=http://127.0.0.1:3577 bun scripts/mobile-overflow-probe.ts
 */
import { chromium, type Page } from "playwright";

import sitemap from "../app/sitemap";

const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;
const base = (process.env.SEO_BASE_URL || "http://127.0.0.1:3577").replace(
  /\/$/,
  "",
);

function sitemapPathnames(): string[] {
  return sitemap()
    .map((entry) => {
      const pathname = new URL(entry.url).pathname;
      return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    })
    .filter(
      (pathname) =>
        !pathname.startsWith("/checkout") && !pathname.startsWith("/api"),
    );
}

type OverflowResult = {
  path: string;
  scrollWidth: number;
  status: number | null;
};

async function measureOverflow(page: Page, path: string): Promise<OverflowResult> {
  const response = await page.goto(`${base}${path}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");

  const scrollWidth = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth;
  });

  return {
    path,
    scrollWidth,
    status: response?.status() ?? null,
  };
}

async function main(): Promise<void> {
  const paths = sitemapPathnames();
  const overflows: OverflowResult[] = [];

  console.log(
    `Probing ${paths.length} sitemap URLs at ${VIEWPORT_WIDTH}×${VIEWPORT_HEIGHT} (${base})…`,
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
  });

  try {
    for (const path of paths) {
      const result = await measureOverflow(page, path);
      if (result.status !== 200) {
        console.warn(`WARN ${path}: HTTP ${result.status ?? "no response"}`);
      }
      if (result.scrollWidth > VIEWPORT_WIDTH) {
        overflows.push(result);
        console.log(`OVERFLOW ${path}: scrollWidth=${result.scrollWidth}`);
      } else {
        process.stdout.write(".");
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\n");
  if (overflows.length === 0) {
    console.log("No horizontal overflow at 390px.");
  } else {
    console.log(`${overflows.length} page(s) overflow:`);
    for (const row of overflows) {
      console.log(`  ${row.path}  scrollWidth=${row.scrollWidth}`);
    }
  }

  process.exit(overflows.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
