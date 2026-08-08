import type { ElroyReading } from "./types";

type ReadingCopy = ElroyReading["reading"];

/** Per-card copy overrides only when composed engine text fails audit. */
export const ELROY_COPY_OVERRIDES: Partial<
  Record<string, Partial<ReadingCopy>>
> = {
  // Intentionally empty until the 52-card audit requires a patch.
};
