export type DobCrosscheck = "match";

export type RockHallRole = "solo" | "member";

export type RockHallInduction = {
  year: string;
  act: string;
  act_wikipedia_title: string;
  category: string;
  category_id: "performers";
  role: RockHallRole;
  rockhall_url: string;
};

export type RockHallRow = {
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
  rockhall_url: string;
  wikipedia_list_url: string;
  primary_role: RockHallRole;
  inductions: readonly RockHallInduction[];
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldRockHall = {
  name: string;
  slug: string;
  wikipedia_title: string;
  reason: string;
  wikipedia_infobox_date: string | null;
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
