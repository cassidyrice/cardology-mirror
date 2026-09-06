export type PresidencyTerm = {
  ordinal: string | null;
  start: string | null;
  end: string | null;
};

export type DobCrosscheck = "match" | "mismatch" | "missing";

export type PresidentRow = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  death_date: string | null;
  card: string;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  terms: readonly PresidencyTerm[];
  wikipedia_month_day: string | null;
  dob_crosscheck: DobCrosscheck;
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
