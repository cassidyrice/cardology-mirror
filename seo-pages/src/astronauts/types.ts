export type DobCrosscheck = "match";

export type AstronautRow = {
  qid: string;
  name: string;
  slug: string;
  status: string;
  group: string;
  flights: number;
  entry_year: string;
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
  nasa_url: string;
  nasa_birth_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldAstronaut = {
  name: string;
  slug: string;
  status: string;
  reason: string;
  nasa_birth: string | null;
  wikidata_birth_date: string | null;
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
