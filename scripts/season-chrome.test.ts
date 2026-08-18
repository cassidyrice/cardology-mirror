import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

test("Season header uses the locked five destinations and birthday CTA", () => {
  const markup = renderToStaticMarkup(createElement(SiteHeader));

  expect(occurrences(markup, 'href="/season"')).toBe(4);
  for (const href of [
    "/birth-card-calculator",
    "/birth-card",
    "/what-is-cardology",
    "/about",
  ]) {
    expect(occurrences(markup, `href="${href}"`)).toBe(2);
  }

  expect(occurrences(markup, ">Reveal My Cards</a>")).toBe(2);
  expect(markup).not.toContain("$13");
  expect(markup).not.toContain('href="/products/personal-card-blueprint"');
});

test("Season footer preserves the full SEO library and Worker anchors", () => {
  const markup = renderToStaticMarkup(createElement(SiteFooter, { bare: true }));
  const source = read("../components/seo/SiteFooter.tsx");

  for (const href of [
    "/birth-card-calculator",
    "/birth-card",
    "/52-day-period-meaning-tool",
    "/birth-card-compatibility-calculator",
    "/born-on/",
    "/compatibility/",
    "/products/personal-card-blueprint",
    "/products/analog-algorithm",
    "/privacy-policy",
    "/refund-policy",
    "/terms-of-service",
  ]) {
    expect(markup).toContain(`href="${href}"`);
  }

  expect(source).toContain("<a href={BIRTHDAY_DIRECTORY_PATH}");
  expect(source).toContain("<a href={COMPATIBILITY_DIRECTORY_PATH}");
  expect(source).not.toContain("<Link href={BIRTHDAY_DIRECTORY_PATH}");
  expect(source).not.toContain("<Link href={COMPATIBILITY_DIRECTORY_PATH}");
});

test("Season design tokens, fonts, theme color, and shared shell are wired", () => {
  const tailwind = read("../tailwind.config.ts");
  const globals = read("../app/globals.css");
  const layout = read("../app/layout.tsx");
  const shell = read("../components/seo/SeoShell.tsx");

  for (const [name, value] of Object.entries({
    void: "#07060E",
    deep: "#0D0B1E",
    nebula: "#171333",
    iris: "#7C5CFF",
    aurora: "#3EE6C4",
    flare: "#FF5C8A",
    sol: "#FFC45C",
    ink: "#F2F0FF",
    mist: "#9B94C4",
    faint: "#4A4376",
  })) {
    expect(tailwind).toContain(`${name}: "${value}"`);
  }

  expect(layout).toContain('import { Fraunces, Inter, Montserrat } from "next/font/google"');
  expect(layout).toContain('themeColor: "#07060E"');
  expect(layout).toContain('variable: "--font-fraunces"');
  expect(layout).toContain('variable: "--font-inter"');
  expect(globals).toContain("--void: #07060e");
  expect(globals).toContain("--season-ink: #f2f0ff");
  expect(shell).toContain("season-shell");
  expect(shell).toContain("season-aurora");
  expect(shell).toContain("season-stars");
  expect(shell).not.toContain("landing-oracle");
});

test("Elroy stays mounted but recedes on mobile conversion routes", () => {
  const layout = read("../app/layout.tsx");
  const launcher = read("../components/elroy/ElroyLauncher.tsx");
  const styles = read("../components/elroy/elroy-widget.css");

  expect(layout).toContain("<ElroyLauncher />");
  expect(launcher).toContain("shouldRecedeElroyLauncher");
  expect(launcher).toContain("elroy-root--receded");
  expect(styles).toContain(".elroy-root--receded");
});
