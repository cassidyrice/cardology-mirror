import type { CardRef } from "../types";

export type MlbSource = Readonly<{
  name: string;
  url: string;
  role: "primary_first_game" | "game_log_corroboration" | "year_crosscheck_only";
  retrieved: string;
  license?: string;
}>;

export type MlbCard = CardRef &
  Readonly<{
    symbol: string;
    meaning_page: string;
    core_identity: string;
    sweet_spot: string;
    life_direction: string;
  }>;

export type MlbClub = {
  slug: string;
  name: string;
  league: "AL" | "NL";
  division: "East" | "Central" | "West";
  first_game: string;
  first_game_precision: "day";
  first_game_status: "verified";
  first_season_name: string;
  first_game_line: string;
  bbref_code: string;
  bbref_first_season_code: string;
  bbref_first_season_url: string;
  bbref_franchise_url: string;
  retrosheet_url: string;
  notes: readonly string[];
  wikipedia_first_season_label: string;
  wikipedia_years: readonly number[];
  year_crosscheck:
    | "year_mentioned"
    | "first_game_precedes_wikipedia_join"
    | "wikipedia_lists_older_year";
  solar_value: number;
  card: MlbCard;
  expansion_1969_04_08_quartet: boolean;
  aa_1882_05_02_trio: boolean;
  same_card_slugs: readonly string[];
  same_first_game_day_slugs: readonly string[];
  sources: readonly MlbSource[];
  /** Wikipedia article for this entity, used for the record section. */
  wikipedia_title?: string;
  source_url?: string;
  /** Wikipedia lead section (CC BY-SA 4.0), via pipeline.wikipedia_intro. */
  source_text_full?: string;
};
