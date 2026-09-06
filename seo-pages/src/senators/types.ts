export type DobCrosscheck = "match";

export type SenatorParty = "Democrat" | "Republican" | "Independent";

export type SenatorRow = {
  qid: string;
  name: string;
  slug: string;
  state: string;
  state_slug: string;
  postal: string;
  senate_class: string;
  party: SenatorParty;
  bioguide: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_list_date: string;
  wikidata_birth_date: string;
  bioguide_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  bioguide_url: string;
  congress_url: string;
};

export type HeldSenator = {
  name: string;
  slug: string;
  state: string;
  reason: string;
  wikipedia_list_date: string | null;
  bioguide_birth_date: string | null;
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
