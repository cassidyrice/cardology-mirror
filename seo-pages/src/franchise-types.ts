import type { CardRef } from "./types";

export type FranchiseSource = Readonly<{
  name: string;
  url: string;
  role: "primary_grant_date" | "year_crosscheck_only";
  retrieved: string;
  license?: string;
}>;

export type FranchiseCard = CardRef &
  Readonly<{
    symbol: string;
    meaning_page: string;
    core_identity: string;
    sweet_spot: string;
    life_direction: string;
  }>;

export type Franchise = {
  slug: string;
  name: string;
  conference: "AFC" | "NFC";
  division: "East" | "North" | "South" | "West";
  grant_date: string;
  grant_date_precision: "day";
  grant_date_status: "verified";
  hof_row_name: string;
  hof_franchise_date_raw: string;
  hof_years_of_operation: string;
  hof_league_mark: "AFL" | "AAFC" | null;
  hof_notes: readonly string[];
  wikipedia_first_season_label: string;
  wikipedia_years: readonly number[];
  year_crosscheck:
    | "year_mentioned"
    | "grant_precedes_first_season"
    | "wikipedia_lists_older_year";
  solar_value: number;
  card: FranchiseCard;
  afl_1959_08_14_quintet: boolean;
  same_card_slugs: readonly string[];
  same_grant_day_slugs: readonly string[];
  sources: readonly FranchiseSource[];
};
