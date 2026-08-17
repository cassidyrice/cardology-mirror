import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

import AnalogPage from "@/app/products/analog-algorithm/page";
import CompletePage from "@/app/products/complete-card-blueprint/page";
import PersonalPage from "@/app/products/personal-card-blueprint/page";
import {
  buildProductJsonLd,
  merchantReturnPolicy,
  PRODUCT_IMAGE_PATH,
} from "@/lib/product-schema";
import { PUBLIC_PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

type JsonLd = Record<string, unknown>;

function jsonLdGraphs(markup: string): JsonLd[] {
  return Array.from(
    markup.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g,
    ),
    (match) => JSON.parse(match[1]!) as JsonLd | JsonLd[],
  ).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

test("merchant return policy is a full Google object, not an @id stub", () => {
  const policy = merchantReturnPolicy();
  expect(policy["@type"]).toBe("MerchantReturnPolicy");
  expect(policy.applicableCountry).toBe("US");
  expect(policy.returnPolicyCategory).toContain("MerchantReturnFiniteReturnWindow");
  expect(policy.merchantReturnDays).toBe(14);
  expect(policy.returnMethod).toContain("ReturnByMail");
  expect(policy.returnFees).toContain("FreeReturn");
  expect(policy.merchantReturnLink).toBe(`${SITE_URL}/refund-policy`);
});

test("every public product emits merchant-listing required Offer fields", () => {
  for (const product of PUBLIC_PRODUCTS) {
    const json = buildProductJsonLd(product);
    expect(json["@type"]).toBe("Product");
    expect(json.image).toEqual([`${SITE_URL}${PRODUCT_IMAGE_PATH}`]);
    expect(json.sku).toBe(product.slug);
    expect(json.offers.price).toBe(product.price.toFixed(2));
    expect(json.offers.priceCurrency).toBe("USD");
    expect(json.offers.availability).toBe("https://schema.org/InStock");
    expect(json.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(json.offers.hasMerchantReturnPolicy.applicableCountry).toBe("US");
    expect(json.offers.shippingDetails.shippingRate.value).toBe(0);
    expect(json.offers.shippingDetails.deliveryTime.transitTime.maxValue).toBe(0);
  }
});

test("product pages include Product JSON-LD and do not use the 404 og-default.png path", () => {
  const pages = [
    renderToStaticMarkup(createElement(PersonalPage)),
    renderToStaticMarkup(createElement(AnalogPage)),
    renderToStaticMarkup(createElement(CompletePage)),
  ];

  for (const markup of pages) {
    const products = jsonLdGraphs(markup).filter(
      (graph) => graph["@type"] === "Product",
    );
    expect(products.length).toBeGreaterThanOrEqual(1);
    const product = products[0]!;
    const offers = product.offers as JsonLd;
    expect(product.image).toBeDefined();
    expect(offers.availability).toBe("https://schema.org/InStock");
    expect((offers.hasMerchantReturnPolicy as JsonLd).applicableCountry).toBe(
      "US",
    );
    expect((offers.shippingDetails as JsonLd).shippingRate).toBeDefined();
    expect(markup).not.toContain("/og-default.png");
  }
});

test("global Organization graph no longer injects incomplete makesOffer Products", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  expect(layout).not.toMatch(/makesOffer:/);
  expect(layout).toContain("merchantReturnPolicy()");
});
