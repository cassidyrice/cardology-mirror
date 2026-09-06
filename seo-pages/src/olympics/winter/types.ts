export type DobCrosscheck = "match";

export type WinterMedalistRow = {
  qid: string;
  name: string;
  slug: string;
  nation: string;
  sport: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_list_url: string;
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldWinterMedalist = {
  name: string;
  slug?: string;
  wikipedia_title?: string;
  nation?: string;
  sport?: string;
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
