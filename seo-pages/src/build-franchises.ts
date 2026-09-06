import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadFranchisesJsonl } from "./load-franchises";
import { renderFranchiseHub, renderFranchisePage } from "./render-franchise";
import { renderUrlset } from "./sitemap";
import {
  FRANCHISE_HUB_PATH,
  FRANCHISE_SITEMAP_PATH,
  franchisePath,
} from "./franchise-urls";
import type { Franchise } from "./franchise-types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_JSONL = join(ROOT, "..", "pipeline", "data", "franchises.jsonl");

export type FranchiseBuildOptions = {
  franchisesPath?: string;
  outDir?: string;
  publicDir?: string;
};

export type FranchiseBuildResult = {
  outDir: string;
  franchises: Franchise[];
  files: string[];
};

export function buildFranchisePages(options: FranchiseBuildOptions = {}): FranchiseBuildResult {
  const franchisesPath = options.franchisesPath ?? REPO_JSONL;
  const outDir = options.outDir ?? join(ROOT, "dist-franchise");
  const publicDir = options.publicDir ?? join(ROOT, "public");

  const franchises = loadFranchisesJsonl(franchisesPath);
  const bySlug = new Map(franchises.map((row) => [row.slug, row]));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  write(outDir, "franchise/index.html", renderFranchiseHub(franchises), files);

  for (const franchise of franchises) {
    write(
      outDir,
      `${franchisePath(franchise.slug)}/index.html`,
      renderFranchisePage(franchise, bySlug),
      files,
    );
  }

  const paths = [FRANCHISE_HUB_PATH, ...franchises.map((row) => franchisePath(row.slug))];
  write(outDir, FRANCHISE_SITEMAP_PATH.replace(/^\//, ""), renderUrlset(paths), files);
  write(outDir, "robots.txt", franchiseRobotsTxt(), files);

  return { outDir, franchises, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const normalized = relativePath.replace(/^\/+/, "");
  const target = join(outDir, normalized);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(normalized);
}

function franchiseRobotsTxt(): string {
  return `# Isolated NFL franchise SEO scaffold.
# Do not publish this file as the origin robots.txt on cardblueprints.com.
# Do not deploy this dist. Payment stays on the existing Next.js origin.

User-agent: *
Allow: /franchise/

Disallow: /checkout
Disallow: /checkout/
Disallow: /api/
Disallow: /create-checkout
Disallow: /birth-card/
Disallow: /card/
Disallow: /birthday/

Sitemap: https://cardblueprints.com/sitemap-franchises.xml
`;
}

if (import.meta.main) {
  const result = buildFranchisePages();
  console.log(
    `Built ${result.files.length} files for ${result.franchises.length} franchises → ${result.outDir}`,
  );
}
