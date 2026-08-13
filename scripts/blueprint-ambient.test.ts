import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const routes: Array<[string, string]> = [
  ["app/birth-card-compatibility-calculator/page.tsx", 'variant="compatibility"'],
  ["app/cardology-compatibility/page.tsx", 'variant="compatibilityGuide"'],
  ["app/birth-card-calculator/page.tsx", 'variant="birthCard"'],
  ["app/products/personal-card-blueprint/page.tsx", 'variant="blueprint"'],
  ["app/what-is-cardology/page.tsx", 'variant="method"'],
  ["app/methodology/page.tsx", 'variant="method"'],
  ["app/cardology-for-beginners/page.tsx", 'variant="library"'],
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

test("priority landing pages install the correct ambient variant", () => {
  for (const [path, expected] of routes) {
    const source = read(path);
    expect(source).toContain('import { BlueprintAmbient } from "@/components/brand/BlueprintAmbient"');
    expect(source).toContain(expected);
  }
});

test("ambient visuals remain behind content and ignore pointer input", () => {
  const source = read("components/brand/BlueprintAmbient.tsx");
  expect(source).toContain("pointer-events-none");
  expect(source).toContain("select-none");
  expect(source).toContain("motion-reduce:[animation:none]");
});
