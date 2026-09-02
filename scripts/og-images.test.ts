import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import sitemap from "../app/sitemap";
import { allCardSlugs } from "../lib/seo-cards";

const ROOT = join(import.meta.dir, "..");
const APP_DIR = join(ROOT, "app");
const PUBLIC_DIR = join(ROOT, "public");
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type RoutePattern = {
  file: string;
  pattern: string;
  source: string;
  imageTemplates: string[];
};

function walkPageFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkPageFiles(full, acc);
    else if (name === "page.tsx") acc.push(full);
  }
  return acc;
}

function routePatternFromPage(file: string): string {
  const rel = relative(APP_DIR, file).split("\\").join("/");
  const withoutPage = rel.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return withoutPage ? `/${withoutPage}` : "/";
}

function objectBlocksNamed(source: string, key: string): string[] {
  const blocks: string[] = [];
  const re = new RegExp(`${key}\\s*:\\s*\\{`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const start = source.indexOf("{", match.index);
    let depth = 0;
    let end = -1;
    for (let i = start; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) break;
    blocks.push(source.slice(start, end + 1));
    re.lastIndex = end + 1;
  }
  return blocks;
}

function ogImageConsts(source: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of source.matchAll(/const\s+(\w+)\s*=\s*["'](\/og\/[^"']+)["']/g)) {
    map.set(match[1]!, match[2]!);
  }
  for (const match of source.matchAll(
    /const\s+(\w+)\s*=\s*\{[^}]*url\s*:\s*["'](\/og\/[^"']+)["']/g,
  )) {
    map.set(match[1]!, match[2]!);
  }
  return map;
}

