import { describe, expect, test } from "bun:test";

import { GET as getApplicationSitemap } from "../app/sitemap.xml/route";
import { GET as getCardologySitemap } from "../app/sitemap-cardology.xml/route";
import { GET as getCompatibilitySitemap } from "../app/sitemap-compatibility.xml/route";
import robots from "../app/robots";
import { ROBOTS_SITEMAP_PATHS, SITE_URL } from "../lib/site";
import { SITEMAP_CACHE_CONTROL } from "../lib/sitemap-xml";
import {
  assertBlueprintReportStaysOffMainSitemap,
  assertRobotsAdvertisesSitemapPaths,
  assertSitemapResponse,
  parseSitemapXml,
  SITEMAP_PROBE_USER_AGENTS,
  sitemapPathsFromRobots,
} from "./sitemap-http";

const NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

function urlset(locs: string[], extra = ""): string {
  const urls = locs
    .map((loc) => `<url><loc>${loc}</loc>${extra}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${NS}">
${urls}
</urlset>
`;
}

describe("sitemap route guard", () => {
  test("GET /sitemap.xml returns 200 parseable urlset XML and keeps the Blueprint Report off", async () => {
    let response: Response;
    try {
      response = getApplicationSitemap();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`sitemap route FAILED /sitemap.xml: handler threw (${message})`);
    }

    const body = await response.text();
    const parsed = assertSitemapResponse({
      path: "/sitemap.xml",
      status: response.status,
      contentType: response.headers.get("content-type"),
      body,
    });

    expect(parsed.kind).toBe("urlset");
    expect(parsed.locations.length).toBeGreaterThan(50);
    assertBlueprintReportStaysOffMainSitemap("/sitemap.xml", parsed.locations);
    expect(parsed.locations).not.toContain(`${SITE_URL}/products/one-question-reading`);
    expect(parsed.locations).not.toContain(`${SITE_URL}/products/blueprint-report`);
    expect(response.headers.get("cache-control")).toBe(SITEMAP_CACHE_CONTROL);
    expect(response.headers.get("cache-control")).not.toContain("must-revalidate");
  });

  test("birthday and compatibility sitemap routes return 200 cached XML", async () => {
    const cases = [
      {
        path: "/sitemap-cardology.xml",
        response: getCardologySitemap(),
        count: 367,
        required: [
          `${SITE_URL}/born-on/`,
          `${SITE_URL}/born-on/january-1`,
          `${SITE_URL}/born-on/february-29`,
          `${SITE_URL}/born-on/december-31`,
        ],
        forbidden: `${SITE_URL}/born-on/february-30`,
      },
      {
        path: "/sitemap-compatibility.xml",
        response: getCompatibilitySitemap(),
        count: 1431,
        required: [
          `${SITE_URL}/compatibility/`,
          `${SITE_URL}/compatibility/ace-of-hearts`,
          `${SITE_URL}/compatibility/ace-of-hearts-and-ace-of-hearts`,
          `${SITE_URL}/compatibility/queen-of-hearts-and-ace-of-clubs`,
          `${SITE_URL}/compatibility/king-of-spades-and-king-of-spades`,
        ],
        forbidden: `${SITE_URL}/compatibility/ace-of-clubs-and-ace-of-hearts`,
      },
    ] as const;

    for (const item of cases) {
      const body = await item.response.text();
      const parsed = assertSitemapResponse({
        path: item.path,
        status: item.response.status,
        contentType: item.response.headers.get("content-type"),
        body,
      });
      expect(parsed.kind, item.path).toBe("urlset");
      expect(parsed.locations, item.path).toHaveLength(item.count);
      expect(new Set(parsed.locations).size, item.path).toBe(item.count);
      for (const loc of item.required) {
        expect(parsed.locations, loc).toContain(loc);
      }
      expect(parsed.locations, item.forbidden).not.toContain(item.forbidden);
      expect(item.response.headers.get("cache-control"), item.path).toBe(
        "public, max-age=3600, s-maxage=86400",
      );
      expect(parsed.locations[0], item.path).toBe(item.required[0]);
      expect(parsed.locations.at(-1), item.path).toBe(
        item.required[item.required.length - 1],
      );
    }
  });

  test("the HTTP probe covers Googlebot and Bingbot", () => {
    expect(SITEMAP_PROBE_USER_AGENTS.join("\n")).toContain("Googlebot");
    expect(SITEMAP_PROBE_USER_AGENTS.join("\n")).toContain("bingbot");
  });

  test("robots.txt advertises the three sitemap routes and nothing else", () => {
    const doc = robots();
    const advertised = Array.isArray(doc.sitemap)
      ? doc.sitemap
      : doc.sitemap
        ? [doc.sitemap]
        : [];
    expect(advertised).toEqual(ROBOTS_SITEMAP_PATHS.map((path) => `${SITE_URL}${path}`));
    expect([...ROBOTS_SITEMAP_PATHS]).toEqual([
      "/sitemap.xml",
      "/sitemap-cardology.xml",
      "/sitemap-compatibility.xml",
    ]);
  });

  test("non-200 fails with the route, status, and body preview", () => {
    expect(() =>
      assertSitemapResponse({
        path: "/sitemap.xml",
        status: 500,
        contentType: "text/html; charset=utf-8",
        body: "<!DOCTYPE html><html><body>Internal Server Error</body></html>",
      }),
    ).toThrow(
      /sitemap route FAILED \/sitemap\.xml: HTTP 500, expected 200\. Body starts: <!DOCTYPE html>/,
    );
  });

  test("a directory sitemap 404 points to the app handler and upstream routing", () => {
    expect(() =>
      assertSitemapResponse({
        path: "/sitemap-compatibility.xml",
        status: 404,
        contentType: "text/html",
        body: "Not Found",
      }),
    ).toThrow(/static app handler.*upstream routing/);
  });

  test("200 with a non-XML content type fails", () => {
    expect(() =>
      assertSitemapResponse({
        path: "/sitemap-cardology.xml",
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: urlset(["https://cardblueprints.com/born-on/january-1"]),
      }),
    ).toThrow(/sitemap route FAILED \/sitemap-cardology\.xml: Content-Type is not XML/);
  });

  test("200 XML that is not a sitemap document fails", () => {
    expect(() =>
      assertSitemapResponse({
        path: "/sitemap.xml",
        status: 200,
        contentType: "application/xml; charset=utf-8",
        body: '<?xml version="1.0"?><error>nope</error>',
      }),
    ).toThrow(/body is not a parseable sitemap urlset or sitemap index/);
  });

  test("accepts a urlset and a sitemap index, including text/xml", () => {
    const cardology = assertSitemapResponse({
      path: "/sitemap-cardology.xml",
      status: 200,
      contentType: "application/xml",
      body: urlset(
        ["https://cardblueprints.com/born-on/january-1"],
        "<changefreq>monthly</changefreq>",
      ),
    });
    expect(cardology.kind).toBe("urlset");
    expect(cardology.locations).toEqual(["https://cardblueprints.com/born-on/january-1"]);

    const index = assertSitemapResponse({
      path: "/sitemap.xml",
      status: 200,
      contentType: "text/xml; charset=utf-8",
      body: `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${NS}">
<sitemap><loc>https://cardblueprints.com/sitemap-cardology.xml</loc></sitemap>
</sitemapindex>
`,
    });
    expect(index.kind).toBe("sitemapindex");
    expect(index.locations).toEqual(["https://cardblueprints.com/sitemap-cardology.xml"]);
  });

  test("an unclosed urlset is not parseable", () => {
    expect(
      parseSitemapXml(
        `<?xml version="1.0"?><urlset xmlns="${NS}"><url><loc>https://cardblueprints.com/</loc></url>`,
      ),
    ).toBeNull();
  });

  test("an empty urlset fails", () => {
    expect(() =>
      assertSitemapResponse({
        path: "/sitemap.xml",
        status: 200,
        contentType: "application/xml",
        body: `<?xml version="1.0"?><urlset xmlns="${NS}"></urlset>`,
      }),
    ).toThrow(/urlset XML has no <loc> entries/);
  });

  test("main sitemap locs that include the Blueprint Report fail", () => {
    expect(() =>
      assertBlueprintReportStaysOffMainSitemap("/sitemap.xml", [
        `${SITE_URL}/products/one-question-reading`,
        `${SITE_URL}/products/blueprint-report`,
      ]),
    ).toThrow(/lists \/products\/blueprint-report/);
  });

  test("robots.txt Sitemap lines are the three route paths", () => {
    const body = `User-Agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/sitemap-cardology.xml\nSitemap: ${SITE_URL}/sitemap-compatibility.xml\n`;
    expect(sitemapPathsFromRobots(body)).toEqual([...ROBOTS_SITEMAP_PATHS]);
    assertRobotsAdvertisesSitemapPaths(200, body);
  });

  test("robots.txt that drops a sitemap fails", () => {
    expect(() => assertRobotsAdvertisesSitemapPaths(200, "User-Agent: *\nAllow: /\n")).toThrow(
      /sitemap route FAILED \/robots\.txt: advertises \(none\)/,
    );
  });
});
