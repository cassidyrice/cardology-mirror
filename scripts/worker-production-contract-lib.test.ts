import { expect, test } from "bun:test";
import {
  indexBlockingDirectives,
  parseRobotsMetaDirectives,
  parseXRobotsTagDirectives,
} from "./worker-production-contract-lib";

test("crawler-specific robots meta can block an otherwise indexable page", () => {
  const directives = parseRobotsMetaDirectives([
    { name: "robots", content: "index, follow" },
    { name: "googlebot", content: "noindex, follow" },
  ]);

  expect(indexBlockingDirectives(directives)).toEqual([
    { source: "meta googlebot", value: "noindex" },
  ]);
});

test("none normalizes to its noindex and nofollow directives", () => {
  const directives = parseRobotsMetaDirectives([
    { name: "robots", content: "none" },
    { name: "description", content: "none" },
  ]);

  expect(directives).toEqual([
    { source: "meta robots", value: "noindex" },
    { source: "meta robots", value: "nofollow" },
  ]);
});

test("a directive parameter named none does not become noindex", () => {
  const directives = parseRobotsMetaDirectives([
    { name: "robots", content: "index, max-image-preview: none" },
  ]);

  expect(indexBlockingDirectives(directives)).toEqual([]);
  expect(directives).toContainEqual({
    source: "meta robots",
    value: "max-image-preview:none",
  });
});

test("crawler-prefixed X-Robots-Tag values expose blocking directives", () => {
  const directives = parseXRobotsTagDirectives([
    "googlebot:noindex, follow",
    "bingbot: none",
  ]);

  expect(indexBlockingDirectives(directives)).toEqual([
    { source: "x-robots-tag googlebot", value: "noindex" },
    { source: "x-robots-tag bingbot", value: "noindex" },
  ]);
});

test("X-Robots-Tag parsing preserves directive values after an agent prefix", () => {
  expect(
    parseXRobotsTagDirectives(
      "Googlebot: max-snippet:-1, index\nBingbot: follow",
    ),
  ).toEqual([
    { source: "x-robots-tag googlebot", value: "max-snippet:-1" },
    { source: "x-robots-tag googlebot", value: "index" },
    { source: "x-robots-tag bingbot", value: "follow" },
  ]);
});
