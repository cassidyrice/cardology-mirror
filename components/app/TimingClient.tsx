"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { useProfile } from "@/lib/profile";
import { useReading } from "@/lib/useReading";
import { todayISO } from "@/lib/cards";
import { PERIOD_DAYS, type Reading } from "@/lib/types";
import { Screen, Eyebrow, Divider } from "@/components/ui";
import { PeriodRow } from "@/components/timing/PeriodRow";
import { buildCycle } from "@/components/timing/cycle";
import { ProfilePrompt } from "@/components/profile/ProfilePrompt";

export default function TimingPage() {
  const router = useRouter();
  const { profile, ready } = useProfile();

  const { data, error, loading } = useReading(profile?.birthdate, todayISO());

  if (!ready || (profile && loading && !data)) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md space-y-4 pt-24">
          <div className="h-5 w-32 animate-pulse rounded bg-haze/60" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-haze/60" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-haze/40" />
          ))}
          <p className="eyebrow animate-pulse pt-2">Mapping your year…</p>
        </div>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md pt-12">
          <ProfilePrompt
            title="Your yearly spread needs a birthday."
            body="Create a local profile to map your current 52-day period, annual spread, and timing cards without leaving this website."
          />
        </div>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md pt-28 text-center">
          <Eyebrow className="mb-3 text-ember">The timeline didn&apos;t load</Eyebrow>
          <p className="prose-reading text-mist">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 text-sm uppercase tracking-wider2 text-gold"
          >
            Try again
          </button>
        </div>
      </Screen>
    );
  }

  if (!data) return null;

  return <Timing data={data} birthdate={profile.birthdate} name={profile.name} />;
}

function Timing({
  data,
  birthdate,
  name,
}: {
  data: Reading;
  birthdate: string;
  name: string;
}) {
  const cycle = useMemo(() => buildCycle(birthdate), [birthdate]);
  const bcSpread = data.birth_card_spread;
  const prcSpread = data.prc_spread;
  const activePlanet = data.active_period.planet;

  // Prefer the engine's active period; fall back to computed window.
  const currentIndex = useMemo(() => {
    const i = cycle.windows.findIndex((w) => w.planet === activePlanet);
    return i >= 0 ? i : cycle.currentIndex;
  }, [cycle, activePlanet]);

  const [open, setOpen] = useState<number | null>(currentIndex);

  const daysIn = cycle.daysIntoCurrent;
  const daysLeft = Math.max(0, PERIOD_DAYS - daysIn);

  return (
    <Screen className="bg-cosmic starfield">
      <div className="relative z-10 mx-auto max-w-md">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow className="mb-1">Your year · {name}</Eyebrow>
          <h1 className="display text-4xl leading-[1.08] text-bone">
            You&apos;re in your{" "}
            <span className="foil-text">{activePlanet}</span> chapter.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            {data.active_period.domain
              ? capitalize(data.active_period.domain) + "."
              : null}
          </p>
          <p className="mt-3 text-sm uppercase tracking-wider2 text-gold">
            Day <span className="tnum">{daysIn + 1}</span> into {activePlanet}
          </p>
          <p className="mt-1 text-xs text-faint">
            About <span className="tnum">{daysLeft}</span> day{daysLeft === 1 ? "" : "s"} left before the cycle turns ·
            seven {PERIOD_DAYS}-day periods, Mercury through Neptune
          </p>
        </motion.header>

        {/* STORY ARC CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6"
        >
          <Link
            href="/story"
            className="card-surface group flex items-center justify-between gap-3 p-4 transition hover:border-gold/30 active:scale-[0.99]"
          >
            <span>
              <span className="eyebrow text-gold">Story Arc</span>
              <span className="mt-1 block text-pretty font-serif text-[0.95rem] leading-snug text-bone">
                Read your year as one arc — long-range chapter, the deep turn, the
                horizon.
              </span>
            </span>
            <span className="shrink-0 text-faint transition-colors group-hover:text-gold">
              &rarr;
            </span>
          </Link>
        </motion.div>

        <Divider />

        {/* TIMELINE */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-2"
        >
          {cycle.windows.map((w, i) => (
            <motion.div
              key={w.planet}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <PeriodRow
                window={w}
                bcDetail={bcSpread.periods_detailed[w.planet]}
                prcDetail={prcSpread.periods_detailed[w.planet]}
                isCurrent={i === currentIndex}
                isLast={i === cycle.windows.length - 1}
                expanded={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            </motion.div>
          ))}
        </motion.div>

        <Divider />

        <p className="pb-4 text-center text-sm leading-relaxed text-faint">
          The cards don&apos;t move you — they name the weather. Each period is a
          lens for noticing what&apos;s already asking for your attention.
        </p>
      </div>
    </Screen>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
