// Import this selector from server routes only. The app receives seven readings,
// not the complete manuscript. No model call, API key or additional service.
import hearts from "../content/period-library/hearts.json";
import diamonds from "../content/period-library/diamonds.json";
import clubs from "../content/period-library/clubs.json";
import spades from "../content/period-library/spades.json";
import yearly from "../content/period-library/yearly-artifacts.json";
import type { CardApp } from "./card-app";
import type { AppReadingLibrary, PeriodArtifact, YearlyArtifact, YearlyRole } from "./period-library-types";

export const PERIOD_ARTIFACTS = [...hearts, ...diamonds, ...clubs, ...spades] as PeriodArtifact[];
export const YEARLY_ARTIFACTS = yearly as YearlyArtifact[];
const periods = new Map(PERIOD_ARTIFACTS.map((entry) => [`${entry.cardCode}.${entry.planet}`, entry]));
const years = new Map(YEARLY_ARTIFACTS.map((entry) => [`${entry.cardCode}.${entry.role}`, entry]));

export function appReadingLibrary(data: CardApp): AppReadingLibrary {
  const selected: AppReadingLibrary = { periods: [], year: {} };
  for (const period of data.year.periods) {
    const entry = periods.get(`${period.birth.card.code}.${period.planet}`);
    if (!entry) throw new Error(`Missing period reading: ${period.birth.card.code}.${period.planet}`);
    selected.periods.push(entry);
  }
  const cards: [YearlyRole, string | undefined][] = [
    ["Long Range", data.year.birth.longRange.card.code],
    ["Pluto", data.year.birth.pluto.card.code],
    ["Result", data.year.birth.result.card.code],
    ["Environment", data.year.environment?.card.code],
    ["Displacement", data.year.displacement?.card.code],
  ];
  for (const [role, code] of cards) {
    if (!code) continue;
    const entry = years.get(`${code}.${role}`);
    if (!entry) throw new Error(`Missing yearly reading: ${code}.${role}`);
    selected.year[role] = entry;
  }
  return selected;
}
