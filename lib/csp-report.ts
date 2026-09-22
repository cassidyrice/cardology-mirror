// Redacts browser CSP violation reports down to a short operable line.
// Query strings, userinfo, script samples, and the original policy are dropped
// so a checkout question or a Stripe token in the document URL never lands in
// logs. The header that triggers these reports stays report-only.

export const CSP_REPORT_LIMIT = 60;
export const CSP_REPORT_WINDOW_MS = 60_000;
const MAX_REPORTS = 10;

export type CspReportSource = "report-uri" | "report-to";

export type CspDisposition = "report" | "enforce" | "unknown";

export type CspReportLine = {
  directive: string;
  blockedHost: string;
  documentPath: string;
  disposition: CspDisposition;
  source: CspReportSource;
};

export type CspParseResult =
  | { ok: true; lines: CspReportLine[] }
  | { ok: false };

type CspAnalyticsDataset = {
  writeDataPoint(data: {
    indexes?: string[];
    blobs?: string[];
    doubles?: number[];
  }): void;
};

const CSP_KEYS = [
  "effectiveDirective",
  "effective-directive",
  "violatedDirective",
  "violated-directive",
  "blockedURL",
  "blocked-uri",
  "blockedUri",
  "documentURL",
  "document-uri",
  "documentUri",
] as const;

export function cspReportSource(contentType: string | null): CspReportSource | null {
  const media = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (media) {
    case "application/csp-report":
    case "application/json":
      return "report-uri";
    case "application/reports+json":
      return "report-to";
    default:
      return null;
  }
}

export function parseCspReportBody(
  parsed: unknown,
  source: CspReportSource,
): CspParseResult {
  switch (source) {
    case "report-uri":
      return parseLegacy(parsed, source);
    case "report-to":
      return parseReportingApi(parsed, source);
    default: {
      const exhaustive: never = source;
      return exhaustive;
    }
  }
}

export function formatCspReportLine(line: CspReportLine): string {
  return `[csp-report] directive=${line.directive} blockedHost=${line.blockedHost} documentPath=${line.documentPath} disposition=${line.disposition} source=${line.source}`;
}

export function blockedHostFromUri(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "unknown";
  const lower = trimmed.toLowerCase();
  if (
    lower === "inline" ||
    lower === "eval" ||
    lower === "self" ||
    lower === "wasm-eval" ||
    lower === "trusted-types-policy" ||
    lower === "trusted-types-sink"
  ) {
    return lower;
  }
  if (lower.startsWith("data:")) return "data";
  if (lower.startsWith("blob:")) return "blob";
  if (lower.startsWith("filesystem:")) return "filesystem";
  try {
    const url = new URL(trimmed);
    if (url.host) return sanitizeField(url.host, 200) || "unknown";
    const scheme = url.protocol.replace(/:$/, "");
    return sanitizeField(scheme, 32) || "unknown";
  } catch {
    return sanitizeField(trimmed, 200) || "unknown";
  }
}

export function documentPathFromUri(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "unknown";
  try {
    const url = new URL(trimmed, "https://cardblueprints.com");
    const path = url.pathname || "/";
    const safe = sanitizeField(path, 180);
    if (!safe.startsWith("/")) return "unknown";
    return safe;
  } catch {
    return "unknown";
  }
}

// Logs always. Analytics Engine dataset `cardblueprints_csp` is a second copy
// when the Pages binding is present. Failures there must not fail the POST.
export function recordCspReport(
  line: CspReportLine,
  dataset: CspAnalyticsDataset | null = readCspDataset(),
): void {
  console.info(formatCspReportLine(line));
  if (!dataset) return;
  try {
    dataset.writeDataPoint({
      indexes: [line.directive.slice(0, 96) || "unknown"],
      blobs: [
        line.directive,
        line.blockedHost,
        line.documentPath,
        line.disposition,
        line.source,
      ],
      doubles: [1],
    });
  } catch {
    // The log line already holds the redacted report.
  }
}

function parseLegacy(parsed: unknown, source: CspReportSource): CspParseResult {
  const record = asRecord(parsed);
  if (!record) return { ok: false };
  const wrapped = record["csp-report"];
  if (wrapped !== undefined) {
    const body = asRecord(wrapped);
    if (!body) return { ok: false };
    const line = lineFromBody(body, source);
    return { ok: true, lines: line ? [line] : [] };
  }
  if (!looksLikeCsp(record)) return { ok: false };
  const line = lineFromBody(record, source);
  return { ok: true, lines: line ? [line] : [] };
}

function parseReportingApi(parsed: unknown, source: CspReportSource): CspParseResult {
  if (!Array.isArray(parsed)) return { ok: false };
  const lines: CspReportLine[] = [];
  for (const item of parsed) {
    if (lines.length >= MAX_REPORTS) break;
    const record = asRecord(item);
    if (!record) continue;
    if ("type" in record && record.type !== "csp-violation" && record.type !== "csp") {
      continue;
    }
    const body = asRecord(record.body);
    if (!body) continue;
    const line = lineFromBody(body, source);
    if (line) lines.push(line);
  }
  return { ok: true, lines };
}

function lineFromBody(
  body: Record<string, unknown>,
  source: CspReportSource,
): CspReportLine | null {
  const directiveRaw = stringField(
    body,
    "effectiveDirective",
    "effective-directive",
    "violatedDirective",
    "violated-directive",
  );
  const blockedRaw = stringField(body, "blockedURL", "blocked-uri", "blockedUri");
  const documentRaw = stringField(body, "documentURL", "document-uri", "documentUri");
  if (!directiveRaw && !blockedRaw && !documentRaw) return null;
  return {
    directive: directiveToken(directiveRaw),
    blockedHost: blockedHostFromUri(blockedRaw),
    documentPath: documentPathFromUri(documentRaw),
    disposition: dispositionOf(body),
    source,
  };
}

function looksLikeCsp(record: Record<string, unknown>): boolean {
  return CSP_KEYS.some((key) => key in record);
}

function directiveToken(value: string): string {
  const token = value.trim().split(/\s+/)[0] ?? "";
  return sanitizeField(token.toLowerCase(), 64) || "unknown";
}

function dispositionOf(body: Record<string, unknown>): CspDisposition {
  const raw = stringField(body, "disposition").trim().toLowerCase();
  switch (raw) {
    case "report":
    case "enforce":
      return raw;
    default:
      return "unknown";
  }
}

function stringField(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function sanitizeField(value: string, max: number): string {
  return value.replace(/[^A-Za-z0-9._:/-]/g, "").slice(0, max);
}

// next-on-pages stashes { env, cf, ctx } on this symbol for the request.
// Reading it here avoids importing @cloudflare/next-on-pages, whose module
// require()s `server-only` and cannot load under `bun test`.
const CLOUDFLARE_REQUEST_CONTEXT = Symbol.for("__cloudflare-request-context__");

function readCspDataset(): CspAnalyticsDataset | null {
  try {
    const holder = globalThis as unknown as Record<symbol, { env?: { CSP_REPORTS?: CspAnalyticsDataset } } | undefined>;
    return holder[CLOUDFLARE_REQUEST_CONTEXT]?.env?.CSP_REPORTS ?? null;
  } catch {
    return null;
  }
}
