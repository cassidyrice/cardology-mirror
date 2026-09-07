// Render sample Yearly Timing Maps to a directory for eyeballing.
// bun scripts/timing-map-preview.ts <outDir> [birthdate ...]
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildTimingMapModel, TimingMapJokerError } from "../lib/timing-map/model";
import { renderTimingMapJokerSvg, renderTimingMapSvg } from "../lib/timing-map/render";

const [outDir = ".", ...dates] = process.argv.slice(2);
const birthdays = dates.length ? dates : ["1990-01-15", "1988-07-14", "1975-11-20", "1990-12-31"];
mkdirSync(outDir, { recursive: true });
for (const bd of birthdays) {
  let svg: string;
  try {
    svg = renderTimingMapSvg(buildTimingMapModel(bd));
  } catch (e) {
    if (!(e instanceof TimingMapJokerError)) throw e;
    svg = renderTimingMapJokerSvg(bd);
  }
  const file = join(outDir, `timing-map-${bd}.svg`);
  writeFileSync(file, svg);
  console.log(`wrote ${file} (${svg.length} bytes)`);
}
