"use client";

// localStorage CRUD + a small React hook for journal entries.
// Each entry pins the prompt it answered and the cards governing that day,
// so a re-read of the entry stays card-faithful even after the reading rolls on.

import { useCallback, useEffect, useState } from "react";
import { todayISO } from "@/lib/cards";

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD the entry was written/anchored to
  prompt: string; // the reflection question being answered
  body: string;
  cards?: string[]; // governing card glyphs, e.g. ["10♥", "Q♣"]
  updatedAt: string; // ISO timestamp, used for sort + edit tracking
}

const KEY = "cardology.journal";
const EVENT = "cardology:journal";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: JournalEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  emit();
}

function newId(): string {
  return `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Input for create (date+prompt+body required) or update (id + any subset).
export type SaveInput =
  | (Omit<JournalEntry, "id" | "updatedAt"> & { id?: undefined })
  | (Partial<JournalEntry> & { id: string });

// Create or update. Pass an `id` to update; omit it to create.
export function saveEntry(input: SaveInput): JournalEntry {
  const entries = loadEntries();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = entries.findIndex((e) => e.id === input.id);
    if (idx >= 0) {
      const updated: JournalEntry = {
        ...entries[idx],
        ...input,
        id: input.id,
        updatedAt: now,
      };
      entries[idx] = updated;
      persist(entries);
      return updated;
    }
  }
  const created: JournalEntry = {
    id: newId(),
    date: input.date ?? todayISO(),
    prompt: input.prompt ?? "",
    body: input.body ?? "",
    cards: input.cards,
    updatedAt: now,
  };
  entries.push(created);
  persist(entries);
  return created;
}

export function deleteEntry(id: string) {
  const entries = loadEntries().filter((e) => e.id !== id);
  persist(entries);
}

// Reactive hook. `ready` flips true after first client read (avoids SSR flash).
export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const sorted = loadEntries().sort((a, b) =>
      (b.updatedAt ?? b.date ?? "").localeCompare(a.updatedAt ?? a.date ?? ""),
    );
    setEntries(sorted);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const on = () => refresh();
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, [refresh]);

  const save = useCallback(
    (input: SaveInput) => {
      const result = saveEntry(input);
      refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      deleteEntry(id);
      refresh();
    },
    [refresh],
  );

  return { entries, ready, save, remove };
}
