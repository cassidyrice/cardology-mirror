import type { PieceKind } from "./write-prompt";

/** One initial write plus two regenerations per calendar day. */
export const MAX_GENERATIONS_PER_DAY = 3;

/** 52 days × 3 generations — hard cap per purchased calendar. */
export const MAX_GENERATIONS_PER_CALENDAR = 52 * MAX_GENERATIONS_PER_DAY;

export type WrittenPiece = {
  kind: PieceKind;
  content: string;
  generatedAt: string;
  regeneration: number;
};

export type DayPieces = Partial<Record<PieceKind, WrittenPiece>>;

export type DayCounter = {
  generations: number;
};

export type CalendarPieces = Record<string, DayPieces>;
export type CalendarCounters = Record<string, DayCounter>;

export function dayKey(day: number): string {
  return String(day);
}

export function totalGenerations(counters: CalendarCounters | undefined): number {
  if (!counters) return 0;
  return Object.values(counters).reduce((sum, c) => sum + (c?.generations ?? 0), 0);
}

export function dayGenerations(
  counters: CalendarCounters | undefined,
  day: number,
): number {
  return counters?.[dayKey(day)]?.generations ?? 0;
}

export function canGenerate(
  counters: CalendarCounters | undefined,
  day: number,
): { ok: true; remaining: number } | { ok: false; reason: "day_limit" | "calendar_limit" } {
  if (totalGenerations(counters) >= MAX_GENERATIONS_PER_CALENDAR) {
    return { ok: false, reason: "calendar_limit" };
  }
  const dayCount = dayGenerations(counters, day);
  if (dayCount >= MAX_GENERATIONS_PER_DAY) {
    return { ok: false, reason: "day_limit" };
  }
  return { ok: true, remaining: MAX_GENERATIONS_PER_DAY - dayCount };
}

export function nextRegenerationIndex(
  counters: CalendarCounters | undefined,
  day: number,
): number {
  return dayGenerations(counters, day);
}

export function applyGeneration(
  counters: CalendarCounters | undefined,
  day: number,
): CalendarCounters {
  const key = dayKey(day);
  const next = { ...(counters ?? {}) };
  const current = next[key]?.generations ?? 0;
  next[key] = { generations: current + 1 };
  return next;
}
