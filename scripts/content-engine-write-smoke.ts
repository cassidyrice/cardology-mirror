#!/usr/bin/env bun
/**
 * Content Engine writing-layer production smoke (E5). One write POST.
 * Opt-in / dry-run safe. Not part of `bun run test`. Do not wire this into CI.
 *
 * Dry-run (default) — prints the request, does not hit the network:
 *   bun scripts/content-engine-write-smoke.ts
 *
 * Live — POST one newsletter write for day 1 of a paid calendar session:
 *   CONTENT_ENGINE_SMOKE_SESSION_ID=cs_xxx bun scripts/content-engine-write-smoke.ts --live
 *   CONTENT_ENGINE_SMOKE_LIVE=1 CONTENT_ENGINE_SMOKE_SESSION_ID=cs_xxx bun scripts/content-engine-write-smoke.ts
 *
 * Optional overrides (still require --live / CONTENT_ENGINE_SMOKE_LIVE=1):
 *   CONTENT_ENGINE_SMOKE_URL=https://cardblueprints.com
 *   CONTENT_ENGINE_SMOKE_DAY=1
 *   CONTENT_ENGINE_SMOKE_KIND=newsletter
 *
 * The session id must already own a calendar in the CONTENT_CALENDARS KV
 * binding (a paid checkout session). This script does not create one, does
 * not need local Vertex secrets, and never prints env values or the session id.
 *
 * Missing session / KV → exit 2 with a clear message (404 calendar_not_found).
 * Missing Vertex on Pages → exit 2 (503 warming_up) only if a new piece is generated.
 */

const DEFAULT_URL = "https://cardblueprints.com";
const WRITE_PATH = "/api/content-engine/write";
const DEFAULT_DAY = 1;
const DEFAULT_KIND = "newsletter";
const ALLOWED_KINDS = [
  "article",
  "short-video",
  "thread",
  "carousel",
  "newsletter",
] as const;

type PieceKind = (typeof ALLOWED_KINDS)[number];

function printHelp(): void {
  console.log(`Content Engine writing-layer production smoke (E5).

Dry-run (default):
  bun scripts/content-engine-write-smoke.ts

Live against production (one write):
  CONTENT_ENGINE_SMOKE_SESSION_ID=<paid-session-id> bun scripts/content-engine-write-smoke.ts --live

Optional:
  CONTENT_ENGINE_SMOKE_URL  CONTENT_ENGINE_SMOKE_DAY  CONTENT_ENGINE_SMOKE_KIND

Not called from bun run test. Never prints the session id or secrets.`);
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

function sessionId(): string {
  return (process.env.CONTENT_ENGINE_SMOKE_SESSION_ID || "").trim();
}

function smokeDay(): number {
  const raw = (process.env.CONTENT_ENGINE_SMOKE_DAY || "").trim();
  if (!raw) return DEFAULT_DAY;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_DAY;
}

function smokeKind(): PieceKind {
  const raw = (process.env.CONTENT_ENGINE_SMOKE_KIND || "").trim();
  if ((ALLOWED_KINDS as readonly string[]).includes(raw)) {
    return raw as PieceKind;
  }
  return DEFAULT_KIND;
}

function payload(id: string) {
  return {
    sessionId: id,
    day: smokeDay(),
    kind: smokeKind(),
    regenerate: false,
  };
}

function redactedPayload(id: string) {
  const body = payload(id);
  return {
    ...body,
    sessionId: id ? "(set)" : "(missing CONTENT_ENGINE_SMOKE_SESSION_ID)",
  };
}

function missingMessage(status: number, error?: string): string | null {
  if (status === 404 || error === "calendar_not_found") {
    return [
      "Production write returned calendar_not_found (404).",
      "CONTENT_CALENDARS KV has no calendar for this session, or the binding is missing.",
      "Use a paid checkout session id that already stored a 52-day calendar, then retry.",
    ].join(" ");
  }
  if (status === 503 || error === "warming_up") {
    return [
      "Production write returned warming_up (503).",
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

  const url = `${baseUrl()}${WRITE_PATH}`;
  const id = sessionId();
  const shown = redactedPayload(id);

  if (!isLive(argv)) {
    console.log("DRY RUN. Would POST (not sent):");
    console.log(`  ${url}`);
    console.log(`  ${JSON.stringify(shown)}`);
    console.log(
      "Re-run with --live and CONTENT_ENGINE_SMOKE_SESSION_ID set to hit production.",
    );
    console.log("This script is opt-in and is not part of bun run test.");
    return 0;
  }

  if (!id) {
    console.error(
      [
        "Missing CONTENT_ENGINE_SMOKE_SESSION_ID.",
        "The write path needs a paid calendar session already stored in CONTENT_CALENDARS KV.",
        "Set the env var to that Stripe checkout session id, then retry with --live.",
        "This script never prints the session id.",
      ].join(" "),
    );
    return 2;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload(id)),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Smoke request failed: ${message}`);
    return 1;
  }

  const text = await response.text();
  let parsed: {
    error?: string;
    message?: string;
    content?: string;
    cached?: boolean;
    day?: number;
    kind?: string;
  } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    parsed = {};
  }

  const missing = missingMessage(response.status, parsed.error);
  if (missing) {
    console.error(missing);
    return 2;
  }

  if (!response.ok) {
    const detail = parsed.message || parsed.error || text.slice(0, 200);
    console.error(`Smoke failed: HTTP ${response.status} ${detail}`);
    return 1;
  }

  const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
  if (!content) {
    console.error("Smoke failed: production returned no written content.");
    return 1;
  }

  const cached = parsed.cached === true ? "cached" : "generated";
  const kind = parsed.kind || shown.kind;
  const day = parsed.day ?? shown.day;
  console.log(
    `OK: day ${day} ${kind} ${cached} (${content.length} chars). Session id not printed.`,
  );
  return 0;
}

const code = await main();
process.exit(code);
