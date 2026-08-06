import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton } from "@/components/ui";
import { buildBlueprint } from "@/lib/blueprint";
import { verifyReportToken } from "@/lib/report-token";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Your Personal Card Blueprint",
  description: "Your personalized Card Blueprints report.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ token?: string }>;

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;
  const payload = await verifyReportToken(token);

  if (!payload) {
    return (
      <div className="bg-brand-paper text-brand-ink">
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <section className="shell-paper">
            <div className="mx-auto max-w-[42rem] px-5 py-24 sm:px-8">
              <Kicker className="mb-4">Report link</Kicker>
              <h1 className="type-display text-brand-ink">
                This report link isn&rsquo;t valid.
              </h1>
              <p className="type-body-lg mt-5 text-brand-ink-soft">
                The link may be expired, mistyped, or from an unfinished
                checkout. If you completed a purchase, reply to your receipt
                email and we&rsquo;ll resend your Blueprint link.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton href="/products/personal-card-blueprint" variant="accent" size="large">
                  Get a Personal Blueprint
                </LinkButton>
                <LinkButton href="/contact" variant="outline" size="large">
                  Contact Support
                </LinkButton>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  let report;
  let engineError = "";
  try {
    report = await buildBlueprint(payload.birthdate);
  } catch (e) {
    engineError = e instanceof Error ? e.message : "unknown engine error";
  }

  if (!report) {
    return (
      <div className="bg-brand-paper text-brand-ink">
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <section className="shell-paper">
            <div className="mx-auto max-w-[42rem] px-5 py-24 sm:px-8">
              <Kicker className="mb-4">Report generation</Kicker>
              <h1 className="type-display text-brand-ink">
                We couldn&rsquo;t generate this report.
              </h1>
              <p className="type-body-lg mt-5 text-brand-ink-soft">
                The birth date on this purchase isn&rsquo;t one the Cardology
                engine can read. Reply to your receipt email with a corrected
                date and we&rsquo;ll regenerate your Blueprint.
              </p>
              <p className="mt-4 text-xs text-brand-ink-faint">
                Reference: {engineError}
              </p>
              <div className="mt-8">
                <LinkButton href="/contact" variant="outline" size="large">
                  Contact Support
                </LinkButton>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper">
          <div className="mx-auto w-full max-w-4xl px-5 py-[clamp(3rem,7vw,5.5rem)] sm:px-8 lg:px-10">
            <Kicker className="mb-4">Your Personal Card Blueprint</Kicker>
            <h1 className="type-display text-brand-ink">
              {report.birthCard} &mdash; {report.birthCardTitle}
            </h1>
            <p className="type-body-lg mt-5 max-w-[38em] text-brand-ink-soft">
              A pattern read, not a prophecy. This is the map of the card your
              birthday carries, the layer it expresses through, and the chapter
              it&rsquo;s walking right now.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-brand-ink-faint">
              Birth date on file: {report.birthdate} &middot; reflection framework, not a forecast
            </p>
          </div>
        </section>

        <section className="shell-paper-deep border-t border-brand-line">
          <div className="mx-auto max-w-4xl space-y-12 px-5 py-12 sm:px-8 lg:px-10">
            <div>
              <h2 className="type-h2 text-brand-ink">Your core pattern</h2>
              <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
                {report.coreIdentity}
              </p>
              <p className="mt-3 max-w-[40em] text-sm text-brand-ink-soft">
                Suit domain: {report.suitDomain}.
              </p>
            </div>

            <div>
              <h2 className="type-h2 text-brand-ink">Strengths</h2>
              <ul className="mt-4 max-w-[40em] space-y-2 leading-relaxed text-brand-ink-soft">
                {report.gifts.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-bronze">&middot;</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="type-h2 text-brand-ink">The growth edge</h2>
              <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
                {report.shadow}
              </p>
            </div>

            <div className="border-t border-brand-line pt-10">
              <h2 className="type-h2 text-brand-ink">
                Your ruling layer: {report.rulingCard} &mdash; {report.rulingCardTitle}
              </h2>
              <p className="mt-4 max-w-[40em] leading-relaxed text-brand-ink-soft">
                The birth card is the engine; the ruling card is how it shows
                up in your style and first impressions. {report.rulingIdentity}
              </p>
              <p className="mt-3 max-w-[40em] leading-relaxed text-brand-ink-soft">
                Watch for: {report.rulingShadow}
              </p>
            </div>

            <div className="border-t border-brand-line pt-10">
              <h2 className="type-h2 text-brand-ink">The chapter you&rsquo;re in now</h2>
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
            </div>

            <div className="border-t border-brand-line pt-10">
              <h2 className="type-h2 text-brand-ink">Questions to sit with</h2>
              <ol className="mt-4 max-w-[40em] list-decimal space-y-3 pl-5 leading-relaxed text-brand-ink-soft">
                {report.reflectionPrompts.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>

            <div className="border-t border-brand-line pt-10">
              <h2 className="type-h2 text-brand-ink">Next steps</h2>
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
                calculation — the same birthday always produces the same
                report. It&rsquo;s a mirror for reflection, not a prediction or
                a diagnosis.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
