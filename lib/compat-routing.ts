// Edge-safe routing for /compatibility (used by middleware). Generated from the
// ported cardology-unlock Worker (lib/worker-port/cardology-unlock.mjs):
// `order` is the Worker's canonical card order, `byDate` maps "m-d" to the
// birth card slug (null = Joker / December 31).
import routing from "./compat-routing.json";

const ORDER: string[] = routing.order;
const IDX = new Map(ORDER.map((slug, i) => [slug, i]));
const BY_DATE = routing.byDate as Record<string, string | null>;
const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

/** Canonical "/compatibility/a-and-b" for a pair slug in either order, or null if not a pair. */
export function canonicalCompatPairPath(slug: string): string | null {
  const parts = slug.split("-and-");
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  const ia = IDX.get(a), ib = IDX.get(b);
  if (ia === undefined || ib === undefined) return null;
  return ia <= ib ? `/compatibility/${a}-and-${b}` : `/compatibility/${b}-and-${a}`;
}

function parseCompatDate(v: FormDataEntryValue | null): [number, number] | null {
  if (typeof v !== "string") return null;
  const m2 = /^(?:\d{4}-)?(\d{1,2})-(\d{1,2})$/.exec(v.trim());
  if (!m2) return null;
  const m = +m2[1], d = +m2[2];
  if (m < 1 || m > 12 || d < 1 || d > DIM[m - 1]) return null;
  return [m, d];
}

/** Worker's no-JS calculator POST: two dates -> pair page (or the Joker birthday page). */
export function compatPathFromForm(form: FormData): string | null {
  const qa = parseCompatDate(form.get("a")), qb = parseCompatDate(form.get("b"));
  if (!qa || !qb) return null;
  const ka = BY_DATE[`${qa[0]}-${qa[1]}`], kb = BY_DATE[`${qb[0]}-${qb[1]}`];
  if (ka === null || kb === null) {
    const j = ka === null ? qa : qb;
    return `/born-on/${MONTHS[j[0] - 1]}-${j[1]}`;
  }
  return canonicalCompatPairPath(`${ka}-and-${kb}`);
}
