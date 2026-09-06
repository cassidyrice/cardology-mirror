export type DobCrosscheck = "match";

export type HouseRoleKind = "leadership" | "chair";

export type HouseParty = "Democrat" | "Republican";

export type HouseChairRow = {
  qid: string;
  name: string;
  slug: string;
  office: string;
  office_id: string;
  role_kind: HouseRoleKind;
  sort_order: number;
  party: HouseParty;
  state: string;
  state_slug: string;
  postal: string;
  district: number;
  bioguide: string;
  committee_thomas_id: string | null;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  wikipedia_infobox_date: string;
  wikidata_birth_date: string;
  bioguide_birth_date: string;
  dob_crosscheck: DobCrosscheck;
  bioguide_url: string;
  congress_url: string;
  history_house_url: string;
  house_gov_url: string;
};

export type HeldHouseChair = {
  name: string;
  slug: string;
  office: string;
  reason: string;
  wikipedia_infobox_date: string | null;
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
  gifts?: readonly string[];
  life_direction?: string;
};
