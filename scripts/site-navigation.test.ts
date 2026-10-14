import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";
import { ExploreDirectory } from "../components/explore/ExploreDirectory";

function navLinks(markup: string, label: string) {
  const nav = markup.split(`aria-label="${label}"`)[1]?.split("</nav>")[0] ?? "";
  return [...nav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

test("desktop and mobile offer the four tasks plus purchase access", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));
  const expected = ["/birth-card-calculator", "/birth-card-compatibility-calculator", "/explore", "/products/one-question-reading", "/my-purchases"];
  expect(navLinks(markup, "Primary")).toEqual(expected);
  expect(navLinks(markup, "Mobile primary")).toEqual(expected);
  for (const label of ["Find your card", "Compatibility", "Learn", "Full reading", "My purchases"]) {
    expect(markup).toContain(`>${label}<`);
  }
  expect(markup).not.toContain('href="/videos"');
});

test("footer keeps useful tools, access, support and policies without duplicate links", () => {
  for (const bare of [false, true]) {
    const markup = renderToStaticMarkup(createElement(SiteFooter, { bare }));
    const links = [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(links).size).toBe(links.length);
    for (const href of ["/birth-card", "/explore", "/free-course", "/my-purchases", "/contact", "/methodology", "/editorial-policy", "/privacy-policy", "/privacy-policy#privacy-choices", "/terms-of-service", "/refund-policy"]) {
      expect(links).toContain(href);
    }
    expect(links).not.toContain("/videos");
  }
});

test("Explore keeps four task groups and crawlable Worker and learning links", () => {
  const markup = renderToStaticMarkup(createElement(ExploreDirectory));
  expect(markup.match(/<h2/g)).toHaveLength(4);
  for (const href of ["/born-on/", "/compatibility/", "/videos", "/playing-card-spreads", "/your-year", "/planetary-ruling-card", "/52-card-astrology-explained", "/free-course", "/blog/karma-cards-in-relationships"]) {
    expect(markup).toContain(`href="${href}"`);
  }
});

test("money-path pages sit one crumb under home", () => {
  for (const file of [
    "app/birth-card-calculator/page.tsx",
    "app/products/one-question-reading/page.tsx",
    "app/what-is-cardology/page.tsx",
    "app/faq/page.tsx",
  ]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const crumb = source.match(/crumb=\{(\[[\s\S]*?\])\s*\}/);
    expect(crumb?.[1]).toBeTruthy();
    const hrefs = crumb?.[1].match(/href:/g) ?? [];
    expect(hrefs.length).toBeLessThanOrEqual(2);
  }
});
