import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderRobotsTxt, renderUrlset } from "../sitemap";
import type { StatePage } from "./types";
import { loadStatePages } from "./load";
import { renderStatePage, renderStatesHub } from "./render";
import { statePath } from "./urls";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type StateBuildOptions = {
  statesPath?: string;
  outDir?: string;
  publicDir?: string;
  wipe?: boolean;
};

export type StateBuildResult = {
  outDir: string;
  states: StatePage[];
  files: string[];
};

export function buildStatePages(options: StateBuildOptions = {}): StateBuildResult {
  const statesPath = options.statesPath ?? join(ROOT, "data", "states.jsonl");
  const outDir = options.outDir ?? join(ROOT, "dist");
  const publicDir = options.publicDir ?? join(ROOT, "public");
  const wipe = options.wipe ?? true;

  const states = loadStatePages(statesPath);
  if (states.length !== 50) {
    throw new Error(`Expected 50 states, got ${states.length}`);
  }

  if (wipe) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(outDir, { recursive: true });
  cpSync(publicDir, outDir, { recursive: true });

  const files: string[] = [];
  const bySlug = new Map(states.map((state) => [state.slug, state]));

  write(outDir, "states/index.html", renderStatesHub(states), files);

  for (const state of states) {
    write(outDir, `states/${state.slug}/index.html`, renderStatePage(state, bySlug), files);
  }

  write(
    outDir,
    "sitemap-states.xml",
    renderUrlset(["/states", ...states.map((state) => statePath(state.slug))]),
    files,
  );
  write(outDir, "robots.txt", renderRobotsTxt({ allowStates: true }), files);

  return { outDir, states, files };
}

function write(outDir: string, relativePath: string, contents: string, files: string[]): void {
  const target = join(outDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  files.push(relativePath);
}

if (import.meta.main) {
  const result = buildStatePages();
  console.log(`Built ${result.files.length} files for ${result.states.length} states → ${result.outDir}`);
}
