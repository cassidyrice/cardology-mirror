import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SeoShell } from "@/components/seo/SeoShell";
import {
  buildBreadcrumbJsonLd,
  type BreadcrumbListJsonLd,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

const root = join(import.meta.dir, "..");

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

test("builds a trimmed three-item same-origin BreadcrumbList", () => {
  const expected: BreadcrumbListJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Birth Cards",
        item: `${SITE_URL}/birth-card`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Q Hearts",
        item: `${SITE_URL}/birth-card/queen-of-hearts`,
      },
    ],
  };

  expect(
    buildBreadcrumbJsonLd([
      { name: " Home ", href: " / " },
      { name: " Birth Cards ", href: " /birth-card " },
      {
        name: " Q Hearts ",
        href: ` ${SITE_URL}/birth-card/queen-of-hearts `,
      },
    ]),
  ).toEqual(expected);
});

test("omits BreadcrumbList data for trails shorter than two items", () => {
  expect(buildBreadcrumbJsonLd([])).toBeNull();
  expect(buildBreadcrumbJsonLd([{ name: "Home", href: "/" }])).toBeNull();
});

test("rejects an empty breadcrumb name", () => {
  expect(() =>
    buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "   ", href: "/birth-card" },
    ]),
  ).toThrow(/name/i);
});

test("rejects an empty breadcrumb href", () => {
  expect(() =>
    buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Birth Cards", href: "   " },
    ]),
  ).toThrow(/href/i);
});

test("rejects external and non-web breadcrumb hrefs", () => {
  for (const href of [
    "https://example.com/birth-card",
    `//${new URL(SITE_URL).host}/birth-card`,
    "mailto:hello@cardblueprints.com",
  ]) {
    expect(() =>
      buildBreadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Birth Cards", href },
      ]),
    ).toThrow(/same-origin/i);
  }
});

test("SeoShell renders one visible and one machine-readable breadcrumb trail", () => {
  const markup = renderToStaticMarkup(
    createElement(
      SeoShell,
      {
        crumb: [
          { label: "Home", href: "/" },
          { label: "Birth Cards", href: "/birth-card" },
          { label: "Q Hearts", href: "/birth-card/queen-of-hearts" },
        ],
      },
      createElement("p", null, "Card meaning"),
    ),
  );

  expect(occurrences(markup, 'aria-label="Breadcrumb"')).toBe(1);
  expect(occurrences(markup, 'data-seo-breadcrumb="true"')).toBe(1);
  expect(occurrences(markup, 'aria-current="page"')).toBe(1);
  expect(markup).toMatch(
    /<a\b(?=[^>]*href="\/birth-card\/queen-of-hearts")(?=[^>]*aria-current="page")[^>]*>Q Hearts<\/a>/,
  );

  const rawJson = markup.match(
    /<script[^>]*data-seo-breadcrumb="true"[^>]*>(.*?)<\/script>/,
  )?.[1];
  expect(rawJson).toBeDefined();
  expect(JSON.parse(rawJson!)).toEqual(
    buildBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Birth Cards", href: "/birth-card" },
      { name: "Q Hearts", href: "/birth-card/queen-of-hearts" },
    ]),
  );
});

test("SeoShell keeps a one-item visible trail without emitting BreadcrumbList data", () => {
  const markup = renderToStaticMarkup(
    createElement(
      SeoShell,
      { crumb: [{ label: "Home", href: "/" }] },
      createElement("p", null, "Home"),
    ),
  );

  expect(occurrences(markup, 'aria-label="Breadcrumb"')).toBe(1);
  expect(occurrences(markup, 'data-seo-breadcrumb="true"')).toBe(0);
  expect(occurrences(markup, 'aria-current="page"')).toBe(1);
});

test("SeoShell safely serializes hostile breadcrumb labels without changing JSON data", () => {
  const hostileLabel =
    "</script><script>window.__breadcrumbPwned=1</script>";
  const markup = renderToStaticMarkup(
    createElement(
      SeoShell,
      {
        crumb: [
          { label: "Home", href: "/" },
          { label: hostileLabel, href: "/hostile" },
        ],
      },
      createElement("p", null, "Hostile breadcrumb test"),
    ),
  );

  const openingTag = '<script type="application/ld+json" data-seo-breadcrumb="true">';
  const payloadStart = markup.indexOf(openingTag) + openingTag.length;
  const payloadEnd = markup.lastIndexOf("</script>");
  const payload = markup.slice(payloadStart, payloadEnd);

  expect(payload).not.toContain("<");
  expect(payload).not.toContain("</script>");
  expect(occurrences(markup, "<script")).toBe(1);
  expect(occurrences(markup, "</script>")).toBe(1);

  const parsed = JSON.parse(payload) as BreadcrumbListJsonLd;
  expect(parsed.itemListElement[1]?.name).toBe(hostileLabel);
});

const migratedTemplates = [
  "app/playing-card-spreads/three-card/page.tsx",
  "app/playing-card-spreads/love/page.tsx",
  "app/playing-card-spreads/yes-or-no/page.tsx",
  "app/blog/pillar/[slug]/page.tsx",
  "app/blog/[slug]/page.tsx",
  "app/birth-card/[slug]/page.tsx",
] as const;

test("the six migrated templates contain no manual BreadcrumbList implementation", () => {
  expect(migratedTemplates).toHaveLength(6);

  for (const path of migratedTemplates) {
    const source = readFileSync(join(root, path), "utf8");
    expect(source).not.toContain('"@type": "BreadcrumbList"');
    expect(source).not.toContain("function breadcrumbJsonLd");
  }
});

test("the blog post visible breadcrumb includes the current post", () => {
  const source = readFileSync(join(root, "app/blog/[slug]/page.tsx"), "utf8");

  expect(source).toContain(
    "{ label: post.title, href: blogPostPath(post) }",
  );
});

test("migrated templates retain their non-breadcrumb structured data", () => {
  const spreadSources = migratedTemplates
    .slice(0, 3)
    .map((path) => readFileSync(join(root, path), "utf8"));
  for (const source of spreadSources) {
    expect(source).toContain('"@type": "FAQPage"');
  }

  const pillarSource = readFileSync(
    join(root, "app/blog/pillar/[slug]/page.tsx"),
    "utf8",
  );
  expect(pillarSource).toContain('"@type": "CollectionPage"');
  expect(pillarSource).toContain('"@type": "FAQPage"');

  const postSource = readFileSync(join(root, "app/blog/[slug]/page.tsx"), "utf8");
  expect(postSource).toContain('"@type": "BlogPosting"');
  expect(postSource).toContain('"@type": "FAQPage"');

  const birthCardSource = readFileSync(
    join(root, "app/birth-card/[slug]/page.tsx"),
    "utf8",
  );
  expect(birthCardSource).toContain('"@type": "Article"');
  expect(birthCardSource).toContain('"@type": "FAQPage"');
  expect(birthCardSource).toContain('"@type": "VideoObject"');
});
