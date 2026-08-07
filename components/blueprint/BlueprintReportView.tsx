import Link from "next/link";

import { LinkButton } from "@/components/ui";
import type { BlueprintReport } from "@/lib/blueprint";

type Props = {
  report: BlueprintReport;
  /** When true, show sample chrome and omit personal next-steps that assume purchase. */
  sample?: boolean;
  birthdateDisplay?: string;
  className?: string;
};

export function BlueprintReportView({
  report,
  sample = false,
  birthdateDisplay,
  className = "",
}: Props) {
  const dateLine =
    birthdateDisplay ??
    (report.birthdate === "sample"
      ? "Example birthday"
      : `Birth date on file: ${report.birthdate}`);

  return (
    <div className={className}>
      <header className="max-w-[40em]">
        {sample && (
          <p className="mb-3 inline-flex rounded-sm border border-brand-bronze/40 bg-brand-paper-deep px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-bronze">
            Sample report &middot; not a real customer
          </p>
        )}
        <h2 className="type-display text-brand-ink sm:text-[2.75rem]">
          {report.birthCard} &mdash; {report.birthCardTitle}
        </h2>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          A pattern read, not a prophecy. This is the map of the card your
          birthday carries, the layer it expresses through, and the chapter
          it&rsquo;s walking right now.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-brand-ink-faint">
          {dateLine} &middot; reflection framework, not a forecast
        </p>
      </header>

      <div className="mt-12 space-y-12">
        <section>
          <h3 className="type-h2 text-brand-ink">Your core pattern</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
            {report.coreIdentity}
          </p>
          <p className="mt-3 max-w-[40em] text-sm text-brand-ink-soft">
            Suit domain: {report.suitDomain}.
          </p>
        </section>

        <section>
          <h3 className="type-h2 text-brand-ink">Strengths</h3>
          <ul className="mt-4 max-w-[40em] space-y-2 leading-relaxed text-brand-ink-soft">
            {report.gifts.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-bronze" aria-hidden>
                  &middot;
                </span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="type-h2 text-brand-ink">The growth edge</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
            {report.shadow}
          </p>
        </section>

        <section className="border-t border-brand-line pt-10">
          <h3 className="type-h2 text-brand-ink">
            Your ruling layer: {report.rulingCard} &mdash; {report.rulingCardTitle}
          </h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
            The birth card is the engine; the ruling card is how it shows up in
            your style and first impressions. {report.rulingIdentity}
          </p>
          <p className="mt-3 max-w-[40em] leading-relaxed text-brand-ink-soft">
            Watch for: {report.rulingShadow}
          </p>
        </section>

        <section className="border-t border-brand-line pt-10">
          <h3 className="type-h2 text-brand-ink">The chapter you&rsquo;re in now</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
            Your current planetary period is {report.currentChapter.planet}{" "}
            — the domain of {report.currentChapter.domain.toLowerCase()} —
            governed by the {report.currentChapter.card} (
            {report.currentChapter.meaning}).
          </p>
          <dl className="mt-6 max-w-[40em] space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-brand-ink">At its balanced best</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink-soft">
                {report.currentChapter.balanced}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-ink">When it slips under</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink-soft">
                {report.currentChapter.under}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-ink">When it overplays</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink-soft">
                {report.currentChapter.over}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-brand-line pt-10">
          <h3 className="type-h2 text-brand-ink">Questions to sit with</h3>
          <ol className="mt-4 max-w-[40em] list-decimal space-y-3 pl-5 leading-relaxed text-brand-ink-soft">
            {report.reflectionPrompts.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>

        {!sample && (
          <section className="border-t border-brand-line pt-10">
            <h3 className="type-h2 text-brand-ink">Next steps</h3>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <LinkButton
                href={`/birth-card/${report.birthCardSlug}`}
                variant="primary"
                size="large"
              >
                Read the full {report.birthCard} meaning
              </LinkButton>
              <LinkButton
                href="/birth-card-compatibility-calculator"
                variant="outline"
                size="large"
              >
                Compare with someone else
              </LinkButton>
              <LinkButton href="/52-day-period-meaning-tool" variant="outline" size="large">
                Explore the timing tool
              </LinkButton>
            </div>
            <p className="mt-5 max-w-[40em] text-xs leading-relaxed text-brand-ink-soft">
              This Blueprint was generated from the deterministic Cardology
              calculation — the same birthday always produces the same report.
              It&rsquo;s a mirror for reflection, not a prediction or a diagnosis.
            </p>
          </section>
        )}

        {sample && (
          <p className="border-t border-brand-line pt-8 text-xs leading-relaxed text-brand-ink-soft">
            This is a full-structure sample generated by the same engine as a
            paid report. Your Blueprint uses <em>your</em> birth date.{" "}
            <Link
              href={`/birth-card/${report.birthCardSlug}`}
              className="editorial-link text-brand-ink"
            >
              Peek the {report.birthCard} card page
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
