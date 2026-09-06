export type DobCrosscheck = "match";

export type GovernorRow = {
  qid: string;
  name: string;
  slug: string;
  state: string;
  state_slug: string;
  postal: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_list_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  nga_url: string | null;
  ballotpedia_url: string;
};

export type HeldGovernor = {
  name: string;
  slug: string;
  state: string;
  reason: string;
  wikipedia_list_date: string | null;
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
