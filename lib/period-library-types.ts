import type { PlanetName } from "./types";

export interface PeriodArtifact {
  id: string;
  cardCode: string;
  planet: PlanetName;
  title: string;
  omenLine: string;
  longReading: string[];
  shadowWatch: string;
  practice: string;
  reflection: string;
  yearlyContext: string;
  personOrPosture: string | null;
  significance: "threshold" | "karmic" | "structural" | "standard";
  sourceReferences: string[];
}

export type YearlyRole = "Long Range" | "Pluto" | "Result" | "Environment" | "Displacement";

export interface YearlyArtifact {
  id: string;
  cardCode: string;
  role: YearlyRole;
  title: string;
  reading: string;
  reflection: string;
  sourceReferences: string[];
}

/** Only this birthday year's selected text crosses the server/client boundary. */
export interface AppReadingLibrary {
  periods: PeriodArtifact[];
  year: Partial<Record<YearlyRole, YearlyArtifact>>;
}
