import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import { loadHolidayPages } from "./load";
import { renderHolidayPage, renderHolidaysHub } from "./render";
import type { HolidayPage } from "./types";
import { HOLIDAYS_HUB_PATH, HOLIDAYS_SITEMAP, holidayPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type HolidaysBuildOptions = {
  holidaysPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type HolidaysBuildResult = {
  outDir: string;
  holidays: HolidayPage[];
  files: string[];
};

export function buildHolidayPages(options: HolidaysBuildOptions = {}): HolidaysBuildResult {
  const holidaysPath = options.holidaysPath ?? join(SEO_ROOT, "data", "holidays.jsonl");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-holidays");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");

  const holidays = loadHolidayPages(holidaysPath);
  if (holidays.length !== 5) {
    throw new Error(`Expected 5 fixed holidays, got ${holidays.length}`);
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  const bySlug = new Map(holidays.map((holiday) => [holiday.slug, holiday]));

  write(outDir, "holidays/index.html", renderHolidaysHub(holidays), files);

  for (const holiday of holidays) {
    write(
      outDir,
      `${holidayPath(holiday.slug).replace(/^\//, "")}/index.html`,
      renderHolidayPage(holiday, bySlug),
      files,
    );
  }

  const paths = [HOLIDAYS_HUB_PATH, ...holidays.map((holiday) => holidayPath(holiday.slug))];
  write(outDir, HOLIDAYS_SITEMAP.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", holidaysRobotsTxt(), files);

  return { outDir, holidays, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function holidaysRobotsTxt(): string {
  return `# Isolated federal-holiday birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /holidays/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-holidays.xml
`;
}

if (import.meta.main) {
  const result = buildHolidayPages();
  console.log(
    `Built ${result.files.length} files for ${result.holidays.length} holidays → ${result.outDir}`,
  );
}
