export type DobCrosscheck = "match";

export type KennedyCenterCrosscheck = "match" | "not_published" | "unavailable";

export type KennedyCenterRole = "solo" | "member";

export type KennedyCenterHonor = {
  year: string;
  act: string;
  act_wikipedia_title: string;
  role: KennedyCenterRole;
  kennedy_center_url: string;
};

export type KennedyCenterRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  kennedy_center_url: string;
  wikipedia_list_url: string;
  primary_role: KennedyCenterRole;
  honors: readonly KennedyCenterHonor[];
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  kennedy_center_birth_date: string | null;
  kennedy_center_crosscheck: KennedyCenterCrosscheck;
};

export type HeldKennedyCenter = {
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
  gifts?: readonly string[];
  life_direction?: string;
};
