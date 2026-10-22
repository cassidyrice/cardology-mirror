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
  expect(html).not.toMatch(/Personal Card Blueprint|One Question Reading/);
  expect(html).toContain('href="/my-purchases"');
  expect(html).toContain('href="#main-content"');
});
test("footer preserves library, support, policy and purchase-access destinations", () => {
  const html = render(SiteFooter);
  for (const path of ['/birth-card-calculator','/what-is-cardology','/birth-card','/born-on/','/compatibility/','/faq','/contact','/my-purchases','/privacy-policy','/terms-of-service','/refund-policy']) expect(html).toContain(`href="${path}"`);
  for (const offer of READINGS_NAV) expect(html).toContain(`href="${offer.href}"`);
});
test("four offers, Chemistry Check linked straight to Stan, with follow-up", () => {
  expect(READINGS_NAV.map(x => [x.id, x.price])).toEqual([["birth-card-blueprint", "$13"], ["timing-map", "$19"], ["chemistry-check", "$24"], ["family-snapshot", "$30"]]);
  const html = render(ManualReadingOffers);
  expect(html).toContain('id="chemistry-check"');
  expect(html).toContain('data-order-reading="chemistry-check"');
  expect(html).toContain(`href="${READINGS_NAV[2].checkoutHref!.replaceAll("&", "&amp;")}"`);
  expect(html).toContain('id="birth-card-blueprint"');
  expect(html).toContain('href="/samples/birth-card-blueprint-sample.pdf"');
  expect(html).toContain(READING_FOLLOW_UP);
  expect(html).toContain(`mailto:${READING_SUPPORT_EMAIL}`);
  expect(html).not.toMatch(/\$49|\$59|availability/);
});
