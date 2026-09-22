/**
 * HTTP guard for the three sitemap routes advertised in robots.txt.
 *
 * Production (Worker in front of Pages) serves all three. A local `next dev`
 * serves /sitemap.xml only, so the Worker routes 404 there.
 *
 *   bun run test:sitemap:http
 *   SITEMAP_BASE_URL=http://127.0.0.1:3577 bun run test:sitemap:http
 *
 * `bun run test:sitemap` checks the app handler without a server.
 */
import { ROBOTS_SITEMAP_PATHS } from "../lib/site";
import {
  assertBlueprintReportStaysOffMainSitemap,
  assertRobotsAdvertisesSitemapPaths,
  checkSitemapUrl,
  sitemapRouteError,
} from "./sitemap-http";

const REQUEST_TIMEOUT_MS = 20_000;

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function report(line: string): void {
  process.stderr.write(`${line}\n`);
}

async function readRobots(url: string): Promise<{ status: number; body: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        accept: "text/plain,*/*",
        "cache-control": "no-cache",
        "user-agent": "CardBlueprints-Sitemap-Guard/1.0 (+https://cardblueprints.com)",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw sitemapRouteError(
      "/robots.txt",
      `request to ${url} did not complete within ${REQUEST_TIMEOUT_MS}ms (${message}).`,
    );
  }

  return { status: response.status, body: await response.text() };
}

async function main(): Promise<void> {
  const base = (process.env.SITEMAP_BASE_URL || "https://cardblueprints.com").replace(
    /\/$/,
    "",
  );
  const failures: string[] = [];

  try {
    const robots = await readRobots(`${base}/robots.txt`);
    assertRobotsAdvertisesSitemapPaths(robots.status, robots.body);
    report(
      `sitemap route OK /robots.txt: advertises ${ROBOTS_SITEMAP_PATHS.join(", ")}`,
    );
  } catch (error) {
    failures.push(failureMessage(error));
  }

  for (const path of ROBOTS_SITEMAP_PATHS) {
    try {
      const parsed = await checkSitemapUrl(`${base}${path}`, path);
      if (path === "/sitemap.xml") {
        assertBlueprintReportStaysOffMainSitemap(path, parsed.locations);
      }
      report(
        `sitemap route OK ${path}: HTTP 200 ${parsed.kind}, ${parsed.locations.length} locs`,
      );
    } catch (error) {
      failures.push(failureMessage(error));
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) report(failure);
    report(`sitemap route FAILED: ${failures.length} check(s) on ${base}`);
    process.exit(1);
  }

  report(`sitemap route OK: ${ROBOTS_SITEMAP_PATHS.length} routes on ${base}`);
}

main().catch((error) => {
  report(failureMessage(error));
  process.exit(1);
});
