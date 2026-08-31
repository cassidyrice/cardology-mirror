"use client";

import { useMemo } from "react";

import { todayISO } from "@/lib/cards";
import { currentChapterFor } from "@/lib/current-chapter";

export function CurrentChapter({ birthdate }: { birthdate: string }) {
  const chapter = useMemo(
    () => currentChapterFor(birthdate, todayISO()),
    [birthdate],
  );
  if (!chapter) return null;

  return (
    <div className="w-full max-w-md border border-brand-line bg-brand-paper px-4 py-3 text-center">
      <p className="type-eyebrow mb-2">This 52-day stretch</p>
      <p className="font-serif text-lg text-brand-ink">
        {chapter.planet}. {chapter.cardLabel}.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        The Deep Dive maps the rest of the year around this stretch.
      </p>
    </div>
  );
}
