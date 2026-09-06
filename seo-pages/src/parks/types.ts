import type { CardRef } from "../types";

export const PRIOR_KINDS = [
  "national_monument",
  "authorization",
  "reservation",
  "national_lakeshore",
  "national_river",
  "national_recreation_area",
  "memorial",
  "other_national_park",
] as const;
export type PriorKind = (typeof PRIOR_KINDS)[number];

export type PriorDesignation = {
  kind: PriorKind;
  date: string;
  date_precision: "day" | "year";
  label: string;
  source: "nps_park_anniversaries";
  source_url: string;
};

export type ParkRow = {
  slug: string;
  name: string;
  official_name: string;
  established_order: number;
  established_date: string;
  date_kind: "national_park";
  locations: readonly string[];
  wikipedia_list: string;
  wikipedia_list_url: string;
  wikipedia_list_column: string;
  wikipedia_title: string;
  wikipedia_retrieved: string;
  nps_anniversaries_url: string;
  nps_anniversaries_retrieved: string;
  prior_designation: PriorDesignation | null;
  date_note: string | null;
  /** Wikipedia article for this entity, used for the record section. */
  wikipedia_title?: string;
  source_url?: string;
  /** Wikipedia lead section (CC BY-SA 4.0), via pipeline.wikipedia_intro. */
  source_text_full?: string;
};

export type ParkPage = ParkRow & {
  card: CardRef;
  month: number;
  day: number;
};

export const ALASKA_ANILCA_SLUGS = [
  "gates-of-the-arctic",
  "glacier-bay",
  "katmai",
  "kenai-fjords",
  "kobuk-valley",
  "lake-clark",
  "wrangell-st-elias",
] as const;

export const REQUIRED_SHARED_CLUSTERS = [
  {
    id: "alaska-anilca-1980-12-02",
    month: 12,
    day: 2,
    year: 1980,
    iso: "1980-12-02",
    label: "December 2, 1980 Alaska ANILCA",
    slugs: ALASKA_ANILCA_SLUGS,
  },
] as const;

export const ADDITIONAL_SHARED_MONTH_DAYS = [
  {
    month: 2,
    day: 26,
    slugs: ["denali", "acadia", "grand-canyon", "grand-teton"] as const,
  },
  {
    month: 10,
    day: 31,
    slugs: ["american-samoa", "death-valley", "joshua-tree"] as const,
  },
  {
    month: 10,
    day: 2,
    slugs: ["north-cascades", "redwood"] as const,
  },
  {
    month: 11,
    day: 10,
    slugs: ["badlands", "theodore-roosevelt", "congaree"] as const,
  },
  {
    month: 3,
    day: 4,
    slugs: ["hot-springs", "kings-canyon"] as const,
  },
  {
    month: 7,
    day: 1,
    slugs: ["mammoth-cave", "haleakala"] as const,
  },
] as const;