function imageTemplatesFromOpenGraph(source: string): string[] {
  const consts = ogImageConsts(source);
  const urls: string[] = [];
  for (const block of objectBlocksNamed(source, "openGraph")) {
    for (const match of block.matchAll(/url\s*:\s*["'](\/og\/[^"']+)["']/g)) {
      urls.push(match[1]!);
    }
    for (const match of block.matchAll(/url\s*:\s*`(\/og\/[^`]+)`/g)) {
      urls.push(match[1]!);
    }
    for (const match of block.matchAll(/url\s*:\s*([A-Za-z_]\w*)/g)) {
      const resolved = consts.get(match[1]!);
      if (resolved) urls.push(resolved);
    }
    for (const match of block.matchAll(/images\s*:\s*\[\s*([A-Za-z_]\w*)/g)) {
      const resolved = consts.get(match[1]!);
      if (resolved) urls.push(resolved);
    }
  }
  return [...new Set(urls)];
}

function loadRoutePatterns(): RoutePattern[] {
  return walkPageFiles(APP_DIR).map((file) => {
    const source = readFileSync(file, "utf8");
    return {
      file,
      pattern: routePatternFromPage(file),
      source,
      imageTemplates: imageTemplatesFromOpenGraph(source),
    };
  });
}

function matchRoute(
  pathname: string,
  pattern: string,
): { params: Record<string, string>; staticHits: number } | null {
  const pathSegs = pathname === "/" ? [] : pathname.split("/").filter(Boolean);
  const patternSegs = pattern === "/" ? [] : pattern.split("/").filter(Boolean);
  if (pathSegs.length !== patternSegs.length) return null;
  const params: Record<string, string> = {};
  let staticHits = 0;
  for (let i = 0; i < pathSegs.length; i++) {
    const seg = patternSegs[i]!;
    if (seg.startsWith("[") && seg.endsWith("]")) {
      params[seg.slice(1, -1)] = pathSegs[i]!;
    } else if (seg === pathSegs[i]) {
      staticHits++;
    } else {
      return null;
    }
  }
  return { params, staticHits };
}

function pageForPath(pathname: string, routes: RoutePattern[]): RoutePattern & {
  params: Record<string, string>;
} {
  let best: (RoutePattern & { params: Record<string, string>; staticHits: number }) | null =
    null;
  for (const route of routes) {
    const hit = matchRoute(pathname, route.pattern);
    if (!hit) continue;
    if (
      !best ||
      hit.staticHits > best.staticHits ||
      (hit.staticHits === best.staticHits &&
        Object.keys(hit.params).length < Object.keys(best.params).length)
    ) {
      best = { ...route, ...hit };
    }
  }
  if (!best) {
    throw new Error(`no app/**/page.tsx matches sitemap path ${pathname}`);
  }
  return best;
}

function resolveOgUrl(template: string, params: Record<string, string>, pathname: string): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const leaf = expr.split(".").pop() ?? "";
    const value = params[leaf];
    if (!value) {
      throw new Error(`${pathname}: cannot resolve ${expr} in ${template}`);
    }
    return value;
  });
}

function publicFileForOgUrl(url: string): string {
  const pathname = url.startsWith("http://") || url.startsWith("https://")
    ? new URL(url).pathname
    : url;
  if (!pathname.startsWith("/")) {
    throw new Error(`og:image must be a root-relative public path: ${url}`);
  }
  return join(PUBLIC_DIR, pathname.slice(1));
}

/** PNG IHDR is the first chunk: 8-byte signature + 4-byte length + "IHDR" + width/height. */
function pngDimensions(file: string): { width: number; height: number } {
  const header = readFileSync(file).subarray(0, 24);
  if (header.length < 24) {
    throw new Error(`${file} is too short to be a PNG`);
  }
  if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${file} is not a PNG`);
  }
  if (header.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${file} is missing an IHDR chunk`);
  }
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

function assertOgPng(url: string, context: string) {
  const file = publicFileForOgUrl(url);
  expect(existsSync(file), `${context}: missing public file for ${url}`).toBe(true);
  const { width, height } = pngDimensions(file);
  expect(width, `${context}: ${url} width`).toBe(OG_WIDTH);
  expect(height, `${context}: ${url} height`).toBe(OG_HEIGHT);
}

function sitemapPathnames(): string[] {
  return sitemap().map((entry) => {
    const pathname = new URL(entry.url).pathname;
    return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  });
}

describe("og image integrity", () => {
  const routes = loadRoutePatterns();
  const pathnames = sitemapPathnames();

  test("reads width and height from the PNG IHDR, not from metadata", () => {
    const sample = join(PUBLIC_DIR, "og/default.png");
    expect(existsSync(sample)).toBe(true);
    expect(pngDimensions(sample)).toEqual({ width: OG_WIDTH, height: OG_HEIGHT });
  });

  test("every sitemap route that sets openGraph.images points at a 1200x630 PNG under public/", () => {
    const checked: string[] = [];
    for (const pathname of pathnames) {
      const page = pageForPath(pathname, routes);
      if (page.source.includes("openGraph") && /images\s*:/.test(page.source)) {
        expect(
          page.imageTemplates.length,
          `${pathname} declares openGraph.images but none were parsed from ${relative(ROOT, page.file)}`,
        ).toBeGreaterThan(0);
      }
      if (page.imageTemplates.length === 0) continue;
      for (const template of page.imageTemplates) {
        const url = resolveOgUrl(template, page.params, pathname);
        expect(url.includes("${"), `${pathname}: unresolved og:image ${url}`).toBe(false);
        assertOgPng(url, pathname);
        checked.push(`${pathname} → ${url}`);
      }
    }
    expect(checked.length, "expected sitemap routes with openGraph.images").toBeGreaterThan(50);
  });

  test("each of the 52 birth-card pages uses its own 1200x630 OG file", () => {
    const slugs = allCardSlugs();
    expect(slugs).toHaveLength(52);
    const listed = new Set(pathnames);
    for (const slug of slugs) {
      const pathname = `/birth-card/${slug}`;
      expect(listed.has(pathname), `${pathname} missing from sitemap`).toBe(true);
      const page = pageForPath(pathname, routes);
      const urls = page.imageTemplates.map((template) =>
        resolveOgUrl(template, page.params, pathname),
      );
      expect(urls, pathname).toContain(`/og/birth-card/${slug}.png`);
      assertOgPng(`/og/birth-card/${slug}.png`, pathname);
    }
  });

  test("the Joker birth-card page uses /og/joker.png", () => {
    expect(pathnames).toContain("/birth-card/joker");
    const page = pageForPath("/birth-card/joker", routes);
    expect(page.imageTemplates).toContain("/og/joker.png");
    assertOgPng("/og/joker.png", "/birth-card/joker");
  });
});
