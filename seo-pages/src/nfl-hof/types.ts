export type DobCrosscheck = "match";

export type HofRow = {
  qid: string;
  name: string;
  slug: string;
  hof_id: string;
  hof_url: string;
  induction_year: string | null;
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
  wikipedia_birth_date: string | null;
  hof_birth_date: string | null;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldHof = {
  name: string;
  slug: string;
  hof_id: string;
  reason: string;
  wikipedia_birth_date: string | null;
  hof_birth_date: string | null;
  wikidata_birth_date: string | null;
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
  life_direction?: string;
  under?: string;
  over?: string;
};
