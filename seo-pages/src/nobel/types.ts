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
