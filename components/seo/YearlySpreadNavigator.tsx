"use client";

import { FormEvent, useEffect, useState } from "react";

const MIN_AGE = 0;
const MAX_AGE = 89;

function revealSpread(id: string) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: "start" });
  });
}

export function YearlySpreadNavigator({ exampleAge }: { exampleAge: number }) {
  const [age, setAge] = useState(String(exampleAge));
  const [error, setError] = useState("");

  useEffect(() => {
    function openFromHash() {
      const id = window.location.hash.replace(/^#/, "");
      if (!id.startsWith("spread-")) return;
      revealSpread(id);
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = age.trim();
    if (!/^\d{1,2}$/.test(trimmed)) {
      setError("Enter a whole number from 0 to 89.");
      return;
    }
    const n = Number(trimmed);
    if (n < MIN_AGE || n > MAX_AGE) {
      setError("Enter a whole number from 0 to 89.");
      return;
    }
    setError("");
    const id = `spread-${n}`;
    if (window.location.hash === `#${id}`) {
      revealSpread(id);
      return;
    }
    window.location.hash = id;
  }

  return (
    <form onSubmit={onSubmit} className="mb-4" aria-label="Open a yearly spread by age">
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-sm text-brand-ink" htmlFor="yearly-spread-age">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-brand-bronze">
            Age
          </span>
          <input
            id="yearly-spread-age"
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            required
            value={age}
            onChange={(event) => setAge(event.target.value)}
            className="w-24 border border-brand-line bg-brand-paper px-3 py-2 text-base text-brand-ink"
          />
        </label>
        <button type="submit" className="accent-button">
          Open spread
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-brand-oxblood">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-sm text-brand-ink-soft">
          Ages 0–89. One decade shows at a time. Age 90 uses the same board as age 0.
        </p>
      )}
    </form>
  );
}
