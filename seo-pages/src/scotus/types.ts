export type ScotusRole = "Chief Justice of the United States" | "Associate Justice";

export type ScotusRow = {
  qid: string;
  name: string;
  slug: string;
  role: ScotusRole;
  seniority: number;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  scotus_url: string;
  scotus_birth_date: string;
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
