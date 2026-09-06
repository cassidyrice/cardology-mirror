import Link from "next/link";

import { getTodaysCardCached } from "@/lib/card-of-the-day";
import { Kicker, SectionShell } from "@/components/ui";

export async function TodaysCardSection() {
  const today = await getTodaysCardCached();
  const card = today.card;
  const faceSlug = card?.slug ?? "joker";
  const name = card?.label ?? "The Joker";

  return (
    <SectionShell tone="paperDeep">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,12rem)_1fr] lg:items-start lg:gap-12">
        <img
          src={`/share-cards/faces/${faceSlug}.png`}
          alt={`${name} playing card`}
          width={1000}
          height={1500}
          loading="lazy"
          decoding="async"
          className="mx-auto w-36 rounded-[3px] border border-brand-line shadow-[0_8px_24px_rgba(20,17,13,0.12)] lg:mx-0 lg:w-full"
        />
        <div>
          <Kicker>
            Today&rsquo;s card · {today.label}
          </Kicker>
          <h2 className="type-h2 mt-3">{name}</h2>
          {/* COPY-REVIEW: sweetSpot + shadow until daily Cass voice is written */}
          <div className="mt-4 max-w-[38em] space-y-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
            {card ? (
              <>
                <p>{card.sweetSpot}</p>
                {card.shadow ? <p>{card.shadow}</p> : null}
              </>
            ) : (
              <p>
                December 31 sits outside the 52. The Joker day — no fixed card, just the wild edge of
                the year.
              </p>
            )}
          </div>
          <p className="mt-5">
            <Link href="/card-of-the-day" className="editorial-link text-brand-ink">
              See today&rsquo;s full card →
            </Link>
          </p>
          <p className="mt-3 text-sm text-brand-ink-soft">
            Want your own daily card?{" "}
            <a href="#monday-card" className="editorial-link text-brand-ink">
              Get it every Monday →
            </a>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
