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
          <p className="mb-3 text-sm text-brand-ink-soft">
            Sample report, not a real customer
          </p>
        )}
        <h2 className="type-display text-brand-ink">
          {report.birthCard}, {report.birthCardTitle}
        </h2>
        <p className="type-body-lg mt-5 text-brand-ink">
          A pattern read, not a prophecy. This is the map of the card your
          birthday carries, the layer it expresses through, and this year&rsquo;s
          bit in the deck.
        </p>
        <p className="mt-3 text-sm text-brand-ink-soft">
          {dateLine}. A reflection framework, not a forecast.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        <section>
          <h3 className="type-h2 text-brand-ink">Your core pattern</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
            {report.coreIdentity}
          </p>
          <p className="mt-3 max-w-[40em] text-sm text-brand-ink-soft">
            Suit domain: {report.suitDomain}.
          </p>
        </section>

        <section>
          <h3 className="type-h2 text-brand-ink">Strengths</h3>
          <ul className="mt-4 max-w-[40em] space-y-2 leading-relaxed text-brand-ink">
            {report.gifts.map((g, i) => (
              <li key={i} className="list-disc ml-5">
                {g}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="type-h2 text-brand-ink">The growth edge</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
            {report.shadow}
          </p>
        </section>

        <section className="pt-4">
          <h3 className="type-h2 text-brand-ink">
            Your ruling layer: {report.rulingCard}, {report.rulingCardTitle}
          </h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
            The birth card is the engine; the ruling card is how it shows up in
            your style and first impressions. {report.rulingIdentity}
          </p>
          <p className="mt-3 max-w-[40em] leading-relaxed text-brand-ink">
            Watch for: {report.rulingShadow}
          </p>
        </section>

        <section className="pt-4">
          <h3 className="type-h2 text-brand-ink">This year&rsquo;s bit in the deck</h3>
          <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
            This year&rsquo;s bit in the deck runs through{" "}
            {report.currentChapter.planet}, the calendar map&rsquo;s{" "}
            {report.currentChapter.domain.toLowerCase()} stretch, governed by
            the {report.currentChapter.card} ({report.currentChapter.meaning}).
            Entertainment structure, not a sky forecast.
          </p>
          <dl className="mt-6 max-w-[40em] space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-brand-ink">At its balanced best</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink">
                {report.currentChapter.balanced}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-ink">When it slips under</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink">
                {report.currentChapter.under}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-ink">When it overplays</dt>
              <dd className="mt-1 leading-relaxed text-brand-ink">
                {report.currentChapter.over}
              </dd>
            </div>
          </dl>
        </section>

        {report.yearAhead && report.yearAhead.length > 0 && (
          <section className="pt-4">
            <h3 className="type-h2 text-brand-ink">All seven 52-day cards this year</h3>
            <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
              Your year runs through seven ~52-day stretches, each governed by
              one card from your yearly spread. The active one gets the deep
              dive above; here is the whole walk, in order.
            </p>
            <ul className="mt-6 max-w-[40em] space-y-3 text-sm">
              {report.yearAhead.map((p) => (
                <li
                  key={p.planet}
                  className={`p-3 ${p.active ? "bg-brand-paper-deep" : ""}`}
                >
                  <p className="font-semibold text-brand-ink">
                    {p.planet}: {p.card}, {p.meaning}
                    {p.active && (
                      <span className="ml-2 font-normal text-brand-ink-soft">
                        (you are here)
                      </span>
                    )}
                  </p>
                  <p className="mt-1 leading-relaxed text-brand-ink">
                    {p.domain}. Balanced: {p.balanced}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.yearlySignals && (
          <section className="pt-4">
            <h3 className="type-h2 text-brand-ink">Yearly signals</h3>
            <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
              Beyond the seven periods, the year carries standing signal cards:
              the Long Range card (the year&rsquo;s through-line), Pluto (the
              pressure point), Result (where the pressure resolves), and the
              lifetime Environment and Displacement pair.
            </p>
            <dl className="mt-6 max-w-[40em] space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-brand-ink">
                  Long Range: {report.yearlySignals.longRange.card}
                </dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  The theme threading through the whole year.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">
                  Pluto: {report.yearlySignals.pluto.card}
                </dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  {report.yearlySignals.pluto.meaning ||
                    "The long-arc challenge the year keeps returning to."}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">
                  Result: {report.yearlySignals.result.card}
                </dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  {report.yearlySignals.result.meaning ||
                    "Where the Pluto pressure tends to resolve."}
                </dd>
              </div>
              {report.yearlySignals.environment && report.yearlySignals.displacement ? (
                <div>
                  <dt className="font-semibold text-brand-ink">
                    Environment {report.yearlySignals.environment.card} and
                    {" "}Displacement {report.yearlySignals.displacement.card}
                  </dt>
                  <dd className="mt-1 leading-relaxed text-brand-ink">
                    The lifetime pair: the energy that supports you, and the seat
                    your card displaces.
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="font-semibold text-brand-ink">
                    Environment and Displacement
                  </dt>
                  <dd className="mt-1 leading-relaxed text-brand-ink">
                    Your birth card is one of the three Fixed cards: it holds
                    its own seat and carries no Environment/Displacement pair.
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {report.dailyCard && (
          <section className="pt-4">
            <h3 className="type-h2 text-brand-ink">Your card for today</h3>
            <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink">
              Inside this stretch of {report.currentChapter.planet}, today
              falls in a shorter {report.dailyCard.subPlanet} sub-period,{" "}
              {report.dailyCard.domain.toLowerCase()}, governed by{" "}
              {report.dailyCard.card} ({report.dailyCard.meaning}).
            </p>
            <dl className="mt-6 max-w-[40em] space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-brand-ink">Balanced today</dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  {report.dailyCard.balanced}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">If it slips under</dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  {report.dailyCard.under}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-ink">If it overplays</dt>
                <dd className="mt-1 leading-relaxed text-brand-ink">
                  {report.dailyCard.over}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <section className="pt-4">
          <h3 className="type-h2 text-brand-ink">Questions to sit with</h3>
          <ol className="mt-4 max-w-[40em] list-decimal space-y-3 pl-5 leading-relaxed text-brand-ink">
            {report.reflectionPrompts.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>

        {!sample && (
          <section className="pt-4">
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
            <p className="mt-5 max-w-[40em] text-xs leading-relaxed text-brand-ink">
              This Blueprint was generated from the deterministic Cardology
              calculation: the same birthday always produces the same report.
              It&rsquo;s a mirror for reflection, not a prediction or a diagnosis.
            </p>
          </section>
        )}

        {sample && (
          <p className="pt-8 text-sm leading-relaxed text-brand-ink">
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
