import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".vercel") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts|css)$/.test(name)) acc.push(full);
  }
  return acc;
}

test("wide tables sit in a labeled, tabbable TableScroll region", () => {
  const wrapper = readFileSync(join(root, "components/seo/TableScroll.tsx"), "utf8");
  expect(wrapper).toContain("tabIndex={0}");
  expect(wrapper).toContain('role="region"');
  expect(wrapper).toContain("aria-label={label}");
  expect(wrapper).toContain("table-scroll");

  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  expect(css).toContain(".table-scroll:focus-visible");

  const pages = [
    "app/birth-card-calculator/page.tsx",
    "app/cardology-vs-tarot/page.tsx",
    "app/cartomancy-vs-tarot/page.tsx",
    "app/destiny-cards/page.tsx",
    "components/products/ProductComparison.tsx",
  ];
  for (const rel of pages) {
    const src = readFileSync(join(root, rel), "utf8");
    expect(src, rel).toContain("TableScroll");
    expect(src, rel).toContain("<caption");
    expect(src, rel).toContain('scope="col"');
  }
});

test("app and components do not leave raw overflow-x-auto table wrappers", () => {
  const leftovers = walk(join(root, "app"))
    .concat(walk(join(root, "components")))
    .filter((file) => !file.endsWith("TableScroll.tsx"))
    .flatMap((file) => {
      const src = readFileSync(file, "utf8");
      if (!src.includes("overflow-x-auto")) return [];
      return [`${file} still has overflow-x-auto`];
    });
  expect(leftovers).toEqual([]);
});
