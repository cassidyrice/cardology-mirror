export type DobCrosscheck = "match";

export type TimePotyHonor = {
  year: string;
  choice_label: string;
  shared: boolean;
  wikipedia_list_url: string;
  time_context_url: string;
};

export type TimePotyRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_list_url: string;
  time_context_url: string;
  honors: readonly TimePotyHonor[];
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
};

export type HeldTimePoty = {
  name: string;
  slug: string;
  wikipedia_title: string;
  reason: string;
  year?: string | null;
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
  gifts?: readonly string[];
  life_direction?: string;
};
