import type { CardRef } from "../types";

export type BornOnPerson = {
  qid: string;
  name: string;
  slug: string;
  birth_date: string;
  wikidata_birth_date: string;
  card: string;
  views: number;
  source_text: string;
  source_url: string;
  wikipedia_title: string;
  month: number;
  day: number;
};

export type BornOnDayRow = {
  slug: string;
  month: number;
  day: number;
  label: string;
  card: string;
  people_count: number;
  qids: readonly string[];
};

export type BornOnDayPage = BornOnDayRow & {
  cardRef: CardRef;
  people: readonly BornOnPerson[];
};

export type BornOnExclusion = {
  qid: string | null;
  name: string;
  reason: string;
  birth_date: string | null;
};

export type BornOnProvenance = {
  kept: number;
  excluded: number;
  harvest_dropped: number;
  days: number;
  days_with_people: number;
  days_empty: number;
  empty_slugs: readonly string[];
  catalog_by_reason: Record<string, number>;
  catalog_exclusions: readonly BornOnExclusion[];
};

export type CardMeaning = {
  symbol: string;
  label: string;
  slug: string;
  title: string;
  core_identity: string;
  sweet_spot: string;
};
