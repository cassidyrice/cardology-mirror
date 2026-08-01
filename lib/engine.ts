import type { Reading } from "./types";
import { buildReading, JokerNotSupportedError, ReadingError } from "./reading";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export class EngineError extends Error {
  // Machine-readable refusal code preserved for API routes. Contract for
  // app/api/{reading,deepdive,storyarc}: when code === "JOKER_UNSUPPORTED",
  // respond 422 with honest Dec-31/Joker copy — never a generic 500. The
  // real gate (date input + checkout) is app-pair surface; this code is the
  // engine-side guarantee that a Joker birthdate can no longer produce a
  // silent K♠ reading.
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export type EngineErrorResponse = {
  status: number;
  body: { error: string; code?: string };
};

/**
 * Single mapping from a thrown engine error to the HTTP shape the API routes
 * return. Framework-free on purpose (no next/server import) so lib/engine.ts
 * stays edge- and test-importable; each route wraps this in NextResponse.json.
 *
 * - `JOKER_UNSUPPORTED` → **422**, never 500. Dec 31 is a valid date the
 *   product does not cover; a 500 would report it as a server fault and is the
 *   liability the typed refusal exists to remove.
 * - invalid date strings → 400 (unchanged behaviour).
 * - anything else → 500.
 */
export function engineErrorResponse(e: unknown): EngineErrorResponse {
  if (e instanceof EngineError) {
    if (e.code === "JOKER_UNSUPPORTED") {
      return { status: 422, body: { error: e.message, code: e.code } };
    }
    if (e.message.startsWith("invalid")) {
      return { status: 400, body: { error: e.message } };
    }
    return { status: 500, body: { error: e.message } };
  }
  return { status: 500, body: { error: "internal error" } };
}

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
    const code = e instanceof JokerNotSupportedError ? e.code : undefined;
    return Promise.reject(new EngineError(msg, code));
  }
}
