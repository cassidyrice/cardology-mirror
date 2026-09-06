import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "../types";
import { renderUrlset } from "../sitemap";
import type { ParkPage } from "./types";
import { loadParkPages } from "./load";
import { renderParkPage, renderParksHub } from "./render";
import { PARKS_HUB_PATH, PARKS_SITEMAP_PATH, parkPath } from "./urls";

const SEO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type ParkBuildOptions = {
  parksPath?: string;
  outDir?: string;
  publicDir?: string;
  wipe?: boolean;
};

export type ParkBuildResult = {
  outDir: string;
  parks: ParkPage[];
  files: string[];
};

export function buildParkPages(options: ParkBuildOptions = {}): ParkBuildResult {
  const parksPath = options.parksPath ?? join(SEO_ROOT, "data", "parks.jsonl");
  const outDir = options.outDir ?? join(SEO_ROOT, "dist-parks");
  const publicDir = options.publicDir ?? join(SEO_ROOT, "public");
  const wipe = options.wipe ?? true;

  const parks = loadParkPages(parksPath);
  if (parks.length !== 63) {
    throw new Error(`Expected 63 parks, got ${parks.length}`);
  }

  if (wipe) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  const bySlug = new Map(parks.map((park) => [park.slug, park]));

  write(outDir, "parks/index.html", renderParksHub(parks), files);

  for (const park of parks) {
    write(outDir, `parks/${park.slug}/index.html`, renderParkPage(park, bySlug), files);
  }

  write(
    outDir,
    PARKS_SITEMAP_PATH.replace(/^\//, ""),
    renderUrlset([PARKS_HUB_PATH, ...parks.map((park) => parkPath(park.slug))]),
    files,
  );
  write(outDir, "robots.txt", parksRobotsTxt(), files);

  return { outDir, parks, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

function parksRobotsTxt(): string {
  return `# Isolated National Park birth-card scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.

User-agent: *
Allow: /parks/

# Celebrity person pages and live card-meaning routes stay on their owners.
# Payment and app surfaces stay on the existing Next.js origin.
Disallow: /birth-card/
Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout

Sitemap: ${SITE_URL}/sitemap-parks.xml
`;
}

if (import.meta.main) {
  const result = buildParkPages();
  console.log(`Built ${result.files.length} files for ${result.parks.length} parks → ${result.outDir}`);
}
