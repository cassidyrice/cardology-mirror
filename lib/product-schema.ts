import {
  isDigitalDownload,
  type ActiveProduct,
} from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const PRODUCT_IMAGE_PATH = "/og/default.png";

/** Per-product OG/product-snippet images (public/og/products/). */
const PRODUCT_IMAGE_BY_SLUG: Record<string, string> = {
  "deep-dive": "/og/products/birth-card-deep-dive.png",
  "personal-card-blueprint": "/og/products/personal-card-blueprint.png",
  "complete-card-blueprint": "/og/products/complete-card-blueprint.png",
  "analog-algorithm": "/og/products/analog-algorithm.png",
};
export const MERCHANT_RETURN_POLICY_ID = `${SITE_URL}/refund-policy#merchant-return-policy`;

/** Digital goods: instant delivery, no physical shipment. */
export function digitalShippingDetails() {
  return {
    "@type": "OfferShippingDetails" as const,
    shippingRate: {
      "@type": "MonetaryAmount" as const,
      value: 0,
      currency: "USD",
    },
    shippingDestination: {
      "@type": "DefinedRegion" as const,
      addressCountry: "US",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime" as const,
      handlingTime: {
        "@type": "QuantitativeValue" as const,
        minValue: 0,
        maxValue: 0,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue" as const,
        minValue: 0,
        maxValue: 0,
        unitCode: "DAY",
      },
    },
  };
}

/**
 * Matches /refund-policy: failed delivery / corrupt file / wrong-date
 * correction window. Not a 30-day no-questions return.
 */
export function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy" as const,
    "@id": MERCHANT_RETURN_POLICY_ID,
    applicableCountry: "US",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    merchantReturnLink: `${SITE_URL}/refund-policy`,
  };
}

export function productCanonicalPath(product: ActiveProduct): string {
  return product.href ?? `/products/${product.slug}`;
}

export function productImageUrl(product: ActiveProduct): string {
  return `${SITE_URL}${PRODUCT_IMAGE_BY_SLUG[product.slug] ?? PRODUCT_IMAGE_PATH}`;
}

/**
 * priceValidUntil is recommended for Google product snippets; prices are
 * stable, so pin it a year past the build date (rebuilt on every deploy).
 */
export function priceValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildProductJsonLd(product: ActiveProduct) {
  const path = productCanonicalPath(product);
  const url = `${SITE_URL}${path}`;
  const available =
    isDigitalDownload(product) ? product.available : true;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.oneLine,
    image: [productImageUrl(product)],
    sku: product.slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price: product.price.toFixed(2),
      priceCurrency: "USD",
      priceValidUntil: priceValidUntil(),
      availability: available
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
      hasMerchantReturnPolicy: merchantReturnPolicy(),
      shippingDetails: digitalShippingDetails(),
    },
  };
}
