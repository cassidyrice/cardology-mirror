"use client";

import { useMemo, useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import type { CalendarRow } from "@/lib/content-engine/prompt";
import type { StoredCalendar } from "@/lib/content-engine/storage";
import {
  MAX_GENERATIONS_PER_DAY,
  dayGenerations,
  type WrittenPiece,
} from "@/lib/content-engine/write-counters";
import {
  PIECE_KINDS,
  pieceKindLabel,
  type PieceKind,
} from "@/lib/content-engine/write-prompt";

type WriteMode = "paid" | "sample";

type ContentCalendarViewProps = {
  calendar: StoredCalendar;
  sessionId: string;
  mode: WriteMode;
  business?: string;
  startDate?: string;
};

type WriteState = {
  loading: boolean;
  error: string;
};

export function ContentCalendarView({
  calendar,
  sessionId,
  mode,
  business = "",
  startDate = "",
}: ContentCalendarViewProps) {
  const [pieces, setPieces] = useState(calendar.pieces ?? {});
  const [counters, setCounters] = useState(calendar.counters ?? {});
  const [writeState, setWriteState] = useState<Record<string, WriteState>>({});

  const allPieces = useMemo(() => {
    const list: { day: number; kind: PieceKind; piece: WrittenPiece }[] = [];
    for (const [dayKey, dayPieces] of Object.entries(pieces)) {
      const day = Number(dayKey);
      for (const kind of PIECE_KINDS) {
        const piece = dayPieces?.[kind];
        if (piece) list.push({ day, kind, piece });
      }
    }
    return list.sort((a, b) => a.day - b.day || a.kind.localeCompare(b.kind));
  }, [pieces]);

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(calendar.csv)}`;
  const mdBlob = buildAllPiecesMarkdown(calendar, pieces);
  const mdHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(mdBlob)}`;

  async function writePiece(day: number, kind: PieceKind, regenerate = false) {
    const key = `${day}:${kind}`;
    setWriteState((s) => ({ ...s, [key]: { loading: true, error: "" } }));
    try {
      const res = await fetch("/api/content-engine/write", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, day, kind, regenerate }),
      });
      const data = (await res.json()) as {
        content?: string;
        error?: string;
        message?: string;
        generations?: number;
      };
      if (!res.ok || !data.content) {
        setWriteState((s) => ({
          ...s,
          [key]: {
            loading: false,
            error: data.message || "Could not write this piece.",
          },
        }));
        return;
      }
      const piece: WrittenPiece = {
        kind,
        content: data.content,
        generatedAt: new Date().toISOString(),
        regeneration: Math.max(0, (data.generations ?? 1) - 1),
      };
      setPieces((prev) => ({
        ...prev,
        [String(day)]: { ...(prev[String(day)] ?? {}), [kind]: piece },
      }));
      setCounters((prev) => ({
        ...prev,
        [String(day)]: { generations: data.generations ?? dayGenerations(prev, day) },
      }));
      trackClientFunnelEvent("engine_piece_written", {
        placement: mode === "paid" ? "checkout-success" : "content-engine-sample",
      });
      setWriteState((s) => ({ ...s, [key]: { loading: false, error: "" } }));
    } catch {
      setWriteState((s) => ({
        ...s,
        [key]: { loading: false, error: "Could not reach the writer." },
      }));
    }
  }

  return (
    <div>
      <div className="text-center">
        <h2 className="type-h2 text-brand-ink">
          {mode === "sample" ? "Your 7-day sample" : "Your 52-day calendar"}
        </h2>
        <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
          {mode === "sample"
            ? "Tap Write this ($29 plan) on any day to get the full 52-day calendar with writing for every day."
            : "52 days of content, written for you. Not a spreadsheet: tap any day and it writes the post. Starting " +
              `${calendar.startDate}. Re-download stays available for 30 days.`}
        </p>
        {mode === "paid" ? (
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href={csvHref} download="content-calendar-52.csv" className="accent-button large-button inline-flex">
            Download CSV
          </a>
          {allPieces.length > 0 ? (
            <a href={mdHref} download="content-calendar-written.md" className="paper-button large-button inline-flex">
              Download everything
            </a>
          ) : null}
        </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-6">
        {calendar.rows.map((row) => (
          <CalendarDayRow
            key={row.day}
            row={row}
            mode={mode}
            business={business}
            startDate={startDate}
            pieces={pieces[String(row.day)] ?? {}}
            generations={dayGenerations(counters, row.day)}
            writeState={writeState}
            onWrite={writePiece}
          />
        ))}
      </div>
    </div>
  );
}

function CalendarDayRow({
  row,
  mode,
  business,
  startDate,
  pieces,
  generations,
  writeState,
  onWrite,
}: {
  row: CalendarRow;
  mode: WriteMode;
  business: string;
  startDate: string;
  pieces: Partial<Record<PieceKind, WrittenPiece>>;
  generations: number;
  writeState: Record<string, WriteState>;
  onWrite: (day: number, kind: PieceKind, regenerate?: boolean) => void;
}) {
  const [kind, setKind] = useState<PieceKind>("article");
  const key = `${row.day}:${kind}`;
  const state = writeState[key];
  const existing = pieces[kind];
  const canRegenerate = generations < MAX_GENERATIONS_PER_DAY && Boolean(existing);

  return (
    <article className="border border-brand-ink p-4" data-calendar-day={row.day}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-brand-ink-soft">
          Day {row.day}
        </p>
        <p className="font-medium text-brand-ink">{row.theme}</p>
      </div>
      <p className="mt-2 text-sm text-brand-ink-soft">{row.why}</p>
      <p className="mt-2 text-sm text-brand-ink">{row.post}</p>
      <p className="mt-1 text-xs text-brand-ink-soft">Format: {row.format}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`write-kind-${row.day}`}>Piece type</label>
        <select
          id={`write-kind-${row.day}`}
          value={kind}
          onChange={(e) => setKind(e.target.value as PieceKind)}
          className="min-h-10 border border-brand-ink bg-brand-paper px-2 text-sm"
        >
          {PIECE_KINDS.map((k) => (
            <option key={k} value={k}>{pieceKindLabel(k)}</option>
          ))}
        </select>

        {mode === "sample" ? (
          <form
            method="POST"
            action="/checkout/content-calendar-52/session"
            className="inline"
            onSubmit={() =>
              trackClientFunnelEvent("engine_cta_clicked", {
                placement: "content-engine-sample-write",
              })
            }
          >
            <input type="hidden" name="business" value={business} />
            <input type="hidden" name="startDate" value={startDate} />
            <input type="hidden" name="source" value="content-engine" />
            <button type="submit" className="paper-button small-button">
              Write this ($29 plan) →
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              className="paper-button small-button"
              disabled={state?.loading || generations >= MAX_GENERATIONS_PER_DAY}
              onClick={() => onWrite(row.day, kind, Boolean(existing))}
            >
              {state?.loading ? "Writing…" : existing ? "Regenerate →" : "Write this →"}
            </button>
            {canRegenerate && existing ? (
              <span className="text-xs text-brand-ink-soft">
                {MAX_GENERATIONS_PER_DAY - generations} left today
              </span>
            ) : null}
          </>
        )}
      </div>

      {state?.error ? (
        <p role="alert" className="mt-2 text-sm text-brand-oxblood">{state.error}</p>
      ) : null}

      {Object.entries(pieces).map(([pieceKind, piece]) =>
        piece ? (
          <div key={pieceKind} className="mt-4 border-t border-brand-line pt-4 text-left">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-brand-ink-soft">
              {pieceKindLabel(pieceKind as PieceKind)} · Suggested. Check facts before posting.
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-serif text-sm leading-relaxed text-brand-ink">
              {piece.content}
            </pre>
          </div>
        ) : null,
      )}
    </article>
  );
}

function buildAllPiecesMarkdown(
  calendar: StoredCalendar,
  pieces: StoredCalendar["pieces"],
): string {
  const lines = [
    `# Content calendar — ${calendar.business}`,
    ``,
    `Start: ${calendar.startDate}`,
    ``,
  ];
  for (const row of calendar.rows) {
    lines.push(`## Day ${row.day}: ${row.theme}`, ``);
    lines.push(`**Why:** ${row.why}`, ``);
    lines.push(`**Post:** ${row.post}`, ``);
    const dayPieces = pieces?.[String(row.day)];
    if (dayPieces) {
      for (const kind of PIECE_KINDS) {
        const piece = dayPieces[kind];
        if (!piece) continue;
        lines.push(`### ${pieceKindLabel(kind)}`, ``, piece.content, ``);
      }
    }
    lines.push(`---`, ``);
  }
  return lines.join("\n");
}
