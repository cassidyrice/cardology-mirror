import { SITE_URL } from "@/lib/site";

export type BreadcrumbData = Readonly<{ name: string; href: string }>;

type BreadcrumbListItemJsonLd = Readonly<{
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}>;

export type BreadcrumbListJsonLd = Readonly<{
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: readonly BreadcrumbListItemJsonLd[];
}>;

export function serializeJsonLdForHtml(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("JSON-LD value must be JSON-serializable");
  }
  return serialized.replace(/</g, "\\u003c");
}

export function buildBreadcrumbJsonLd(
  items: readonly BreadcrumbData[],
): BreadcrumbListJsonLd | null {
  if (items.length < 2) return null;

  const siteUrl = new URL(SITE_URL);
  const itemListElement = items.map((item, index) => {
    const name = item.name.trim();
    const href = item.href.trim();

    if (!name) throw new Error("Breadcrumb name must not be empty");
    if (!href) throw new Error("Breadcrumb href must not be empty");

    let url: URL;
    try {
      if (href.startsWith("//")) throw new Error("protocol-relative URL");
      url = new URL(href, siteUrl);
    } catch {
      throw new Error("Breadcrumb href must be a same-origin HTTP(S) URL");
    }

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== siteUrl.origin
    ) {
      throw new Error("Breadcrumb href must be a same-origin HTTP(S) URL");
    }

    return {
      "@type": "ListItem" as const,
      position: index + 1,
      name,
      item: url.href,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
