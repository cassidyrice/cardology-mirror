"use client";

import { useEffect, useState } from "react";

import { sanitizeBirthdateISO } from "@/lib/birthdate";

/**
 * Native date input that reports a birthday the moment it is complete.
 * No submit button: the answer appears as soon as the date is valid.
 */
export function BirthdayField({
  id,
  label,
  value,
  onValid,
  hint,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onValid: (iso: string) => void;
  hint?: string;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  // Keep in step when the shared birthday changes elsewhere on the page.
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="bp-field">
      <label htmlFor={id} className="bp-label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className="bp-input"
        value={draft}
        min="1900-01-01"
        max="2099-12-31"
        autoComplete="bday"
        autoFocus={autoFocus}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const iso = sanitizeBirthdateISO(e.target.value);
          if (iso) onValid(iso);
        }}
      />
      {hint ? (
        <p id={`${id}-hint`} className="bp-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
