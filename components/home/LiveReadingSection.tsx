import Link from "next/link";

import { NewsletterSignupForm } from "@/components/seo/NewsletterSignupForm";
import { Kicker, LinkButton, SectionShell } from "@/components/ui";
import {
  isReadingDayPast,
  READING_DAY_LABEL,
  READING_DAY_SLOTS_LEFT,
} from "@/lib/reading-day";

export function LiveReadingSection() {
  const past = isReadingDayPast();

  return (
    <SectionShell tone="paper" width="narrow">
      <div className="mx-auto max-w-[36rem] text-center">
        <Kicker>Live · 5 minutes · $20</Kicker>
        <h2 className="type-h2 mt-3">Your two karma cards, read to you.</h2>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Every card has two karma cards: one you owe, one you&rsquo;re owed. I look yours up before we
          talk, then spend five minutes telling you what they mean for you. Audio call, no camera.
          Readings happen on set Reading Days. Pick a slot.
        </p>
        {past ? (
          <div className="mt-8 text-left">
            <p className="font-serif text-lg text-brand-ink">Join the list for the next date</p>
            <div className="mt-4">
              <NewsletterSignupForm
                source="home-reading-waitlist"
                compact
                heading="Join the list for the next date"
                body="One email when the next Reading Day opens. That's it."
                buttonLabel="Notify me"
                hideHeading
              />
            </div>
          </div>
        ) : (
          <>
            <p className="mt-8">
              <LinkButton href="/karma-reading" variant="accent" size="large">
                Book a slot
              </LinkButton>
            </p>
            <p className="mt-4 text-sm text-brand-ink-soft">
              Next Reading Day: {READING_DAY_LABEL} · {READING_DAY_SLOTS_LEFT} slots left
            </p>
            <p className="mt-2 text-sm">
              <Link href="/karma-reading" className="editorial-link text-brand-ink-soft">
                Details →
              </Link>
            </p>
          </>
        )}
      </div>
    </SectionShell>
  );
}
