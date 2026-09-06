export type DobCrosscheck = "match" | "mismatch" | "new_style" | "missing";
export type WikidataQa = "match" | "mismatch" | "missing" | "year_only";
export type CalendarNote = "new_style" | "nara_day";

export type SignerRow = {
  qid: string;
  name: string;
  slug: string;
  colony: string;
  colony_code: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  bioguide_id: string;
  nara_birth_raw: string;
  wikipedia_birth: string | null;
  dob_crosscheck: DobCrosscheck;
  calendar_note: CalendarNote;
  footnote: string | null;
  wikidata_date: string | null;
  wikidata_precision: number | null;
  wikidata_qa: WikidataQa;
};

export type HeldSigner = {
  name: string;
  slug: string;
  reason: string;
  nara_birth_raw: string;
  wikipedia_birth: string | null;
  footnote: string;
};

export type YearOnlySigner = {
  name: string;
  slug: string;
  nara_birth_raw: string;
  footnote: string;
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
