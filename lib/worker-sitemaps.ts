import { SITE_URL } from "@/lib/site";
import { renderMonthlySitemap } from "@/lib/sitemap-xml";
import {
  birthdaySitemapPaths,
  compatibilitySitemapPaths,
} from "@/lib/worker-seo-routes";

function absoluteLocs(paths: readonly string[]): string[] {
  return paths.map((path) => `${SITE_URL}${path}`);
}

function assertUrlset(xml: string, label: string): string {
  if (!xml.includes("<url>") || !xml.includes("</urlset>")) {
    throw new Error(`${label} sitemap XML is empty or malformed`);
  }
  return xml;
}

// Built once per isolate. Request handlers return this string; they do not
// rebuild 367 or 1,431 locs under a crawler burst.
const CARD_SITEMAP_XML = assertUrlset(
  renderMonthlySitemap(absoluteLocs(birthdaySitemapPaths())),
  "cardology",
);
const COMPATIBILITY_SITEMAP_XML = assertUrlset(
  renderMonthlySitemap(absoluteLocs(compatibilitySitemapPaths())),
  "compatibility",
);

export function renderCardologySitemapXml(): string {
  return CARD_SITEMAP_XML;
}

export function renderCompatibilitySitemapXml(): string {
  return COMPATIBILITY_SITEMAP_XML;
}
