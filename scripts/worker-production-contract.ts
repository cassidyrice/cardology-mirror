import {
  birthdayWorkerPathFromIsoDate,
  compatibilityPairPath,
} from "../lib/worker-seo-routes";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
} from "../lib/site";

const PRODUCTION_ORIGIN = "https://cardblueprints.com";

const SITEMAP_CARD_URL = `${PRODUCTION_ORIGIN}/sitemap-cardology.xml`;
const SITEMAP_COMPATIBILITY_URL = `${PRODUCTION_ORIGIN}/sitemap-compatibility.xml`;

function printable(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function invariant(
  condition: unknown,
  url: string,
  requirement: string,
  actual?: unknown,
): asserts condition {
  if (condition) return;

  const received = actual === undefined ? "" : `; received ${printable(actual)}`;
  throw new Error(`${url}: invariant failed — ${requirement}${received}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : printable(error);
}

function exactWorkerUrl(
  path: string | null,
  expectedPath: string,
  routeDescription: string,
): string {
  const expectedUrl = `${PRODUCTION_ORIGIN}${expectedPath}`;
  invariant(
    path === expectedPath,
    expectedUrl,
    `${routeDescription} resolves to the exact canonical path ${expectedPath}`,
    path,
  );
  return expectedUrl;
}

function birthdayUrl(isoDate: string, expectedPath: string): string {
  return exactWorkerUrl(
    birthdayWorkerPathFromIsoDate(isoDate),
    expectedPath,
    `birthday helper for ${isoDate}`,
  );
}

function compatibilityUrl(
  firstSlug: string,
  secondSlug: string,
  expectedPath: string,
): string {
  return exactWorkerUrl(
    compatibilityPairPath(firstSlug, secondSlug),
    expectedPath,
    `compatibility helper for ${firstSlug} and ${secondSlug}`,
  );
}

function parseTagAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const source = tag
    .replace(/^<[a-z][^\s/>]*/i, "")
    .replace(/\/?\s*>$/, "");
  const attributePattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(attributePattern)) {
    attributes.set(
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }

  return attributes;
}

function canonicalHrefs(html: string): string[] {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html;
  return [...head.matchAll(/<link\b[^>]*>/gi)].flatMap((match) => {
    const attributes = parseTagAttributes(match[0]);
    const rels = (attributes.get("rel") ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return rels.includes("canonical") ? [attributes.get("href") ?? ""] : [];
  });
}

function robotsDirectives(html: string): string[] {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html;
  return [...head.matchAll(/<meta\b[^>]*>/gi)].flatMap((match) => {
    const attributes = parseTagAttributes(match[0]);
    if ((attributes.get("name") ?? "").toLowerCase() !== "robots") {
      return [];
    }
    return (attributes.get("content") ?? "")
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean);
  });
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((match) =>
    decodeXmlText(match[1].trim()),
  );
}

async function fetchManual(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      redirect: "manual",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "cache-control": "no-cache",
        "user-agent":
          "CardBlueprints-Production-Contract/1.0 (+https://cardblueprints.com)",
      },
    });
  } catch (error) {
    throw new Error(
      `${url}: invariant failed — request completes without a network error; received ${errorMessage(error)}`,
    );
  }
}

async function responseText(response: Response, url: string): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    throw new Error(
      `${url}: invariant failed — response body is readable; received ${errorMessage(error)}`,
    );
  }
}

async function assertCanonicalHtml(url: string): Promise<void> {
  const response = await fetchManual(url);
  invariant(
    response.status === 200,
    url,
    "response has HTTP status 200 without following redirects",
    `status ${response.status}, location ${response.headers.get("location") ?? "none"}`,
  );

  const contentType = response.headers.get("content-type") ?? "";
  invariant(
    contentType.toLowerCase().includes("text/html"),
    url,
    "Content-Type identifies HTML",
    contentType || "missing Content-Type",
  );

  const html = await responseText(response, url);
  const canonicals = canonicalHrefs(html);
  invariant(
    canonicals.length === 1,
    url,
    "HTML contains exactly one canonical link",
    `${canonicals.length} canonical links`,
  );
  invariant(
    canonicals[0] === url,
    url,
    "canonical href is the exact self-canonical URL",
    canonicals[0],
  );

  const h1Count = (html.match(/<h1(?=[\s>])/gi) ?? []).length;
  invariant(
    h1Count === 1,
    url,
    "HTML contains exactly one literal <h1 start tag",
    `${h1Count} <h1 start tags`,
  );

  const robots = robotsDirectives(html);
  invariant(
    robots.includes("index"),
    url,
    "robots meta contains the index directive",
    robots.join(", ") || "missing robots meta",
  );
  invariant(
    !robots.includes("noindex"),
    url,
    "robots meta does not contain the noindex directive",
    robots.join(", "),
  );

  const xRobotsTag = response.headers.get("x-robots-tag") ?? "";
  invariant(
    !/(?:^|[,\s])noindex(?:$|[,\s])/i.test(xRobotsTag),
    url,
    "X-Robots-Tag does not contain the noindex directive",
    xRobotsTag,
  );
}

async function assertSitemap(
  url: string,
  expectedCount: number,
  expectedMembers: readonly string[],
): Promise<void> {
  const response = await fetchManual(url);
  invariant(
    response.status === 200,
    url,
    "sitemap response has HTTP status 200 without following redirects",
    `status ${response.status}, location ${response.headers.get("location") ?? "none"}`,
  );

  const contentType = response.headers.get("content-type") ?? "";
  invariant(
    /(?:application|text)\/(?:[a-z0-9.+-]*\+)?xml\b/i.test(contentType),
    url,
    "Content-Type identifies XML",
    contentType || "missing Content-Type",
  );

  const xml = await responseText(response, url);
  invariant(
    /<urlset\b[^>]*>[\s\S]*<\/urlset>/i.test(xml),
    url,
    "response body is an XML urlset",
  );

  const locations = sitemapLocations(xml);
  invariant(
    locations.length === expectedCount,
    url,
    `sitemap contains exactly ${expectedCount} locations`,
    `${locations.length} locations`,
  );
  invariant(
    new Set(locations).size === locations.length,
    url,
    "sitemap locations are unique",
    `${locations.length - new Set(locations).size} duplicate locations`,
  );

  const locationSet = new Set(locations);
  for (const memberUrl of expectedMembers) {
    invariant(
      locationSet.has(memberUrl),
      url,
      `sitemap includes expected member URL ${memberUrl}`,
    );
  }
}

const birthdayDirectoryUrl = `${PRODUCTION_ORIGIN}${BIRTHDAY_DIRECTORY_PATH}`;
const birthdayUrls = [
  birthdayDirectoryUrl,
  birthdayUrl("2000-01-15", "/born-on/january-15"),
  birthdayUrl("2000-02-29", "/born-on/february-29"),
  birthdayUrl("2000-12-31", "/born-on/december-31"),
  birthdayUrl("2000-07-29", "/born-on/july-29"),
  birthdayUrl("2000-01-28", "/born-on/january-28"),
] as const;

const compatibilityDirectoryUrl =
  `${PRODUCTION_ORIGIN}${COMPATIBILITY_DIRECTORY_PATH}`;
const compatibilityUrls = [
  compatibilityDirectoryUrl,
  compatibilityUrl(
    "queen-of-hearts",
    "queen-of-hearts",
    "/compatibility/queen-of-hearts-and-queen-of-hearts",
  ),
  compatibilityUrl(
    "ace-of-clubs",
    "queen-of-hearts",
    "/compatibility/queen-of-hearts-and-ace-of-clubs",
  ),
  compatibilityUrl(
    "ace-of-hearts",
    "queen-of-spades",
    "/compatibility/ace-of-hearts-and-queen-of-spades",
  ),
] as const;

for (const url of [...birthdayUrls, ...compatibilityUrls]) {
  await assertCanonicalHtml(url);
}

await assertSitemap(SITEMAP_CARD_URL, 367, birthdayUrls);
await assertSitemap(SITEMAP_COMPATIBILITY_URL, 1_431, compatibilityUrls);

console.log(
  `Worker production contract passed: ${birthdayUrls.length + compatibilityUrls.length} HTML routes and 2 sitemaps.`,
);
