export type TonyCategory =
  | "actor_play"
  | "actress_play"
  | "actor_musical"
  | "actress_musical";

export type TonyWin = {
  year: string;
  category: TonyCategory;
  category_label: string;
  category_full: string;
  production: string;
  role: string;
  wikipedia_list_url: string;
};

export type TonyRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  /**
   * Full Wikipedia lead section (Action API `prop=extracts&exintro`), same
   * article and licence as `source_text`, just more of it. Populated by
   * `python3 -m pipeline.wikipedia_intro`. Optional so older rows still load.
   */
  source_text_full?: string;
  source_url: string;
  wikipedia_title: string;
  tony_url: string;
  wins: readonly TonyWin[];
  wikipedia_birth_date: string | null;
  wikidata_birth_date: string;
  dob_crosscheck: "match" | "wikidata_only";
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};

export type TonysProvenance = {
  people_count?: number;
  catalog_wins?: number;
  catalog_people?: number;
  kept?: number;
  excluded?: number;
  scope?: {
    note?: string;
    through?: string;
    not_awarded?: readonly string[];
    omit?: readonly string[];
  };
};
