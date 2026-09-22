import { NextRequest, NextResponse } from "next/server";

import {
  CSP_REPORT_LIMIT,
  CSP_REPORT_WINDOW_MS,
  cspReportSource,
  parseCspReportBody,
  recordCspReport,
} from "@/lib/csp-report";
import { rateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_768;

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
  "cache-control": "no-store",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) {
    return jsonError(403, "invalid origin");
  }

  const limited = rateLimit(rateLimitKey(req, "csp-report"), {
    limit: CSP_REPORT_LIMIT,
    windowMs: CSP_REPORT_WINDOW_MS,
  });
  if (!limited.ok) {
    return jsonError(429, "too many reports", rateLimitHeaders(limited, CSP_REPORT_LIMIT));
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonError(413, "payload too large");
  }

  const source = cspReportSource(req.headers.get("content-type"));
  if (!source) {
    return jsonError(415, "unsupported content type");
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return jsonError(413, "payload too large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError(400, "invalid JSON");
  }

  const result = parseCspReportBody(parsed, source);
  if (!result.ok) {
    return jsonError(400, "invalid report");
  }

  for (const line of result.lines) {
    recordCspReport(line);
  }

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function originAllowed(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return true;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const requestHost = (req.headers.get("host") ?? req.nextUrl.host).toLowerCase();
  if (originUrl.host.toLowerCase() === requestHost) return true;

  try {
    return originUrl.origin === new URL(SITE_URL).origin;
  } catch {
    return false;
  }
}

function jsonError(
  status: number,
  error: string,
  extra?: HeadersInit,
): NextResponse {
  return NextResponse.json(
    { error },
    { status, headers: { ...CORS_HEADERS, ...headersToObject(extra) } },
  );
}

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}
