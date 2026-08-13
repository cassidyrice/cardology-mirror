import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const ambientRoutes: Array<[string, string]> = [
  ["app/birth-card-calculator/page.tsx", 'variant="birthCard"'],
  ["app/products/personal-card-blueprint/page.tsx", 'variant="blueprint"'],
];

const editorialRoutes = [
  "app/what-is-cardology/page.tsx",
  "app/cardology-for-beginners/page.tsx",
  "app/methodology/page.tsx",
  "app/cardology-compatibility/page.tsx",
  "app/birth-card-compatibility-calculator/page.tsx",
];

test("ambient component provides accessible decorative geometry", () => {
  const source = read("components/brand/BlueprintAmbient.tsx");
  const css = read("app/globals.css");
  expect(source).toContain('aria-hidden="true"');
  expect(css).toContain("prefers-reduced-motion");
  expect(source).toContain("blueprint-ambient__orbit");
  expect(source).toContain("blueprint-ambient__plexus");
  expect(source).not.toContain("Math.random");
  expect(source).not.toContain("window.addEventListener");
});

test("ambient component exposes the approved page variants", () => {
  const source = read("components/brand/BlueprintAmbient.tsx");
  for (const variant of ["compatibility", "compatibilityGuide", "birthCard", "blueprint", "method", "library"]) {
    expect(source).toContain(`\"${variant}\"`);
  }
});

test("visual landing pages install the correct ambient variant", () => {
  for (const [path, expected] of ambientRoutes) {
    const source = read(path);
    expect(source).toContain('import { BlueprintAmbient } from "@/components/brand/BlueprintAmbient"');
    expect(source).toContain(expected);
  }
});

test("long-form Learn and Compatibility pages remain clean editorial surfaces", () => {
  for (const path of editorialRoutes) {
    const source = read(path);
    expect(source).not.toContain('import { BlueprintAmbient } from "@/components/brand/BlueprintAmbient"');
    expect(source).not.toContain("<BlueprintAmbient");
  }
});

test("ambient visuals remain behind content and ignore pointer input", () => {
  const source = read("components/brand/BlueprintAmbient.tsx");
  const css = read("app/globals.css");
  expect(source).toContain("pointer-events-none");
  expect(source).toContain("select-none");
  expect(source).toContain("motion-reduce:[animation:none]");
  expect(css).toContain(".blueprint-ambient ~ *");
  expect(css).toContain("z-index: 1");
});

test("ambient plates reuse official homepage journey assets", () => {
  const source = read("components/brand/BlueprintAmbient.tsx");
  expect(source).toContain("/brand/journey/scene-01-poster.png");
  expect(source).toContain("/brand/journey/scene-02-poster.png");
  expect(source).toContain("/brand/journey/scene-03-poster.png");
  expect(source).toContain("/brand/journey/scene-04-poster.png");
  expect(source).toContain("/brand/journey/scene-01.mp4");
  expect(source).toContain("/brand/journey/scene-02.mp4");
  expect(source).toContain("blueprint-ambient__still");
  expect(source).toContain("blueprint-ambient__clip");
  expect(source).toContain("playsInline");
  expect(source).not.toContain("https://");
});
