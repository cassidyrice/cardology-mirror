import NOTES from "./card-reading-notes.json";

export type CardReadingNotes = {
  reading: string;
  love: string;
  work: string;
  timing: string;
};

const TABLE = NOTES as Record<string, CardReadingNotes>;

export function readingNotesFor(slug: string): CardReadingNotes | null {
  const entry = TABLE[slug];
  if (!entry) return null;
  if (
    typeof entry.reading !== "string" ||
    typeof entry.love !== "string" ||
    typeof entry.work !== "string" ||
    typeof entry.timing !== "string"
  ) {
    return null;
  }
  return entry;
}
