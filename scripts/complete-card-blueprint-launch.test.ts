import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { digitalBySlug, publicProductBySlug } from "../lib/products";

describe("The Complete Card Blueprint launch contract", () => {
  test("is a public $27 digital download", () => {
    const product = digitalBySlug("complete-card-blueprint");
    expect(product).toBeDefined();
    expect(product?.available).toBe(true);
    expect(product?.price).toBe(27);
    expect(product?.priceLabel).toBe("$27");
    expect(publicProductBySlug("complete-card-blueprint")?.slug).toBe(
      "complete-card-blueprint",
    );
    expect(product?.downloadAssetKey).toBe("complete-card-blueprint-v1.pdf");
    expect(product?.fileName).toBe("The-Complete-Card-Blueprint.pdf");
    expect(product?.stripePriceEnv).toBe("STRIPE_PRICE_COMPLETE_CARD_BLUEPRINT");
  });

  test("does not present the sales page as closed", () => {
    const page = readFileSync(
      new URL("../app/products/complete-card-blueprint/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).not.toContain("coming soon");
    expect(page).not.toContain("No purchase is being accepted yet");
    expect(page).toContain("href={`/checkout/${book.slug}`}");
    expect(page).toContain("$27");
  });

  test("keeps the launch price and asset name synchronized", () => {
    const products = readFileSync(
      new URL("../lib/products.ts", import.meta.url),
      "utf8",
    );
    expect(products).toContain('slug: "complete-card-blueprint"');
    expect(products).toContain("price: 27");
    expect(products).toContain('priceLabel: "$27"');
    expect(products).toContain(
      'downloadAssetKey: "complete-card-blueprint-v1.pdf"',
    );
  });
});
