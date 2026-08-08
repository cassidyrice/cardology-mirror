import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { digitalBySlug, publicProductBySlug } from "../lib/products";

describe("The Analog Algorithm launch contract", () => {
  test("is a public $17 digital download", () => {
    const product = digitalBySlug("analog-algorithm");
    expect(product).toBeDefined();
    expect(product?.available).toBe(true);
    expect(product?.price).toBe(17);
    expect(product?.priceLabel).toBe("$17");
    expect(publicProductBySlug("analog-algorithm")?.slug).toBe("analog-algorithm");
    expect(product?.downloadAssetKey).toBe("analog-algorithm-v1.pdf");
  });

  test("does not present the sales page as closed", () => {
    const page = readFileSync(new URL("../app/products/analog-algorithm/page.tsx", import.meta.url), "utf8");
    expect(page).not.toContain("coming soon");
    expect(page).not.toContain("No purchase is being accepted yet");
    expect(page).toContain('href={`/checkout/${book.slug}`}');
  });

  test("keeps the launch price and asset name synchronized", () => {
    const products = readFileSync(new URL("../lib/products.ts", import.meta.url), "utf8");
    expect(products).toContain('price: 17');
    expect(products).toContain('priceLabel: "$17"');
    expect(products).toContain('downloadAssetKey: "analog-algorithm-v1.pdf"');
  });

  test("success fulfillment passes a signed token to the download route", () => {
    const success = readFileSync(new URL("../app/checkout/success/page.tsx", import.meta.url), "utf8");
    expect(success).toContain("mintDownloadToken");
    expect(success).toContain("token=${encodeURIComponent(token)}");
  });
});
