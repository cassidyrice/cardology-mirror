export type NobelPrize = {
  year: string;
  category: string;
  category_full: string;
  motivation: string | null;
  portion: string | null;
};

export type NobelRow = {
  qid: string;
  nobel_id: string;
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
  nobel_url: string;
  prizes: readonly NobelPrize[];
  nobel_birth_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: "match";
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
