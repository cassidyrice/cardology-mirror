"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Eyebrow } from "@/components/ui";
import { PlayingCard } from "@/components/PlayingCard";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number, year: number): number {
  // month is 1-12; day 0 of next month = last day of this month
  return new Date(year, month, 0).getDate();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface Preview {
  card: string;
  title: string;
}

export interface ProfileFormProps {
  onSubmit: (data: { name: string; birthdate: string }) => void;
  back: () => void;
}

/**
 * Final onboarding step: collects name + birthdate via month/day/year selects,
 * validates a real date, previews the birth card, then commits.
 */
export function ProfileForm({ onSubmit, back }: ProfileFormProps) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [name, setName] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");

  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const years = useMemo(
    () => Array.from({ length: 120 }, (_, i) => currentYear - i),
    [currentYear],
  );

  const dayCount =
    month !== "" && year !== "" ? daysInMonth(month as number, year as number) : 31;
  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => i + 1),
    [dayCount],
  );

  // A complete, valid date string or null.
  const birthdate = useMemo(() => {
    if (month === "" || day === "" || year === "") return null;
    const d = day as number;
    const m = month as number;
    const y = year as number;
    if (d > daysInMonth(m, y)) return null; // e.g. Feb 30
    const iso = `${y}-${pad(m)}-${pad(d)}`;
    const test = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(test.getTime())) return null;
    if (test > now) return null; // no future birthdays
    return iso;
  }, [month, day, year, now]);

  const dateIncomplete = month !== "" || day !== "" || year !== "";
  const dateInvalid = dateIncomplete && birthdate === null;

  async function reveal() {
    if (!birthdate) return;
    setError(null);
    setPreviewLoading(true);
    setPreviewFor(birthdate);
    try {
      const r = await fetch(`/api/reading?birthdate=${birthdate}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Could not read that date.");
      setPreview({
        card: json.archetype.birth_card,
        title: json.archetype.description.title,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tell us what to call you.");
      return;
    }
    if (!birthdate) {
      setError("Enter a real birth date.");
      return;
    }
    setSubmitting(true);
    onSubmit({ name: name.trim(), birthdate });
  }

  // Invalidate a stale preview if the date changed after revealing.
  const previewStale = preview !== null && previewFor !== birthdate;
  const showReveal = birthdate && (!preview || previewStale);

  const selectClass =
    "w-full appearance-none rounded-lg border border-white/10 bg-void px-3 py-3 text-bone outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/40";

  return (
    <motion.form
      key="form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      <div className="flex-1">
        <Eyebrow className="mb-3">The only two things we need</Eyebrow>
        <h1 className="display mb-8 text-3xl text-bone">
          Your name and the day you arrived.
        </h1>

        <label className="mb-6 block">
          <span className="eyebrow mb-2 block">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            autoComplete="given-name"
            placeholder="What we'll call you"
            className="w-full rounded-lg border border-white/10 bg-void px-3 py-3 text-bone outline-none transition placeholder:text-faint focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
            aria-label="Your name"
          />
        </label>

        <fieldset className="mb-2">
          <legend className="eyebrow mb-2">Birthdate</legend>
          <div className="grid grid-cols-[1.6fr_1fr_1.1fr] gap-2">
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value === "" ? "" : Number(e.target.value));
                setError(null);
              }}
              className={selectClass}
              aria-label="Birth month"
            >
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={(e) => {
                setDay(e.target.value === "" ? "" : Number(e.target.value));
                setError(null);
              }}
              className={selectClass}
              aria-label="Birth day"
            >
              <option value="">Day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value === "" ? "" : Number(e.target.value));
                setError(null);
              }}
              className={selectClass}
              aria-label="Birth year"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {dateInvalid && (
          <p className="mt-2 text-sm text-ember">That isn&apos;t a real date.</p>
        )}

        {/* Reveal trigger */}
        <AnimatePresence mode="wait">
          {showReveal && (
            <motion.button
              key="reveal-btn"
              type="button"
              onClick={reveal}
              disabled={previewLoading}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-sm uppercase tracking-wider2 text-gold transition hover:text-bone disabled:opacity-50"
            >
              {previewLoading ? "Reading the deck…" : "Reveal your birth card →"}
            </motion.button>
          )}
        </AnimatePresence>

        {/* The reveal moment */}
        <AnimatePresence mode="wait">
          {preview && !previewStale && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col items-center"
            >
              <div className="animate-drift">
                <PlayingCard
                  code={preview.card}
                  subtitle="Your birth card"
                  title={preview.title}
                  size="lg"
                />
              </div>
              <p className="mt-5 max-w-xs text-center text-sm leading-relaxed text-mist">
                One card. A starting vocabulary for noticing how you tend to
                operate. Nothing here is fixed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-5 text-sm text-ember">{error}</p>}
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={back}
          className="text-sm uppercase tracking-wider2 text-faint transition hover:text-mist"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim() || !birthdate}
          className="rounded-full bg-bone px-8 py-3 text-sm font-medium uppercase tracking-wider2 text-ink transition hover:bg-gold active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
        >
          {submitting ? "Entering…" : "Begin"}
        </button>
      </div>
    </motion.form>
  );
}
