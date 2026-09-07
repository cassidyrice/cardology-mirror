import catalog from "./tattoos.json";

export type TattooEntry = {
  slug: string;
  label: string;
  rank: string;
  suit: string;
  body: string;
  bodyLabel: string;
  image: string;
  pipCount: number;
};

const ALL = catalog as TattooEntry[];
const BY_SLUG = new Map(ALL.map((row) => [row.slug, row]));

export function allTattoos(): TattooEntry[] {
  return ALL;
}

export function tattooFor(slug: string): TattooEntry | undefined {
  return BY_SLUG.get(slug);
}
