import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader, WEBSITE_NAV } from "../components/seo/SiteHeader";
import { SiteFooter } from "../components/seo/SiteFooter";
import { ManualReadingOffers } from "../components/offers/ManualReadingOffers";
import { READINGS_NAV, READING_FOLLOW_UP, READING_SUPPORT_EMAIL } from "../lib/readings-nav";

const render = (component: Parameters<typeof createElement>[0]) => renderToStaticMarkup(createElement(component));
test("desktop and mobile navigation expose real links to the library dropdown, tools and approved readings", () => {
  const html = render(SiteHeader);
  expect(html).toContain('aria-label="Primary"');
  expect(html).toContain('aria-label="Mobile primary"');
  expect(html).toContain("The Library");
  expect(html).toContain("52 cards · 366 dates · 1,378 pairs");
  for (const link of WEBSITE_NAV) expect(html.split(`href="${link.href}"`).length - 1).toBeGreaterThanOrEqual(2);
  for (const offer of READINGS_NAV) {
    expect(html.split(`href="${offer.href}"`).length - 1).toBe(2);
    expect(html).toContain(offer.price);
  }
  expect(html).not.toContain('/checkout/');
  expect(html).not.toContain('stan.store');
  expect(html).not.toMatch(/Personal Card Blueprint|One Question Reading/);
  expect(html).toContain('href="/my-purchases"');
  expect(html).toContain('href="#main-content"');
});
test("footer preserves library disclosure, support, policy and purchase-access destinations", () => {
  const html = render(SiteFooter);
  for (const path of ['/birth-card-calculator','/what-is-cardology','/birth-card','/born-on/','/compatibility/','/faq','/contact','/my-purchases','/privacy-policy','/terms-of-service','/refund-policy']) expect(html).toContain(`href="${path}"`);
  for (const offer of READINGS_NAV) expect(html).toContain(`href="${offer.href}"`);
});
test("two on-page question reading offers ($26 Timing Map and $39 Chemistry Check) with email or text delivery and follow-up", () => {
  expect(READINGS_NAV.map(x => [x.id, x.price])).toEqual([["timing-map", "$26"], ["chemistry-check", "$39"]]);
  const html = render(ManualReadingOffers);
  expect(html).toContain('id="timing-map"');
  expect(html).toContain('id="chemistry-check"');
  expect(html).toContain('data-order-reading="timing-map"');
  expect(html).toContain('data-order-reading="chemistry-check"');
  expect(html).toContain(READING_FOLLOW_UP);
  expect(html).toContain(`mailto:${READING_SUPPORT_EMAIL}`);
  expect(html).not.toContain("stan.store");
  expect(html).not.toMatch(/\$49|\$59|availability/);
});
