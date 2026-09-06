export type DobCrosscheck = "match";

export type OlympicMedal = {
  year: string;
  games: string;
  event: string;
  sport: string;
  event_qid: string;
};

export type OlympicRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  gold_count: number;
  sports: readonly string[];
  country: string;
  medals: readonly OlympicMedal[];
};

export type HeldOlympian = {
  name: string;
  qid: string;
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
