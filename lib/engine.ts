import type { Reading } from "./types";
import { buildReading, ReadingError } from "./reading";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export class EngineError extends Error {}

/**
 * Run the deterministic engine for a birthdate (and optional target date).
 * Both dates are ISO `YYYY-MM-DD`. Returns the parsed structured Reading.
 *
 * This is now a pure-JS port of the former Python CLI engine (no child_process,
 * no fs at request time) so the app deploys to Cloudflare. The card math lives
 * in lib/engine-core/ (verified byte-identical to the Python engine) and the
 * reading assembly lives in lib/reading.ts.
 */
export function getReading(
  birthdate: string,
  targetDate?: string,
): Promise<Reading> {
  if (!ISO.test(birthdate)) {
    return Promise.reject(new EngineError(`invalid birthdate: ${birthdate}`));
  }
  if (targetDate && !ISO.test(targetDate)) {
    return Promise.reject(new EngineError(`invalid target date: ${targetDate}`));
  }

  try {
    return Promise.resolve(buildReading(birthdate, targetDate));
  } catch (e) {
    const msg = e instanceof ReadingError || e instanceof Error ? e.message : String(e);
    return Promise.reject(new EngineError(msg));
  }
}
