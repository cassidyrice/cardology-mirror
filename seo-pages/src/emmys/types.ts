export type DobCrosscheck = "match";

export type EmmyWin = {
  year: string;
  category_id: string;
  label: string;
  category_full: string;
  genre: string;
  acting: "actor" | "actress";
  program: string | null;
  role: string | null;
  list_url: string;
  performance_note: string | null;
};

export type EmmyRow = {
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
  emmys_url: string;
  wins: readonly EmmyWin[];
  wikipedia_birth_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};

export type EmmyProvenance = {
  people_count: number;
  catalog_wins: number;
  catalog_people: number;
  kept: number;
  excluded: number;
  by_reason: Record<string, number>;
};
