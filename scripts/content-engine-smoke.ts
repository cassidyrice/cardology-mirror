#!/usr/bin/env bun
/**
 * Content Engine production smoke (E2). One sample POST. Opt-in / dry-run safe.
 *
 * Dry-run (default) — prints the request, does not hit the network:
 *   bun scripts/content-engine-smoke.ts
 *
 * Live — POST one sample to production:
 *   bun scripts/content-engine-smoke.ts --live
 *   CONTENT_ENGINE_SMOKE_LIVE=1 bun scripts/content-engine-smoke.ts
 *
 * Optional URL override (still requires --live / CONTENT_ENGINE_SMOKE_LIVE=1):
 *   CONTENT_ENGINE_SMOKE_URL=https://cardblueprints.com bun scripts/content-engine-smoke.ts --live
 *
 * Not part of `bun run test`. Do not wire this into CI.
 *
 * Production Vertex secrets (VERTEX_SA_JSON, VERTEX_PROJECT, VERTEX_LOCATION)
 * live on the Pages project. This script does not need them locally and never
 * prints env values. If production returns 503 warming_up, those secrets are
 * missing on Pages.
 */

const FIXED_BUSINESS = "Kalispell bakery";
const FIXED_START_DATE = "2026-09-05";
const DEFAULT_URL = "https://cardblueprints.com";
const SAMPLE_PATH = "/api/content-engine/sample";

function printHelp(): void {
  console.log(`Content Engine production smoke (E2).

Dry-run (default):
  bun scripts/content-engine-smoke.ts

Live against production:
  bun scripts/content-engine-smoke.ts --live
  CONTENT_ENGINE_SMOKE_LIVE=1 bun scripts/content-engine-smoke.ts

Optional URL:
  CONTENT_ENGINE_SMOKE_URL=https://cardblueprints.com bun scripts/content-engine-smoke.ts --live

Not called from bun run test.`);
}

function isLive(argv: string[]): boolean {
  if (argv.includes("--live")) return true;
  const flag = (process.env.CONTENT_ENGINE_SMOKE_LIVE || "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function baseUrl(): string {
  const raw = (process.env.CONTENT_ENGINE_SMOKE_URL || DEFAULT_URL).trim();
  return raw.replace(/\/$/, "") || DEFAULT_URL;
}

function payload() {
  return { business: FIXED_BUSINESS, startDate: FIXED_START_DATE };
}

function missingSecretsMessage(status: number, error?: string): string | null {
  if (status === 503 || error === "warming_up") {
    return [
      "Production sample returned warming_up (503).",
      "VERTEX_SA_JSON, VERTEX_PROJECT, and VERTEX_LOCATION are missing on the Pages project",
      "(GEMINI_API_KEY is the local-only fallback). Put the Vertex secrets on cardology-mirror, then retry.",
    ].join(" ");
  }
  return null;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return 0;
  }
  const unknown = argv.filter((a) => a !== "--live" && a !== "--help" && a !== "-h");
  if (unknown.length > 0) {
    console.error(`Unknown argument: ${unknown[0]}. Try --help.`);
    return 2;
  }

  const url = `${baseUrl()}${SAMPLE_PATH}`;
  const body = payload();

  if (!isLive(argv)) {
    console.log("DRY RUN. Would POST (not sent):");
    console.log(`  ${url}`);
    console.log(`  ${JSON.stringify(body)}`);
    console.log("Re-run with --live (or CONTENT_ENGINE_SMOKE_LIVE=1) to hit production.");
    console.log("This script is opt-in and is not part of bun run test.");
    return 0;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Smoke request failed: ${message}`);
    return 1;
  }

  const text = await response.text();
  let parsed: { error?: string; message?: string; rows?: unknown[] } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    parsed = {};
  }

  const secrets = missingSecretsMessage(response.status, parsed.error);
  if (secrets) {
    console.error(secrets);
    return 2;
  }

  if (!response.ok) {
    const detail = parsed.message || parsed.error || text.slice(0, 200);
    console.error(`Smoke failed: HTTP ${response.status} ${detail}`);
    return 1;
  }

  const rows = Array.isArray(parsed.rows) ? parsed.rows.length : 0;
  const cache = response.headers.get("x-content-engine-cache") || "miss";
  if (rows < 1) {
    console.error("Smoke failed: production returned no sample rows.");
    return 1;
  }
  console.log(`OK: ${rows} sample rows (cache=${cache}) for "${FIXED_BUSINESS}" starting ${FIXED_START_DATE}.`);
  return 0;
}

const code = await main();
process.exit(code);
