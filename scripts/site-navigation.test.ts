import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader, WEBSITE_NAV } from "../components/seo/SiteHeader";
import { SiteFooter } from "../components/seo/SiteFooter";
import { ManualReadingOffers } from "../components/offers/ManualReadingOffers";
import { READINGS_NAV, READING_FOLLOW_UP, READING_SUPPORT_EMAIL } from "../lib/readings-nav";

const render = (component: Parameters<typeof createElement>[0]) => renderToStaticMarkup(createElement(component));
test("desktop and mobile navigation expose real links to the library, tools and approved readings", () => {
  const html = render(SiteHeader);
  expect(html).toContain('aria-label="Primary"');
  expect(html).toContain('aria-label="Mobile primary"');
  for (const link of WEBSITE_NAV) expect(html.split(`href="${link.href}"`).length - 1).toBe(2);
  for (const offer of READINGS_NAV) {
    expect(html.split(`href="${offer.href}"`).length - 1).toBe(2);
    expect(html).toContain(offer.price);
  }
  expect(html).not.toContain('/checkout/');
  expect(html).not.toContain('$13');
  expect(html).toContain('href="/my-purchases"');
  expect(html).toContain('href="#main-content"');
});
test("footer preserves library, support, policy and purchase-access destinations", () => {
  const html = render(SiteFooter);
  for (const path of ['/birth-card-calculator','/what-is-cardology','/birth-card','/born-on/','/compatibility/','/faq','/contact','/my-purchases','/privacy-policy','/terms-of-service','/refund-policy']) expect(html).toContain(`href="${path}"`);
  for (const offer of READINGS_NAV) expect(html).toContain(`href="${offer.href}"`);
});
test("offer prices, family limit and follow-up are explicit and consistent", () => {
  expect(READINGS_NAV.map(x=>x.price)).toEqual(['$39','$49','$59']);
  expect(READINGS_NAV[2].who).toBe('Up to three people total');
  const html = render(ManualReadingOffers);
  for (const offer of READINGS_NAV) {
    expect(html).toContain(`id="${offer.id}"`);
    expect(html).toContain(`data-order-reading="${offer.id}"`);
    if (offer.checkoutHref) expect(html).toContain(`href="${offer.checkoutHref}"`);
    else expect(html).toContain(`id="${offer.id}-availability"`);
  }
  expect(html).toContain(READING_FOLLOW_UP);
  expect(html).toContain(`mailto:${READING_SUPPORT_EMAIL}`);
  expect(html).not.toContain('$79');
  expect(html).not.toContain('Seven dated personal seasons');
});
