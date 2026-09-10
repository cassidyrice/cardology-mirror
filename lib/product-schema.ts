import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import {
  isDigitalDownload,
  type ActiveProduct,
} from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { schemaReviewsFor } from "@/lib/testimonials";

export const PRODUCT_IMAGE_PATH = "/og/default.png";

/** Per-product OG/product-snippet images (public/og/products/). */
const PRODUCT_IMAGE_BY_SLUG: Record<string, string> = {
  "deep-dive": "/og/products/52xseven-blueprint.png",
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
 * Matches /refund-policy for digital goods: replaced or refunded when broken,
 * wrong card, wrong date, or double-charged — not a mail-return window.
 */
export function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy" as const,
    "@id": MERCHANT_RETURN_POLICY_ID,
    applicableCountry: "US",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: `${SITE_URL}/refund-policy`,
    description:
      "Digital files: replaced or refunded if broken, wrong card, wrong date, or double charge.",
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

/**
 * Offer start for the live $19 52xSeven Blueprint. Same ISO day as
 * PAGE_UPDATED_DATES["/products/52xseven-blueprint"] and the catalog
 * launch note in middleware.ts (2026-09-08). Not a sale window — the
 * list price stays $19 from this date forward.
 */
export const OFFER_VALID_FROM =
  PAGE_UPDATED_DATES["/products/52xseven-blueprint"];

export function buildProductJsonLd(product: ActiveProduct) {
  const path = productCanonicalPath(product);
  const url = `${SITE_URL}${path}`;
  const available =
    isDigitalDownload(product) ? product.available : true;
  // Real customer reviews shown on the page; every rating owner-confirmed
  // five-star (2026-09-01). Founder reviews are excluded upstream.
  const rated = schemaReviewsFor(product.slug);
  const reviews = rated.map((t) => ({
    "@type": "Review" as const,
    author: { "@type": "Person" as const, name: t.author },
    reviewBody: t.quote,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: t.rating,
      bestRating: 5,
      worstRating: 1,
    },
  }));
  const aggregateRating =
    rated.length > 0
      ? {
          "@type": "AggregateRating" as const,
          ratingValue: (
            rated.reduce((sum, t) => sum + t.rating, 0) / rated.length
          ).toFixed(1),
          reviewCount: rated.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return {
    ...(reviews.length > 0 ? { review: reviews } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
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
      validFrom: OFFER_VALID_FROM,
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
