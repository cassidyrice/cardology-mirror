import { NextRequest, NextResponse } from "next/server";

import { contentCalendarsKv } from "@/lib/content-engine/kv";
import { readStoredCalendar } from "@/lib/content-engine/storage";
import {
  createVideoJobFromCheckout,
  readVideoJob,
  writeVideoJob,
} from "@/lib/content-engine/video-jobs";
import { videoJobsKv } from "@/lib/content-engine/video-kv";
import {
  parseVideoAssetKeys,
  type VideoFormat,
  VIDEO_FORMATS,
  isVideoOfferSlug,
} from "@/lib/content-video";
import { isPieceKind } from "@/lib/content-engine/write-prompt";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const JOB_RATE_SCOPE = "content-engine-video-job";
const JOB_LIMIT = 60;
const JOB_WINDOW_MS = 60 * 60 * 1000;

function isVideoFormat(value: string): value is VideoFormat {
  return VIDEO_FORMATS.some((f) => f.value === value);
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")?.trim() ?? "";
  if (!jobId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const kv = videoJobsKv();
  const job = await readVideoJob(jobId, kv);
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    offerSlug: job.offerSlug,
    format: job.format,
    voiceAddon: job.voiceAddon,
    day: job.day,
    pieceKind: job.pieceKind,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    hasOutput: Boolean(job.outputMp4Key),
  });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, JOB_RATE_SCOPE), {
    limit: JOB_LIMIT,
    windowMs: JOB_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const checkoutSessionId =
    typeof body.checkoutSessionId === "string" ? body.checkoutSessionId.trim() : "";
  const calendarSessionId =
    typeof body.calendarSessionId === "string" ? body.calendarSessionId.trim() : "";
  const offerSlug =
    typeof body.offerSlug === "string" ? body.offerSlug.trim() : "";
  const format =
    typeof body.format === "string" ? body.format.trim() : "vertical-short-60";
  const voiceAddon = body.voiceAddon === true;
  const day = typeof body.day === "number" ? body.day : Number(body.day);
  const pieceKind = typeof body.pieceKind === "string" ? body.pieceKind : "";
  const assetKeys = parseVideoAssetKeys(
    typeof body.assetKeys === "string"
      ? body.assetKeys
      : JSON.stringify(body.assetKeys ?? {}),
  );
  const customerEmail =
    typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";

  if (
    !checkoutSessionId ||
    !calendarSessionId ||
    !isVideoOfferSlug(offerSlug) ||
    offerSlug === "video-voice-addon" ||
    !isVideoFormat(format)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const calendarsKv = contentCalendarsKv();
  const calendar = await readStoredCalendar(calendarSessionId, calendarsKv);
  if (!calendar) {
    return NextResponse.json(
      { error: "calendar_required", message: "Paid Content Calendar required." },
      { status: 403 },
    );
  }

  let scriptContent = "";
  if (offerSlug === "video-single") {
    if (!Number.isFinite(day) || day < 1 || day > 52 || !isPieceKind(pieceKind)) {
      return NextResponse.json({ error: "invalid_day_or_kind" }, { status: 400 });
    }
    const piece = calendar.pieces?.[String(day)]?.[pieceKind];
    if (!piece?.content) {
      return NextResponse.json(
        {
          error: "script_required",
          message: "Write the script for this day before ordering video.",
        },
        { status: 400 },
      );
    }
    scriptContent = piece.content;
  }

  const jobsKv = videoJobsKv();
  const existing = await readVideoJob(checkoutSessionId, jobsKv);
  if (existing) {
    return NextResponse.json({ jobId: existing.jobId, status: existing.status });
  }

  const job = createVideoJobFromCheckout({
    checkoutSessionId,
    calendarSessionId,
    offerSlug,
    format,
    voiceAddon,
    day: Number.isFinite(day) ? day : undefined,
    pieceKind: isPieceKind(pieceKind) ? pieceKind : undefined,
    scriptContent: scriptContent || undefined,
    business: calendar.business,
    assets: assetKeys,
    customerEmail: customerEmail || undefined,
  });

  const saved = await writeVideoJob(job, jobsKv);
  if (!saved) {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ jobId: job.jobId, status: job.status });
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, JOB_RATE_SCOPE), {
    limit: JOB_LIMIT,
    windowMs: JOB_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  const calendarSessionId =
    typeof body.calendarSessionId === "string" ? body.calendarSessionId.trim() : "";
  const assetKeys = parseVideoAssetKeys(
    typeof body.assetKeys === "string"
      ? body.assetKeys
      : JSON.stringify(body.assetKeys ?? {}),
  );

  if (!jobId || !calendarSessionId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const kv = videoJobsKv();
  const job = await readVideoJob(jobId, kv);
  if (!job || job.calendarSessionId !== calendarSessionId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = {
    ...job,
    assets: assetKeys,
    status: "queued" as const,
    updatedAt: new Date().toISOString(),
  };
  const saved = await writeVideoJob(updated, kv);
  if (!saved) {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ jobId: updated.jobId, status: updated.status });
}
