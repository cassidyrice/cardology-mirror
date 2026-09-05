import { NextRequest, NextResponse } from "next/server";

import { contentCalendarsKv } from "@/lib/content-engine/kv";
import { readStoredCalendar } from "@/lib/content-engine/storage";
import {
  buildVideoAssetKey,
  isUploadField,
  UPLOAD_LIMITS,
  validateUploadFile,
} from "@/lib/content-engine/video-upload";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const UPLOAD_RATE_SCOPE = "content-engine-video-upload";
const UPLOAD_LIMIT = 40;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

type R2Bucket = {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
};

async function getVideoAssetsBucket(): Promise<R2Bucket | null> {
  try {
    // @ts-expect-error — R2 binding injected by Cloudflare
    if (typeof VIDEO_ASSETS !== "undefined") {
      // @ts-expect-error
      return VIDEO_ASSETS as R2Bucket;
    }
  } catch {
    /* not on Cloudflare */
  }
  return null;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, UPLOAD_RATE_SCOPE), {
    limit: UPLOAD_LIMIT,
    windowMs: UPLOAD_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const bucket = await getVideoAssetsBucket();
  if (!bucket && process.env.CONTENT_ENGINE_TEST_STUB !== "1") {
    return NextResponse.json(
      { error: "unavailable", message: "Uploads are not configured yet." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const calendarSessionIdRaw = form.get("calendarSessionId");
  const fieldRawValue = form.get("field");
  const calendarSessionId =
    typeof calendarSessionIdRaw === "string" ? calendarSessionIdRaw.trim() : "";
  const fieldRaw =
    typeof fieldRawValue === "string" ? fieldRawValue.trim() : "";

  if (!calendarSessionId || !isUploadField(fieldRaw)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const kv = contentCalendarsKv();
  const calendar = await readStoredCalendar(calendarSessionId, kv);
  if (!calendar) {
    return NextResponse.json(
      { error: "calendar_not_found", message: "Paid calendar required before video upload." },
      { status: 403 },
    );
  }

  const files = form.getAll("files").filter((entry) => entry instanceof File) as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "no_files" }, { status: 400 });
  }

  const maxCount = UPLOAD_LIMITS[fieldRaw].maxCount;
  if (files.length > maxCount) {
    return NextResponse.json(
      { error: "too_many_files", message: `Max ${maxCount} file(s) for ${fieldRaw}.` },
      { status: 400 },
    );
  }

  const keys: string[] = [];
  for (const file of files) {
    const validation = validateUploadFile(fieldRaw, {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json(
        { error: "invalid_file", message: validation.reason },
        { status: 400 },
      );
    }

    const key = buildVideoAssetKey(calendarSessionId, fieldRaw, file.name);
    const bytes = await file.arrayBuffer();

    if (process.env.CONTENT_ENGINE_TEST_STUB === "1") {
      keys.push(key);
      continue;
    }

    await bucket!.put(key, bytes, {
      httpMetadata: { contentType: file.type || undefined },
    });
    keys.push(key);
  }

  return NextResponse.json({
    field: fieldRaw,
    keys,
    audio: fieldRaw === "audio" ? keys[0] : undefined,
  });
}
