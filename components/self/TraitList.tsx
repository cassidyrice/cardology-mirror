"use client";

import { toLines } from "@/lib/cards";

// Gifts (sage) and Shadow (ember) rendered for one card.
// `shadow` is prose, not bullets — render as a single self-protective-pattern paragraph.
export function GiftList({ gifts, accent }: { gifts: string; accent?: string }) {
  const lines = toLines(gifts);
  const color = accent ?? "var(--sage, #7fae8f)";
  return (
    <ul className="space-y-3">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <span className="text-[0.97rem] leading-relaxed text-mist">{line}</span>
        </li>
      ))}
    </ul>
  );
}

// Card-labelled grouping so the reader sees which engine a trait belongs to.
export function TraitGroup({
  cardCode,
  cardLabel,
  children,
}: {
  cardCode: string;
  cardLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <p className="eyebrow mb-3">
        <span className="text-gold">{cardCode}</span> · {cardLabel}
      </p>
      {children}
    </div>
  );
}
