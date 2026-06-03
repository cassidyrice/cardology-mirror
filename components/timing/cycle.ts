// Timing math for the 7-period planetary year.
// Each period is ~PERIOD_DAYS (52) days, starting Mercury on the most recent birthday.
import { PLANET_ORDER, PERIOD_DAYS, type PlanetName } from "@/lib/types";

const MS_PER_DAY = 86_400_000;

export interface PeriodWindow {
  planet: PlanetName;
  index: number; // 0..6
  start: Date;
  end: Date; // exclusive boundary of next period
  durationDays: number;
}

export interface CycleInfo {
  birthdayThisCycle: Date; // the birthday that opened the current 364-day cycle
  windows: PeriodWindow[];
  // index of the period containing `today` (0..6); clamped to range.
  currentIndex: number;
  daysIntoCurrent: number;
}

// Parse a "YYYY-MM-DD" birthdate into month/day (year ignored for cycle math).
function parseBirthdate(birthdate: string): { month: number; day: number } {
  const [y, m, d] = birthdate.split("-").map((n) => parseInt(n, 10));
  // Guard against malformed input.
  if (!y || !m || !d) {
    const now = new Date();
    return { month: now.getMonth() + 1, day: now.getDate() };
  }
  return { month: m, day: d };
}

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Most recent birthday on or before `ref`.
function mostRecentBirthday(month: number, day: number, ref: Date): Date {
  const y = ref.getFullYear();
  let bday = new Date(y, month - 1, day);
  if (atMidnight(bday) > atMidnight(ref)) {
    bday = new Date(y - 1, month - 1, day);
  }
  return atMidnight(bday);
}

export function buildCycle(birthdate: string, today: Date = new Date()): CycleInfo {
  const { month, day } = parseBirthdate(birthdate);
  const birthdayThisCycle = mostRecentBirthday(month, day, today);

  const windows: PeriodWindow[] = PLANET_ORDER.map((planet, index) => {
    const start = new Date(birthdayThisCycle);
    start.setDate(start.getDate() + index * PERIOD_DAYS);
    const end = new Date(start);
    end.setDate(end.getDate() + PERIOD_DAYS);
    return { planet, index, start, end, durationDays: PERIOD_DAYS };
  });

  const t = atMidnight(today).getTime();
  let currentIndex = windows.findIndex(
    (w) => t >= atMidnight(w.start).getTime() && t < atMidnight(w.end).getTime(),
  );
  if (currentIndex < 0) {
    // Past the 7th period (the ~10 leftover days before next birthday) — pin to Neptune.
    currentIndex = t < atMidnight(windows[0].start).getTime() ? 0 : windows.length - 1;
  }

  const daysIntoCurrent = Math.max(
    0,
    Math.round((t - atMidnight(windows[currentIndex].start).getTime()) / MS_PER_DAY),
  );

  return { birthdayThisCycle, windows, currentIndex, daysIntoCurrent };
}

const FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function formatRange(w: PeriodWindow): string {
  const lastDay = new Date(w.end);
  lastDay.setDate(lastDay.getDate() - 1);
  return `${FMT.format(w.start)} – ${FMT.format(lastDay)}`;
}
