export type DobCrosscheck = "match";

export type GrammyAward = {
  year: string;
  ceremony_number: number;
  album: string;
  grammy_url: string;
  billed_act: string;
  category: string;
  category_id: "album-of-the-year";
};

export type GrammyBilling = "primary" | "band_member";

export type GrammyRow = {
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
  grammy_url: string;
  billing: GrammyBilling;
  billed_act: string;
  awards: readonly GrammyAward[];
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldGrammy = {
  name: string;
  slug: string;
  wikipedia_title: string;
  reason: string;
  wikipedia_infobox_date: string | null;
  wikidata_birth_date: string | null;
};

export type GrammyBand = {
  name: string;
  wikipedia_title: string;
  action: "expanded" | "omitted";
  reason: string;
  members_kept: string[];
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
