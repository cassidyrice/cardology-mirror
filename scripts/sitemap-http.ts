/**
 * Shared checker for the sitemap routes advertised in robots.txt.
 * A non-200 or a body that is not a sitemap urlset / sitemap index throws
 * `sitemap route FAILED <path>: ...`.
 */
import { ROBOTS_SITEMAP_PATHS } from "../lib/site";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XML_CONTENT_TYPE = /(?:application|text)\/(?:[a-z0-9.+-]+\+)?xml\b/i;
const REQUEST_TIMEOUT_MS = 20_000;

export type SitemapDocumentKind = "urlset" | "sitemapindex";

export type ParsedSitemap = {
  kind: SitemapDocumentKind;
  locations: string[];
};

function preview(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "(empty)";
  return flat.length > 180 ? `${flat.slice(0, 180)}...` : flat;
}

export function sitemapRouteError(path: string, detail: string): Error {
  return new Error(`sitemap route FAILED ${path}: ${detail}`);
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function workerSitemapHint(path: string, status: number): string {
  if (
    status === 404 &&
    (path === "/sitemap-cardology.xml" || path === "/sitemap-compatibility.xml")
  ) {
    return " This route has a static app handler. Verify the tested origin includes the route and inspect any upstream routing separately.";
  }
  return "";
}

/** Crawlers that have been seen receiving the intermittent sitemap 500. */
export const SITEMAP_PROBE_USER_AGENTS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
] as const;

/** Parse a sitemap urlset or index. Returns null when the body is not one. */
export function parseSitemapXml(body: string): ParsedSitemap | null {
  const xml = body.replace(/^\uFEFF/, "").trim();
  if (!xml) return null;
  if (/<!doctype\s+html\b/i.test(xml) || /<html[\s>]/i.test(xml)) return null;

  const withoutDecl = xml.replace(/^<\?xml\b[^?]*\?>\s*/i, "");
  const root = /^<(?:([A-Za-z_][\w.-]*):)?(urlset|sitemapindex)\b([^>]*)>/i.exec(
    withoutDecl,
  );
  if (!root) return null;

  const prefix = root[1];
  const rawName = root[2];
  const attrs = root[3] ?? "";
  if (!attrs.includes(SITEMAP_NS)) return null;

  const openName = prefix ? `${prefix}:${rawName}` : rawName;
  if (!xml.toLowerCase().endsWith(`</${openName}>`.toLowerCase())) return null;

  const kind = rawName.toLowerCase() as SitemapDocumentKind;
  const locations = [
    ...xml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?loc\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?loc>/gi),
  ].map((match) => decodeXmlText(match[1].trim()));

  return { kind, locations };
}

export function assertSitemapResponse(input: {
  path: string;
  status: number;
  contentType: string | null;
  body: string;
  location?: string | null;
}): ParsedSitemap {
  const { path, status, body } = input;
  if (status !== 200) {
    const location = input.location ? ` Redirect location: ${input.location}.` : "";
    throw sitemapRouteError(
      path,
      `HTTP ${status}, expected 200.${location}${workerSitemapHint(path, status)} Body starts: ${preview(body)}`,
    );
  }

  const contentType = input.contentType ?? "";
  if (!XML_CONTENT_TYPE.test(contentType)) {
    throw sitemapRouteError(
      path,
      `Content-Type is not XML (${contentType || "missing"}). Body starts: ${preview(body)}`,
    );
  }

  const parsed = parseSitemapXml(body);
  if (!parsed) {
    throw sitemapRouteError(
      path,
      `body is not a parseable sitemap urlset or sitemap index. Body starts: ${preview(body)}`,
    );
  }
  if (parsed.locations.length === 0) {
    throw sitemapRouteError(path, `${parsed.kind} XML has no <loc> entries.`);
  }
  if (parsed.locations.some((loc) => loc.length === 0)) {
    throw sitemapRouteError(path, `${parsed.kind} XML has an empty <loc>.`);
  }

  return parsed;
}

function pathnameOf(loc: string): string {
  if (loc.startsWith("/")) return loc.split("?")[0] || "/";
  try {
    return new URL(loc).pathname;
  } catch {
    return loc;
  }
}

/** Main sitemap keeps the $13 reading primary and leaves the Blueprint Report off. */
export function assertBlueprintReportStaysOffMainSitemap(
  path: string,
  locations: readonly string[],
): void {
  const pathnames = locations.map(pathnameOf);
  if (pathnames.includes("/products/blueprint-report")) {
    throw sitemapRouteError(
      path,
      "lists /products/blueprint-report. That page stays off the main sitemap so the $13 One Question Reading stays primary.",
    );
  }
}

export function sitemapPathsFromRobots(body: string): string[] {
  const paths: string[] = [];
  for (const match of body.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)) {
    const value = match[1].trim();
    if (value.startsWith("/")) {
      paths.push(value.split("?")[0] || "/");
      continue;
    }
    try {
      paths.push(new URL(value).pathname);
    } catch {
      paths.push(value);
    }
  }
  return paths;
}

export function assertRobotsAdvertisesSitemapPaths(
  status: number,
  body: string,
  expected: readonly string[] = ROBOTS_SITEMAP_PATHS,
): void {
  if (status !== 200) {
    throw sitemapRouteError(
      "/robots.txt",
      `HTTP ${status}, expected 200. Body starts: ${preview(body)}`,
    );
  }

  const actual = sitemapPathsFromRobots(body);
  const same =
    [...actual].sort().join("\n") === [...expected].sort().join("\n");
  if (!same) {
    throw sitemapRouteError(
      "/robots.txt",
      `advertises ${actual.join(", ") || "(none)"}; expected ${expected.join(", ")}.`,
    );
  }
}

export async function checkSitemapUrl(
  url: string,
  path: string,
  userAgent: string = SITEMAP_PROBE_USER_AGENTS[0],
): Promise<ParsedSitemap> {
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        accept: "application/xml,text/xml,*/*;q=0.8",
        "cache-control": "no-cache",
        "user-agent": userAgent,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw sitemapRouteError(
      path,
      `request to ${url} as ${userAgent} did not complete within ${REQUEST_TIMEOUT_MS}ms (${message}).`,
    );
  }

  const body = await response.text();
  try {
    return assertSitemapResponse({
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
      body,
      location: response.headers.get("location"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message} User-Agent: ${userAgent}`);
  }
}
