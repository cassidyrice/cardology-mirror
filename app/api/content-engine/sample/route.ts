import { NextRequest, NextResponse } from "next/server";

import { recordFunnelEvent } from "@/lib/analytics-server";
import { GeminiConfigError, generateCalendarWithGemini } from "@/lib/content-engine/gemini";
import { parseIsoDate, buildSampleStructure } from "@/lib/content-engine/structure";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const SAMPLE_LIMIT = 5;
const SAMPLE_WINDOW_MS = 60 * 60 * 1000;
const MAX_BUSINESS = 240;

function normalizeBusiness(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_BUSINESS);
}

function todayIsoUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, "content-engine-sample"), {
    limit: SAMPLE_LIMIT,
    windowMs: SAMPLE_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many samples. Try again in an hour." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const business = normalizeBusiness(body.business);
  if (business.length < 8) {
    return NextResponse.json(
      { error: "business_required", message: "Tell us the business in a sentence." },
      { status: 400 },
    );
  }

  const startRaw = typeof body.startDate === "string" ? body.startDate.trim() : "";
  const startDate = startRaw && parseIsoDate(startRaw) ? startRaw : todayIsoUtc();

  recordFunnelEvent({
    name: "engine_sample_requested",
    source: "server",
    path: "/content-engine",
    offerSlug: "content-calendar-52",
  });

  const cacheKey = `content-engine-sample:${startDate}:${await sha256Hex(business.toLowerCase())}`;
  try {
    const cacheStorage = caches as unknown as { default: Cache };
    const cache = cacheStorage.default;
    const cached = await cache.match(new Request(`https://cache.local/${cacheKey}`));
    if (cached) {
      return new NextResponse(cached.body, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-content-engine-cache": "hit",
        },
      });
    }
  } catch {
    // Cache API may be unavailable in local Node; continue.
  }

  let structure;
  try {
    structure = buildSampleStructure(startDate);
  } catch {
    return NextResponse.json({ error: "invalid_start_date" }, { status: 400 });
  }

  try {
    const generated = await generateCalendarWithGemini({
      business,
      days: structure,
      model: "gemini-2.5-flash",
    });

    if (generated.rows.length < 1) {
      return NextResponse.json(
        { error: "parse_failed", message: "Could not read the sample calendar." },
        { status: 502 },
      );
    }

    const payload = {
      startDate,
      weekHeaders: generated.weekHeaders,
      rows: generated.rows,
      // Structure stays server-side for the LLM; not returned to the page.
    };

    const response = NextResponse.json(payload);
    try {
      const cacheStorage = caches as unknown as { default: Cache };
      const cache = cacheStorage.default;
      await cache.put(
        new Request(`https://cache.local/${cacheKey}`),
        new Response(JSON.stringify(payload), {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=86400",
          },
        }),
      );
    } catch {
      // ignore
    }

    recordFunnelEvent({
      name: "engine_sample_shown",
      source: "server",
      path: "/content-engine",
      offerSlug: "content-calendar-52",
    });

    return response;
  } catch (error) {
    if (error instanceof GeminiConfigError) {
      return NextResponse.json(
        {
          error: "warming_up",
          message: "Sample engine is warming up",
        },
        { status: 503 },
      );
    }
    console.warn("[content-engine/sample]", error);
    return NextResponse.json(
      { error: "generation_failed", message: "Could not build the sample." },
      { status: 502 },
    );
  }
}
