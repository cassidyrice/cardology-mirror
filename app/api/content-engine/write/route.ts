import { NextRequest, NextResponse } from "next/server";

import { GeminiConfigError, generatePieceWithGemini } from "@/lib/content-engine/gemini";
import { fixtureStoredCalendar, STUB_SESSION_ID } from "@/lib/content-engine/fixture-session";
import { contentCalendarsKv } from "@/lib/content-engine/kv";
import {
  readStoredCalendar,
  writeStoredCalendar,
  type StoredCalendar,
} from "@/lib/content-engine/storage";
import {
  applyGeneration,
  canGenerate,
  dayKey,
  nextRegenerationIndex,
  type WrittenPiece,
} from "@/lib/content-engine/write-counters";
import { isPieceKind, pieceKindLabel } from "@/lib/content-engine/write-prompt";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const WRITE_RATE_SCOPE = "content-engine-write";
const WRITE_LIMIT = 30;
const WRITE_WINDOW_MS = 60 * 60 * 1000;

const STUB_PIECE =
  "## Sharing the good stuff\n\nWe're giving our partners an extra dozen croissants this week. Same sourdough, same schedule — we just had room on the tray.";

function weekHeaderForDay(calendar: StoredCalendar, day: number): string {
  const weekIndex = Math.floor((day - 1) / 7);
  return calendar.weekHeaders[weekIndex] ?? calendar.weekHeaders[0] ?? "";
}

function stubEnabled(): boolean {
  return process.env.CONTENT_ENGINE_TEST_STUB === "1";
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(rateLimitKey(req, WRITE_RATE_SCOPE), {
    limit: WRITE_LIMIT,
    windowMs: WRITE_WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many writes. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const day = typeof body.day === "number" ? body.day : Number(body.day);
  const kind = body.kind;
  const regenerate = body.regenerate === true;

  if (!sessionId || !Number.isFinite(day) || day < 1 || day > 52 || !isPieceKind(kind)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const kv = contentCalendarsKv();
  let calendar = await readStoredCalendar(sessionId, kv);
  if (!calendar && stubEnabled() && sessionId === STUB_SESSION_ID) {
    calendar = fixtureStoredCalendar(sessionId);
    await writeStoredCalendar(calendar, kv);
  }
  if (!calendar) {
    return NextResponse.json({ error: "calendar_not_found" }, { status: 404 });
  }

  const row = calendar.rows.find((r) => r.day === day);
  if (!row) {
    return NextResponse.json({ error: "day_not_found" }, { status: 404 });
  }

  const pieces = calendar.pieces ?? {};
  const counters = calendar.counters ?? {};
  const existing = pieces[dayKey(day)]?.[kind];

  if (existing && !regenerate) {
    return NextResponse.json({
      day,
      kind,
      content: existing.content,
      cached: true,
      generations: counters[dayKey(day)]?.generations ?? 0,
    });
  }

  const allowed = canGenerate(counters, day);
  if (!allowed.ok) {
    return NextResponse.json(
      {
        error: allowed.reason,
        message:
          allowed.reason === "day_limit"
            ? "This day already has two regenerations. Pick another day."
            : "Calendar generation limit reached.",
      },
      { status: 429 },
    );
  }

  let content: string;
  try {
    if (stubEnabled() && sessionId === STUB_SESSION_ID) {
      content = `${STUB_PIECE}\n\n(${pieceKindLabel(kind)} stub for day ${day})`;
    } else {
      content = await generatePieceWithGemini({
        business: calendar.business,
        weekHeader: weekHeaderForDay(calendar, day),
        day: row,
        kind,
      });
    }
  } catch (error) {
    if (error instanceof GeminiConfigError) {
      return NextResponse.json({ error: "warming_up" }, { status: 503 });
    }
    console.warn("[content-engine/write] generation failed", error);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  const piece: WrittenPiece = {
    kind,
    content,
    generatedAt: new Date().toISOString(),
    regeneration: nextRegenerationIndex(counters, day),
  };

  const dayPieces = { ...(pieces[dayKey(day)] ?? {}), [kind]: piece };
  const nextPieces = { ...pieces, [dayKey(day)]: dayPieces };
  const nextCounters = applyGeneration(counters, day);

  const updated: StoredCalendar = {
    ...calendar,
    pieces: nextPieces,
    counters: nextCounters,
  };
  await writeStoredCalendar(updated, kv);

  return NextResponse.json({
    day,
    kind,
    content: piece.content,
    cached: false,
    generations: nextCounters[dayKey(day)]?.generations ?? 0,
  });
}
