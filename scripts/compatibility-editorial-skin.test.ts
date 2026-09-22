import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { recolorCompatibilityEditorialSkin } from "../lib/compatibility-editorial-skin";

const liveSkin = readFileSync(
  join(import.meta.dir, "fixtures", "compatibility-live-editorial-skin.css"),
  "utf8",
);

const liveHtml = `<meta name="theme-color" content="#f6f1e8">\n<style>${liveSkin}</style>`;

test("compatibility editorial skin moves cream oxblood chrome onto the blue brand", () => {
  const next = recolorCompatibilityEditorialSkin(liveHtml);

  expect(next).toContain(
    "/* Current Card Blueprints cyanotype editorial skin. Keep this override last. */",
  );
  expect(next).not.toContain("cream editorial skin");
  expect(next).toContain('<meta name="theme-color" content="#eef3f8">');

  const skin = next.slice(next.indexOf("/* Current Card Blueprints cyanotype"));
  expect(skin).toContain("body{background:#eef3f8;color:#123a63;");
  expect(skin).toContain("a{color:#0c4275;");
  expect(skin).toContain("background:#123a63;color:#e8f1fa");
  expect(skin).toContain(".btn:hover{color:#e8f1fa;background:#0a3159");
  expect(skin).toContain(".kicker{color:#735624}");
  expect(skin).toContain("rgba(18,58,99,");
  expect(skin).toContain("rgba(12,66,117,.45)");

  // Playing-card pips stay red and black. Chrome oxblood does not.
  expect(skin.match(/#8e321f/g)).toEqual(["#8e321f"]);
  expect(skin).toContain(".rs{color:#8e321f}");
  expect(skin.match(/#14110d/g)).toEqual(["#14110d"]);
  expect(skin).toContain(".bs{color:#14110d}");

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
    expect(skin).not.toContain(leftover);
  }

  const livePreamble = liveSkin.slice(0, liveSkin.indexOf("/* Current Card Blueprints"));
  const nextPreamble = next.slice(
    next.indexOf("<style>") + "<style>".length,
    next.indexOf("/* Current Card Blueprints"),
  );
  expect(nextPreamble).toBe(livePreamble);
  expect(recolorCompatibilityEditorialSkin(next)).toBe(next);
});
