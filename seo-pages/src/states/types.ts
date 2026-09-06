import type { CardRef } from "../types";

export const DATE_KINDS = ["ratification", "admission"] as const;
export type DateKind = (typeof DATE_KINDS)[number];

export type StateAdmissionRow = {
  slug: string;
  name: string;
  postal: string;
  admission_order: number;
  admission_date: string;
  date_kind: DateKind;
  original_thirteen: boolean;
  wikipedia_list: string;
  wikidata_qid: string;
  wikidata_p571_iso: string;
  wikidata_p571_extra: readonly string[];
  disputed_date: string | null;
  crs_report: string;
  crs_table: string;
  crs_pdf: string;
  crs_html: string;
  wikipedia_list_url: string;
  /** State's own Wikipedia article, used for the lead-section prose. */
  wikipedia_title?: string;
  source_url?: string;
  /**
   * Wikipedia lead section (Action API `prop=extracts&exintro`), CC BY-SA 4.0.
   * Populated by `python3 -m pipeline.wikipedia_intro`.
   */
  source_text_full?: string;
};

export type StatePage = StateAdmissionRow & {
  card: CardRef;
  month: number;
  day: number;
};

export const TERRITORY_SLUGS = [
  "district-of-columbia",
  "dc",
  "washington-dc",
  "puerto-rico",
  "guam",
  "american-samoa",
  "us-virgin-islands",
  "u-s-virgin-islands",
  "northern-mariana-islands",
] as const;

export const REQUIRED_SHARED_MONTH_DAYS = [
  { month: 6, day: 1, slugs: ["kentucky", "tennessee"] as const },
  { month: 2, day: 14, slugs: ["oregon", "arizona"] as const },
] as const;

export const ADDITIONAL_SHARED_MONTH_DAYS = [
  { month: 11, day: 2, slugs: ["north-dakota", "south-dakota"] as const },
  { month: 5, day: 29, slugs: ["rhode-island", "wisconsin"] as const },
  { month: 3, day: 1, slugs: ["ohio", "nebraska"] as const },
] as const;
