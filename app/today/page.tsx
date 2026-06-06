"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { useProfile } from "@/lib/profile";
import { useDailyCard } from "@/lib/useDailyCard";
import { todayISO, parseCard } from "@/lib/cards";
import {
  Screen,
  Eyebrow,
  SectionTitle,
  Divider,
  PositionStack,
} from "@/components/ui";
import { PlayingCard } from "@/components/PlayingCard";
import { TodaySkeleton } from "@/components/today/Skeleton";
import {
  bluntLine,
  chapterLabel,
  reflectionPrompt,
} from "@/components/today/reflection";

const PRETTY_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function cardTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

export default function TodayPage() {
  const router = useRouter();
  const { profile, ready } = useProfile();

  // Redirect to onboarding once we know there's no profile.
  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  const { data, error, loading } = useDailyCard(profile?.birthdate, todayISO());

  const showSkeleton = !ready || (profile && (loading || (!data && !error)));

  return (
    <Screen className="starfield bg-cosmic mx-auto max-w-md">
      {showSkeleton && <TodaySkeleton />}

      {ready && profile && error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-10"
        >
          <Eyebrow className="text-ember">Couldn&apos;t read today</Eyebrow>
          <p className="prose-reading text-mist">
            The engine didn&apos;t return a reading. {error}
          </p>
          <button
            onClick={() => router.refresh()}
            className="mt-2 text-sm uppercase tracking-wider2 text-gold"
          >
            Try again
          </button>
        </motion.div>
      )}

      {ready && profile && data && !error && (
        <Today data={data} />
      )}
    </Screen>
  );
}

function Today({ data }: { data: import("@/lib/types").DailyCardResponse }) {
  const reading = data.reading;
  const ap = reading.active_period;
  const bc = parseCard(ap.bc_card);
  const prc = parseCard(ap.prc_card);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-2"
    >
      {/* ---- Hero ---- */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      >
        <Eyebrow className="tnum">{PRETTY_DATE.format(new Date())}</Eyebrow>
        <h1 className="display mt-3 text-4xl leading-[1.08] text-bone">
          {bluntLine(ap)}
        </h1>
        <p className="mt-4 text-sm uppercase tracking-wider2 text-gold">
          {chapterLabel(ap)}
        </p>
        <p className="mt-1 text-xs text-faint">
          {ap.domain}
        </p>
        <div className="mt-5 rounded-2xl border border-gold/15 bg-gold/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-wider2 text-gold">
            Cardology CLI daily card
          </p>
          <p className="mt-2 font-serif text-xl text-bone">
            {data.daily_card.code} · {data.daily_card.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            {data.daily_card.sweet_spot}
          </p>
          <p className="mt-3 text-xs text-faint">
            Ruling support: {data.ruling_card_support.code} · {data.ruling_card_support.name}
          </p>
        </div>
      </motion.div>

      {/* ---- Governing cards ---- */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="flex justify-center gap-8 pt-8"
      >
        <PlayingCard
          code={ap.bc_card}
          subtitle="Birth card"
          title={cardTitle(ap.interpretation_bc.name)}
          size="md"
        />
        <PlayingCard
          code={ap.prc_card}
          subtitle="Ruling card"
          title={cardTitle(ap.interpretation_prc.name)}
          size="md"
        />
      </motion.div>

      <Divider />

      {/* ---- Birth-card position stack ---- */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="space-y-4"
      >
        <header className="flex items-baseline gap-3">
          <span style={{ color: bc?.color }} className="font-serif text-xl">
            {ap.bc_card}
          </span>
          <SectionTitle className="text-xl">
            {cardTitle(ap.interpretation_bc.name)}
          </SectionTitle>
        </header>
        <Eyebrow>Your birth card, in {ap.planet}</Eyebrow>
        <PositionStack
          under={ap.interpretation_bc.under}
          sweet={ap.interpretation_bc.sweet_spot}
          over={ap.interpretation_bc.over}
        />
      </motion.div>

      <Divider />

      {/* ---- Ruling-card position stack ---- */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="space-y-4"
      >
        <header className="flex items-baseline gap-3">
          <span style={{ color: prc?.color }} className="font-serif text-xl">
            {ap.prc_card}
          </span>
          <SectionTitle className="text-xl">
            {cardTitle(ap.interpretation_prc.name)}
          </SectionTitle>
        </header>
        <Eyebrow>Your ruling card, in {ap.planet}</Eyebrow>
        <PositionStack
          under={ap.interpretation_prc.under}
          sweet={ap.interpretation_prc.sweet_spot}
          over={ap.interpretation_prc.over}
        />
      </motion.div>

      <Divider />

      {/* ---- Reflection prompt ---- */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="card-surface rounded-2xl p-6"
      >
        <Eyebrow className="text-gold">Today&apos;s reflection</Eyebrow>
        <p className="prose-reading mt-3 font-serif text-lg leading-relaxed text-bone">
          {reflectionPrompt(ap)}
        </p>
        <p className="mt-4 text-xs text-faint">
          No forecast — just the pattern you&apos;re running today. Sit with whatever stings.
        </p>
      </motion.div>

      {/* ---- Story-arc deep dive CTA ---- */}
      <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
        <Link
          href="/story"
          className="group mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.04] p-5 transition hover:border-gold/40 active:scale-[0.99]"
        >
          <span>
            <span className="eyebrow text-gold">Story Arc · Your Year</span>
            <span className="mt-1 block text-pretty font-serif text-base leading-snug text-bone">
              Where this year is taking you — chapter, turn, and horizon.
            </span>
          </span>
          <span className="shrink-0 text-gold transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
