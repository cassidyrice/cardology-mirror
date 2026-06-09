"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProfile } from "@/lib/profile";
import { useReading } from "@/lib/useReading";
import { parseCard } from "@/lib/cards";
import { Screen, Eyebrow, Divider } from "@/components/ui";
import { PlayingCard } from "@/components/PlayingCard";
import { Section } from "@/components/self/Section";
import { GiftList, TraitGroup } from "@/components/self/TraitList";
import { CrownRow, crownFraming } from "@/components/self/CrownRow";

export default function SelfPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  const { data, error, loading } = useReading(profile?.birthdate);

  if (!ready || (profile && loading && !data)) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md">
          <div className="flex flex-col items-center gap-4 pt-32 text-center">
            <div className="h-48 w-36 animate-pulse rounded-xl bg-haze/60" />
            <p className="eyebrow animate-pulse">Reading your blueprint…</p>
          </div>
        </div>
      </Screen>
    );
  }

  if (!profile) return null;

  if (error) {
    return (
      <Screen className="bg-cosmic starfield">
        <div className="mx-auto max-w-md pt-32 text-center">
          <Eyebrow className="mb-3">Something interrupted the read</Eyebrow>
          <p className="prose-reading text-mist">{error}</p>
        </div>
      </Screen>
    );
  }

  if (!data) return null;

  const { archetype, timing } = data;
  const bc = parseCard(archetype.birth_card);
  const prc = parseCard(archetype.prc);
  const desc = archetype.description;
  const prcDesc = archetype.prc_description;

  return (
    <Screen className="bg-cosmic starfield">
      <div className="relative z-10 mx-auto max-w-md space-y-12">
        {/* HERO */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Eyebrow className="mb-1">Your Blueprint · {profile.name}</Eyebrow>
          <h1 className="display mb-2 text-4xl text-bone">{desc.title}</h1>
          <p className="text-sm text-faint">
            {archetype.suit_domain} · Solar value{" "}
            <span className="tnum">{archetype.solar_value}</span>
          </p>

          <div className="mt-8 flex items-end justify-center gap-6">
            <PlayingCard
              code={archetype.birth_card}
              size="lg"
              subtitle="Birth Card"
              title={desc.title}
              className="animate-drift"
            />
            <PlayingCard
              code={archetype.prc}
              size="md"
              subtitle="Ruling Card"
              title={prcDesc.title}
            />
          </div>
        </motion.header>

        <Divider />

        {/* WHO YOU ARE AT CORE */}
        <Section eyebrow="No forecast — just what you already are" title="Who you are at core" index={0}>
          <div className="prose-reading">
            <p>
              <span className="text-gold">{archetype.birth_card}</span> is the card of{" "}
              <em>{desc.title.replace(/^The /, "").toLowerCase()}</em>. {desc.core_identity}
            </p>
            <p>
              Layered on top is your <span className="text-gold">{archetype.prc}</span> ruling
              pattern — <em>{prcDesc.title.replace(/^The /, "").toLowerCase()}</em>. {prcDesc.core_identity}
            </p>
            <p className="text-mist">
              Two engines run at once: a {bc?.domain.toLowerCase()} instinct from{" "}
              {archetype.birth_card}, threaded through a {prc?.domain.toLowerCase()} temperament from{" "}
              {archetype.prc}. This isn&rsquo;t a vibe. Same birthday, same cards, every time — this
              is the factory setting you&rsquo;ve been blaming on everyone else.
            </p>
          </div>
        </Section>

        {/* GIFTS */}
        <Section eyebrow="What you do well" title="Your gifts" index={1}>
          <div className="space-y-4">
            <TraitGroup cardCode={archetype.birth_card} cardLabel={desc.title}>
              <GiftList gifts={desc.gifts} accent="#7fae8f" />
            </TraitGroup>
            <TraitGroup cardCode={archetype.prc} cardLabel={prcDesc.title}>
              <GiftList gifts={prcDesc.gifts} accent="#7fae8f" />
            </TraitGroup>
          </div>
        </Section>

        {/* SHADOW */}
        <Section eyebrow="Where it costs you" title="The tension you carry" index={2}>
          <div className="space-y-5">
            <div className="rounded-2xl border border-ember/20 bg-ember/5 p-5">
              <p className="eyebrow mb-2">
                <span className="text-ember">{archetype.birth_card}</span> · {desc.title}
              </p>
              <p className="prose-reading mb-0 text-mist">{desc.shadow}</p>
            </div>
            <div className="rounded-2xl border border-ember/20 bg-ember/5 p-5">
              <p className="eyebrow mb-2">
                <span className="text-ember">{archetype.prc}</span> · {prcDesc.title}
              </p>
              <p className="prose-reading mb-0 text-mist">{prcDesc.shadow}</p>
            </div>
            <p className="text-sm leading-relaxed text-faint">
              These started as protection. They&rsquo;ve long since stopped earning their keep, and
              you&rsquo;ve kept paying rent on them anyway — noticing that is the part only you can do.
            </p>
          </div>
        </Section>

        {/* LIFE DIRECTION */}
        <Section eyebrow="Where this points" title="Your life direction" index={3}>
          <div className="prose-reading">
            <p>{desc.life_direction}</p>
            <p>{prcDesc.life_direction}</p>
          </div>
        </Section>

        {/* ALGORITHM / GROWTH EDGE */}
        <Section eyebrow="Growth edge" title="The algorithm to rewire" index={4}>
          <div className="card-surface space-y-4 p-5">
            <div>
              <p className="eyebrow mb-2">
                <span className="text-gold">{archetype.birth_card}</span>
              </p>
              <p className="text-[0.97rem] leading-relaxed text-mist">{desc.algorithm_gateway}</p>
            </div>
            <hr className="hairline border-t" />
            <div>
              <p className="eyebrow mb-2">
                <span className="text-gold">{archetype.prc}</span>
              </p>
              <p className="text-[0.97rem] leading-relaxed text-mist">
                {prcDesc.algorithm_gateway}
              </p>
            </div>
          </div>
        </Section>

        {/* CROWN — LIFE THEMES */}
        <Section eyebrow="The cards that crown your life" title="Your life themes" index={5}>
          <CrownRow crown={timing.crown} />
          <p className="prose-reading mt-6 text-center text-mist">{crownFraming(timing.crown)}</p>
        </Section>

        <Divider />

        <p className="pb-4 text-center text-sm leading-relaxed text-faint">
          None of this is destiny — it&rsquo;s the pattern you already run. Seeing it clearly is the
          only part that was ever up to you.
        </p>
      </div>
    </Screen>
  );
}
