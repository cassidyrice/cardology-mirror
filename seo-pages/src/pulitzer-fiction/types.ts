export type DobCrosscheck = "match";

export type PulitzerOrgCrosscheck = "match" | "not_published" | "unavailable";

export type PulitzerAward = {
  year: string;
  work: string;
  category: string;
  category_id: "fiction";
  pulitzer_url: string;
  shared: boolean;
};

export type PulitzerRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  pulitzer_url: string;
  awards: readonly PulitzerAward[];
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  pulitzer_org_birth_date: string | null;
  pulitzer_org_crosscheck: PulitzerOrgCrosscheck;
};

export type HeldPulitzer = {
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
