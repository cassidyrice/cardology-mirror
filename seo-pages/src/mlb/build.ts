import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadMlbJsonl } from "./load";
import { renderMlbHub, renderMlbPage } from "./render";
import { renderUrlset } from "../sitemap";
import { MLB_HUB_PATH, MLB_SITEMAP_PATH, mlbPath } from "./urls";
import type { MlbClub } from "./types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_JSONL = join(ROOT, "..", "pipeline", "data", "mlb.jsonl");

export type MlbBuildOptions = {
  mlbPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type MlbBuildResult = {
  outDir: string;
  clubs: MlbClub[];
  files: string[];
};

export function buildMlbPages(options: MlbBuildOptions = {}): MlbBuildResult {
  const mlbPathToJsonl = options.mlbPath ?? REPO_JSONL;
  const outDir = options.outDir ?? join(ROOT, "dist-mlb");
  const publicDir = options.publicDir ?? join(ROOT, "public");

  const clubs = loadMlbJsonl(mlbPathToJsonl);
  const bySlug = new Map(clubs.map((row) => [row.slug, row]));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  write(outDir, "mlb/index.html", renderMlbHub(clubs), files);

  for (const club of clubs) {
    write(outDir, `${mlbPath(club.slug)}/index.html`, renderMlbPage(club, bySlug), files);
  }

  const paths = [MLB_HUB_PATH, ...clubs.map((row) => mlbPath(row.slug))];
  write(outDir, MLB_SITEMAP_PATH.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", mlbRobotsTxt(), files);

  return { outDir, clubs, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const normalized = relativePath.replace(/^\/+/, "");
  const target = join(outDir, normalized);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(normalized);
}

function mlbRobotsTxt(): string {
  return `# Isolated MLB first-game SEO scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.
# Do not deploy this dist. Payment stays on the existing Next.js origin.

User-agent: *
Allow: /mlb/

Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout
Disallow: /birth-card/
Disallow: /card/
Disallow: /birthday/

Sitemap: https://cardblueprints.com/sitemap-mlb.xml
`;
}

if (import.meta.main) {
  const result = buildMlbPages();
  console.log(`Built ${result.files.length} files for ${result.clubs.length} MLB clubs → ${result.outDir}`);
}
