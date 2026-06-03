"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui";
import { useGate } from "@/lib/useGate";

// Unlock screen for the AI deep-dive features. Shown when the reader has no
// valid access token. On success it stores the token (useGate) and calls onUnlocked.
export function AccessGate({
  title = "Unlock your deep dive",
  blurb = "The written reading is generated for you, one card at a time. Enter your email and access code to open it.",
  onUnlocked,
}: {
  title?: string;
  blurb?: string;
  onUnlocked?: () => void;
}) {
  const { unlock } = useGate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await unlock(email, code);
    setBusy(false);
    if (res.ok) onUnlocked?.();
    else setError(res.error);
  };

  const field =
    "w-full rounded-lg border border-white/10 bg-void px-3 py-3 text-bone outline-none transition placeholder:text-faint focus:border-gold/60 focus:ring-1 focus:ring-gold/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-surface mx-auto mt-6 max-w-sm p-6"
    >
      <Eyebrow className="text-gold">Members only</Eyebrow>
      <h2 className="display mt-2 text-2xl text-bone">{title}</h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-mist">{blurb}</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
          aria-label="Email"
        />
        <input
          type="text"
          required
          autoComplete="off"
          placeholder="Access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={field}
          aria-label="Access code"
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button
          type="submit"
          disabled={busy || !email || !code}
          className="w-full rounded-full bg-foil py-3 text-center font-serif text-base text-ink shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>

      <p className="mt-4 text-xs text-faint">
        A mirror, not a forecast. Your reading is drawn only from your cards.
      </p>
    </motion.div>
  );
}
