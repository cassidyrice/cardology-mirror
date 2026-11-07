"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type SamplePanel = { id: string; label: string; text: string };

/**
 * Three plain text tabs (docs/design/DIRECTION.md §4). The active tab is told
 * apart by weight and ink; the panel swaps with a short exit and arrival.
 */
export function SampleTabs({ panels }: { panels: SamplePanel[] }) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    if (index === active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setActive(index);
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      setActive(index);
      setLeaving(false);
    }, 180);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = panels.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    select(next);
    tabs.current[next]?.focus();
  }

  const panel = panels[active];

  return (
    <div className="sample-tabs">
      <div role="tablist" aria-label="Inside a reading" className="sample-tablist">
        {panels.map((p, index) => (
          <button
            key={p.id}
            ref={(el) => { tabs.current[index] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${p.id}`}
            aria-selected={index === active}
            aria-controls={`${base}-panel-${p.id}`}
            tabIndex={index === active ? 0 : -1}
            className="sample-tab"
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel-${panel.id}`}
        aria-labelledby={`${base}-tab-${panel.id}`}
        className="sample-panel"
        data-state={leaving ? "leaving" : "shown"}
        key={panel.id}
      >
        <p>{panel.text}</p>
      </div>
    </div>
  );
}
