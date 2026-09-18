import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import {
  buildProductJsonLd,
  merchantReturnPolicy,
  OFFER_VALID_FROM,
  productImageUrl,
} from "@/lib/product-schema";
import { DEEP_DIVE_PRODUCT, PUBLIC_PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

test("merchant return policy is a full Google object, not an @id stub", () => {
  const policy = merchantReturnPolicy();
  expect(policy["@type"]).toBe("MerchantReturnPolicy");
  expect(policy.applicableCountry).toBe("US");
  expect(policy.returnPolicyCategory).toContain("MerchantReturnNotPermitted");
  expect(policy.merchantReturnDays).toBeUndefined();
  expect(policy.returnMethod).toBeUndefined();
  expect(policy.returnFees).toBeUndefined();
  expect(policy.merchantReturnLink).toBe(`${SITE_URL}/refund-policy`);
  expect(policy.description).toContain("Digital files");
});

test("every public product emits merchant-listing required Offer fields", () => {
  for (const product of PUBLIC_PRODUCTS) {
    const json = buildProductJsonLd(product);
    expect(json["@type"]).toBe("Product");
    expect(json.image).toEqual([productImageUrl(product)]);
    expect(json.sku).toBe(product.slug);
    expect(json.offers.price).toBe(product.price.toFixed(2));
    expect(json.offers.priceCurrency).toBe("USD");
    expect(json.offers.validFrom).toBe(OFFER_VALID_FROM);
    expect(json.offers.availability).toBe("https://schema.org/InStock");
    expect(json.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(json.offers.hasMerchantReturnPolicy.applicableCountry).toBe("US");
    expect(json.offers.shippingDetails.shippingRate.value).toBe(0);
    expect(json.offers.shippingDetails.deliveryTime.transitTime.maxValue).toBe(0);
  }
});

test("One Question Reading Offer starts on the 2026-09-13 launch date at $13", () => {
  expect(OFFER_VALID_FROM).toBe("2026-09-13");
  expect(OFFER_VALID_FROM).toBe(
    PAGE_UPDATED_DATES["/products/one-question-reading"],
  );

  const json = buildProductJsonLd(DEEP_DIVE_PRODUCT);
  expect(json["@type"]).toBe("Product");
  expect(json.name).toBe("One Question Reading");
  expect(json.offers.price).toBe("13.00");
  expect(json.offers.priceCurrency).toBe("USD");
  expect(json.offers.validFrom).toBe("2026-09-13");
  expect(json.offers.url).toBe(
    `${SITE_URL}/products/one-question-reading`,
  );
  expect(json.image).toEqual([
    `${SITE_URL}/og/products/one-question-reading.png`,
  ]);
});

test("One Question Reading product page uses the shared Product/Offer JSON-LD helper", () => {
  const page = readFileSync("app/products/one-question-reading/page.tsx", "utf8");
  expect(page).toContain("buildProductJsonLd(DEEP_DIVE_PRODUCT)");
  expect(page).not.toContain("/og-default.png");
});

test("global Organization graph no longer injects incomplete makesOffer Products", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  expect(layout).not.toMatch(/makesOffer:/);
  expect(layout).toContain("merchantReturnPolicy()");
});
