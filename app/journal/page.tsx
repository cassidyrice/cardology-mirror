"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { useProfile } from "@/lib/profile";
import { useReading } from "@/lib/useReading";
import { todayISO, parseCard } from "@/lib/cards";
import { Screen, Eyebrow, SectionTitle, Divider } from "@/components/ui";
import {
  Prompts,
  buildPrompts,
  type ReflectionPrompt,
} from "@/components/reflection/Prompts";
import {
  useJournal,
  type JournalEntry,
  type SaveInput,
} from "@/components/reflection/journal-store";

const PRETTY_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function formatDate(iso: string): string {
  // iso is YYYY-MM-DD; build a local date without TZ drift.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return PRETTY_DATE.format(new Date(y, m - 1, d));
}

function Glyphs({ cards }: { cards?: string[] }) {
  if (!cards?.length) return null;
  return (
    <span className="flex items-center gap-1.5">
      {cards.map((code, i) => {
        const c = parseCard(code);
        if (!c) return null;
        return (
          <span
            key={`${code}-${i}`}
            className="font-serif text-sm"
            style={{ color: c.color }}
          >
            {code}
          </span>
        );
      })}
    </span>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { profile, ready } = useProfile();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  const { data, error, loading } = useReading(profile?.birthdate, todayISO());
  const { entries, ready: journalReady, save, remove } = useJournal();

  // The prompt the user is actively writing against (new entry).
  const [active, setActive] = useState<ReflectionPrompt | null>(null);

  const showLoading = !ready || (profile && (loading || (!data && !error)));

  return (
    <Screen className="starfield bg-cosmic mx-auto max-w-md">
      <Eyebrow className="tnum">{PRETTY_DATE.format(new Date())}</Eyebrow>
      <h1 className="display mt-3 text-4xl leading-[1.08] text-bone">
        The Journal
      </h1>
      <p className="mt-3 text-sm text-faint">
        A mirror, not a forecast. Write toward whatever stings.
      </p>

      <Divider />

      {/* ---- Today's prompts ---- */}
      <section className="space-y-5">
        <div>
          <Eyebrow className="text-gold">Questions to sit with</Eyebrow>
          <p className="mt-1 text-xs text-faint">
            Drawn from your cards today. Tap one to write.
          </p>
        </div>

        {showLoading && <PromptsSkeleton />}

        {ready && profile && error && (
          <div className="card-surface rounded-2xl p-5">
            <Eyebrow className="text-ember">Couldn&apos;t read today</Eyebrow>
            <p className="prose-reading mt-2 text-mist">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-3 text-sm uppercase tracking-wider2 text-gold"
            >
              Try again
            </button>
          </div>
        )}

        {ready && profile && data && !error && (
          <Prompts reading={data} onSelect={(p) => setActive(p)} />
        )}
      </section>

      <Divider />

      {/* ---- Past entries ---- */}
      <section className="space-y-4">
        <SectionTitle className="text-xl">Past reflections</SectionTitle>

        {journalReady && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-surface rounded-2xl p-6 text-center"
          >
            <p className="prose-reading font-serif text-bone">
              Nothing written yet.
            </p>
            <p className="mt-2 text-sm text-faint">
              Pick a question above and answer it honestly — even one sentence
              is a start. Your entries stay private on this device.
            </p>
          </motion.div>
        )}

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onSave={save}
                onDelete={remove}
              />
            ))}
          </AnimatePresence>
        </ul>
      </section>

      {/* ---- Writing surface for a new entry ---- */}
      <AnimatePresence>
        {active && (
          <WritingSheet
            prompt={active}
            date={data?.inputs.target_date ?? todayISO()}
            cards={active.cards}
            onClose={() => setActive(null)}
            onSave={(body) => {
              const trimmed = body.trim();
              if (trimmed) {
                save({
                  date: data?.inputs.target_date ?? todayISO(),
                  prompt: active.question,
                  body: trimmed,
                  cards: active.cards,
                });
              }
              setActive(null);
            }}
          />
        )}
      </AnimatePresence>
    </Screen>
  );
}

/* ---------------------------------------------------------------- */

function PromptsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="card-surface h-28 animate-pulse rounded-2xl opacity-60"
        />
      ))}
    </div>
  );
}

/* ---- A single past entry: expand to read/edit, delete with confirm ---- */
function EntryCard({
  entry,
  onSave,
  onDelete,
}: {
  entry: JournalEntry;
  onSave: (input: SaveInput) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview =
    entry.body.length > 120 ? `${entry.body.slice(0, 120).trim()}…` : entry.body;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="card-surface overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setEditing(false);
          setConfirmDelete(false);
        }}
        className="w-full p-5 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow tnum">{formatDate(entry.date)}</span>
          <Glyphs cards={entry.cards} />
        </div>
        <p className="mt-2 font-serif text-sm italic text-gold/90">
          {entry.prompt}
        </p>
        {!open && (
          <p className="prose-reading mt-2 text-[0.95rem] text-mist">
            {preview}
          </p>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-5"
          >
            {editing ? (
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  const t = draft.trim();
                  if (t && t !== entry.body) {
                    onSave({ id: entry.id, body: t });
                  } else {
                    setDraft(entry.body);
                  }
                }}
                rows={6}
                className="w-full resize-none rounded-xl border border-white/10 bg-void/40 p-3 font-serif text-[1.05rem] leading-relaxed text-bone outline-none focus:border-gold/40"
              />
            ) : (
              <p className="prose-reading whitespace-pre-wrap text-[1.0rem] text-mist">
                {entry.body}
              </p>
            )}

            <div className="mt-4 flex items-center gap-5">
              {editing ? (
                <button
                  onClick={() => {
                    const t = draft.trim();
                    if (t) onSave({ id: entry.id, body: t });
                    setEditing(false);
                  }}
                  className="text-xs uppercase tracking-wider2 text-gold"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={() => {
                    setDraft(entry.body);
                    setEditing(true);
                  }}
                  className="text-xs uppercase tracking-wider2 text-mist hover:text-bone"
                >
                  Edit
                </button>
              )}

              {confirmDelete ? (
                <span className="flex items-center gap-3">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-xs uppercase tracking-wider2 text-ember"
                  >
                    Delete for good
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs uppercase tracking-wider2 text-faint"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs uppercase tracking-wider2 text-faint hover:text-ember"
                >
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* ---- Bottom-sheet writing surface for a fresh entry ---- */
function WritingSheet({
  prompt,
  date,
  cards,
  onClose,
  onSave,
}: {
  prompt: ReflectionPrompt;
  date: string;
  cards?: string[];
  onClose: () => void;
  onSave: (body: string) => void;
}) {
  const [body, setBody] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-void/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="card-surface mx-auto w-full max-w-md rounded-t-3xl p-6"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

        <div className="flex items-center justify-between gap-3">
          <Eyebrow className="text-gold">{prompt.label}</Eyebrow>
          <Glyphs cards={cards} />
        </div>
        <p className="prose-reading mt-3 font-serif text-[1.05rem] italic leading-relaxed text-bone">
          {prompt.question}
        </p>

        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write what's true, not what's tidy…"
          rows={7}
          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-void/40 p-4 font-serif text-[1.05rem] leading-relaxed text-bone outline-none placeholder:text-faint focus:border-gold/40"
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-faint tnum">{formatDate(date)}</span>
          <div className="flex items-center gap-5">
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-wider2 text-faint hover:text-mist"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(body)}
              disabled={!body.trim()}
              className="rounded-full bg-gold/90 px-5 py-2 text-xs uppercase tracking-wider2 text-void disabled:opacity-30"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
