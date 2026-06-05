"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/profile";
import { useReading } from "@/lib/useReading";
import { parseCard } from "@/lib/cards";
import { Screen, Eyebrow, Divider } from "@/components/ui";
import { PlayingCard } from "@/components/PlayingCard";
import { compareReadings } from "@/components/bonds/compare";
import { ObservationCard } from "@/components/bonds/ObservationCard";

export default function BondsPage() {
  const { profile, ready } = useProfile();

  // Person A defaults to the user's profile, but stays editable.
  const [aName, setAName] = useState("");
  const [aBirth, setABirth] = useState("");
  const [bName, setBName] = useState("");
  const [bBirth, setBBirth] = useState("");

  // Birthdates that have been "committed" via Compare — drives the fetches.
  const [pairA, setPairA] = useState<string | undefined>();
  const [pairB, setPairB] = useState<string | undefined>();

  // Seed Person A from the saved profile once it's read on the client.
  const effectiveAName = aName || profile?.name || "";
  const effectiveABirth = aBirth || profile?.birthdate || "";

  const readingA = useReading(pairA);
  const readingB = useReading(pairB);

  const compared = Boolean(pairA && pairB);
  const loading = compared && (readingA.loading || readingB.loading);
  const error = compared ? readingA.error || readingB.error : null;

  function onCompare() {
    if (!effectiveABirth || !bBirth) return;
    setPairA(effectiveABirth);
    setPairB(bBirth);
  }

  function reset() {
    setPairA(undefined);
    setPairB(undefined);
  }

  const canCompare = Boolean(effectiveABirth) && Boolean(bBirth);

  const analysis =
    readingA.data && readingB.data
      ? compareReadings(
          { name: effectiveAName || "You", reading: readingA.data },
          { name: bName || "Them", reading: readingB.data },
        )
      : null;

  const cardA = readingA.data
    ? parseCard(readingA.data.archetype.birth_card)
    : null;
  const cardB = readingB.data
    ? parseCard(readingB.data.archetype.birth_card)
    : null;

  return (
    <Screen className="bg-cosmic starfield">
      <div className="relative z-10 mx-auto max-w-md space-y-10">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow className="mb-1">Bonds</Eyebrow>
          <h1 className="display mb-2 text-4xl text-bone">
            How two patterns meet
          </h1>
          <p className="text-sm text-faint">
            Not a compatibility score. Two birth cards, read for where they
            speak the same language — and where they grind.
          </p>
        </motion.header>

        {/* INPUTS */}
        {!compared && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <PersonInputs
              eyebrow="Person one"
              name={effectiveAName}
              birthdate={effectiveABirth}
              onName={setAName}
              onBirth={setABirth}
              namePlaceholder={profile?.name ? profile.name : "Your name"}
            />
            <PersonInputs
              eyebrow="Person two"
              name={bName}
              birthdate={bBirth}
              onName={setBName}
              onBirth={setBBirth}
              namePlaceholder="Their name"
            />

            <button
              type="button"
              onClick={onCompare}
              disabled={!canCompare}
              className="w-full rounded-full bg-foil py-3 text-center font-serif text-base text-ink shadow-lg transition active:scale-[0.99] disabled:opacity-30"
            >
              Compare patterns
            </button>

            {/* EMPTY STATE */}
            {!ready ? null : (
              <div className="pt-6 text-center">
                <div className="mx-auto mb-5 flex items-center justify-center gap-3 opacity-60">
                  <div className="h-20 w-14 rotate-[-8deg] rounded-lg border border-white/10 bg-gradient-to-br from-haze to-cosmos" />
                  <div className="h-20 w-14 rotate-[8deg] rounded-lg border border-white/10 bg-gradient-to-br from-haze to-cosmos" />
                </div>
                <p className="prose-reading text-sm text-faint">
                  Enter two birthdates to lay the cards side by side. Cardology
                  reads <em>compatibility</em> as the meeting of two operating
                  systems — what you speak fluently together, and what needs
                  translation.
                </p>
              </div>
            )}
          </motion.section>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center gap-4 pt-16 text-center">
            <div className="flex gap-5">
              <div className="h-44 w-32 animate-pulse rounded-xl bg-haze/60" />
              <div className="h-44 w-32 animate-pulse rounded-xl bg-haze/60" />
            </div>
            <p className="eyebrow animate-pulse">Laying the cards…</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="pt-12 text-center">
            <Eyebrow className="mb-3">Something interrupted the read</Eyebrow>
            <p className="prose-reading text-mist">{error}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 text-sm text-gold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* RESULT */}
        {!loading && !error && compared && analysis && cardA && cardB && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            {/* Two cards side by side */}
            <div className="flex items-end justify-center gap-8">
              <PlayingCard
                code={readingA.data!.archetype.birth_card}
                size="lg"
                subtitle={effectiveAName || "You"}
                title={readingA.data!.archetype.description.title}
                className="animate-drift"
              />
              <PlayingCard
                code={readingB.data!.archetype.birth_card}
                size="lg"
                subtitle={bName || "Them"}
                title={readingB.data!.archetype.description.title}
              />
            </div>

            <p className="text-center text-sm text-faint">
              <span style={{ color: cardA.color }}>{cardA.label}</span>
              {" meets "}
              <span style={{ color: cardB.color }}>{cardB.label}</span>
              {analysis.sharedSuit
                ? " — same suit, shared language."
                : " — different suits, different first instincts."}
            </p>

            <Divider />

            {/* How your patterns meet */}
            <div>
              <Eyebrow className="mb-1">Where you click, where you grind</Eyebrow>
              <h2 className="display mb-5 text-2xl text-bone">
                How your patterns meet
              </h2>
              <div className="space-y-4">
                {analysis.observations.map((obs, i) => (
                  <ObservationCard key={obs.label} obs={obs} index={i} />
                ))}
              </div>
            </div>

            {/* Reflective questions */}
            <div>
              <Eyebrow className="mb-4">To sit with — together</Eyebrow>
              <div className="space-y-4">
                {analysis.questions.map((q, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    className="prose-reading"
                  >
                    <em>{q}</em>
                  </motion.p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="w-full rounded-full border border-white/10 py-3 text-center font-serif text-sm text-mist transition active:scale-[0.99]"
            >
              Compare a different pair
            </button>
          </motion.section>
        )}
      </div>
    </Screen>
  );
}

function PersonInputs({
  eyebrow,
  name,
  birthdate,
  onName,
  onBirth,
  namePlaceholder,
}: {
  eyebrow: string;
  name: string;
  birthdate: string;
  onName: (v: string) => void;
  onBirth: (v: string) => void;
  namePlaceholder: string;
}) {
  return (
    <div className="card-surface space-y-3 p-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <input
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder={namePlaceholder}
        className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-3 font-serif text-bone placeholder:text-faint focus:border-gold/40 focus:outline-none"
      />
      <input
        type="date"
        value={birthdate}
        onChange={(e) => onBirth(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-3 font-serif text-bone focus:border-gold/40 focus:outline-none"
      />
    </div>
  );
}
