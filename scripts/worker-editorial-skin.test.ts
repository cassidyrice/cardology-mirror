import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WORKER_EDITORIAL_ROUTES,
  WORKER_THEME_COLOR,
  recolorWorkerEditorialSkin,
} from "../lib/worker-editorial-skin";

const fixtureDir = join(import.meta.dir, "fixtures");
const liveSkin = readFileSync(join(fixtureDir, "worker-editorial-skin.live.css"), "utf8");
const appliedSkin = readFileSync(join(fixtureDir, "worker-editorial-skin.css"), "utf8");

// Captured 2026-09-22. Identical bytes on every route in WORKER_EDITORIAL_ROUTES.
const LIVE_SKIN_SHA256 = "f7a4056c2472e2c615beccbf5e0f7d5392319c02a404b563c834a84f61951016";

test("born-on is the primary tree on the shared worker skin", () => {
  expect(WORKER_EDITORIAL_ROUTES.slice(0, 3)).toEqual([
    "/born-on/",
    "/born-on/may-2",
    "/born-on/december-31",
  ]);
  expect(WORKER_EDITORIAL_ROUTES).toContain("/compatibility/");
  expect(WORKER_EDITORIAL_ROUTES).toContain(
    "/compatibility/ace-of-hearts-and-queen-of-diamonds",
  );
  expect(createHash("sha256").update(liveSkin).digest("hex")).toBe(LIVE_SKIN_SHA256);
});

test("applied worker skin is the blue brand the next unlock deploy inlines", () => {
  expect(appliedSkin).toBe(recolorWorkerEditorialSkin(liveSkin));
  expect(appliedSkin).toContain(
    "/* Current Card Blueprints cyanotype editorial skin. Keep this override last. */",
  );
  expect(appliedSkin).not.toContain("cream editorial skin");
  expect(appliedSkin).toContain("body{background:#eef3f8;color:#123a63;");
  expect(appliedSkin).toContain("a{color:#0c4275;");
  expect(appliedSkin).toContain("background:#123a63;color:#e8f1fa");
  expect(appliedSkin).toContain(".btn:hover{color:#e8f1fa;background:#0a3159");
  expect(appliedSkin).toContain(".kicker{color:#735624}");
  expect(appliedSkin).toContain("rgba(18,58,99,");
  expect(appliedSkin).toContain("rgba(12,66,117,.45)");
  expect(appliedSkin.match(/#8e321f/g)).toEqual(["#8e321f"]);
  expect(appliedSkin).toContain(".rs{color:#8e321f}");
  expect(appliedSkin.match(/#14110d/g)).toEqual(["#14110d"]);
  expect(appliedSkin).toContain(".bs{color:#14110d}");

  for (const leftover of [
    "#f6f1e8",
    "#6f2618",
    "#fffcf7",
    "#fbf8f2",
    "#efe8dc",
    "#756c61",
    "#5b5148",
    "#2a241c",
    "rgba(20,17,13,",
    "rgba(142,50,31,",
    "rgba(246,241,232,",
    "rgba(255,252,247,",
  ]) {
    expect(appliedSkin).not.toContain(leftover);
  }
});

test("theme-color on born-on and compatibility moves to paper", () => {
  const liveHtml = `<meta name="theme-color" content="#f6f1e8">\n<style>${liveSkin}</style>`;
  const next = recolorWorkerEditorialSkin(liveHtml);
  expect(next).toContain(`<meta name="theme-color" content="${WORKER_THEME_COLOR}">`);
  expect(WORKER_THEME_COLOR).toBe("#eef3f8");
  expect(recolorWorkerEditorialSkin(next)).toBe(next);
});
