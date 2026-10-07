import type { Metadata } from "next";

import { BlueprintReportView } from "@/components/blueprint/BlueprintReportView";
import { PeriodAppView } from "@/components/card-app/PeriodApp";
import { appReadingLibrary } from "@/lib/period-library";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton } from "@/components/ui";
import { YearBlueprintApp } from "@/components/year/YearBlueprintApp";
import { buildBlueprint } from "@/lib/blueprint";
import {
  DEEP_DIVE_PRODUCT_PATH,
  FIFTY_TWO_BY_SEVEN_REPORT_SLUG,
} from "@/lib/deep-dive";
import { redirect } from "next/navigation";

import { BLUEPRINT_REPORT_SLUG, BLUEPRINT_REPORT_VIEW_PATH } from "@/lib/blueprint-report";
import { appDateParam, buildCardApp, CARD_APP_SLUG } from "@/lib/card-app";
import { verifyReportToken } from "@/lib/report-token";
import { YEAR_AHEAD_REPORT_SLUG } from "@/lib/year-ahead";
import { buildYearBlueprint } from "@/lib/year-blueprint";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Your Blueprint",
  description: "Your personalized Card Blueprints year.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ token?: string; date?: string }>;

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token, date } = await searchParams;
  const payload = await verifyReportToken(token);

  if (!payload) {
    return (
      <div className="bg-brand-paper text-brand-ink">
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <section className="shell-paper">
            <div className="mx-auto max-w-[42rem] px-5 py-24 sm:px-8">
              <Kicker className="mb-4">Sign-in link</Kicker>
              <h1 className="type-display text-brand-ink">
                This link isn&rsquo;t valid.
              </h1>
              <p className="type-body-lg mt-5 text-brand-ink-soft">
                The link may be expired, mistyped, or from an unfinished
                checkout. If you completed a purchase, reply to your receipt
                email and we&rsquo;ll resend your sign-in link.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton href={DEEP_DIVE_PRODUCT_PATH} variant="accent" size="large">
                  Ask one question
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

  // The Blueprint Report ($129) is a full HTML document with its own print CSS,
  // so it is served by app/report/route.ts rather than inside the app shell.
  if (payload.slug === BLUEPRINT_REPORT_SLUG) {
    redirect(`${BLUEPRINT_REPORT_VIEW_PATH}?token=${encodeURIComponent(token ?? "")}`);
  }

  // Card Blueprint App: every card, position and timing layer, rebuilt from the
  // token's birthdate on each visit. The client passes its own calendar date so
  // "today" is the buyer's today, not the server's UTC day.
  if (payload.slug === CARD_APP_SLUG) {
    let app = null;
    let appError = "";
    try {
      app = buildCardApp(payload.birthdate, appDateParam(date, payload.birthdate));
    } catch (e) {
      appError = e instanceof Error ? e.message : "unknown engine error";
    }
    if (app) {
      return (
        <div style={{ background: "#0b0910", minHeight: "100dvh" }}>
          <PeriodAppView data={app} readings={appReadingLibrary(app)} token={token ?? ""} />
        </div>
      );
    }
    return <EngineErrorPage reference={appError} />;
  }

  // The 52xSeven Blueprint (retired from sale 2026-09-13) still renders for past buyers: a phone-shaped year app.
  // Your Year Ahead ($19) renders the same year model for its buyers.
  if (payload.slug === FIFTY_TWO_BY_SEVEN_REPORT_SLUG || payload.slug === YEAR_AHEAD_REPORT_SLUG) {
    let year = null;
    let yearError = "";
    try {
      year = await buildYearBlueprint(payload.birthdate);
    } catch (e) {
      yearError = e instanceof Error ? e.message : "unknown engine error";
    }
    if (year) {
      return (
        <div style={{ background: "#0b0910", minHeight: "100dvh" }}>
          <YearBlueprintApp data={year} mode="full" framed={false} />
        </div>
      );
    }
    return <EngineErrorPage reference={yearError} />;
  }

  // Legacy Personal Card Blueprint tokens still open the written report.
  let report;
  let engineError = "";
  try {
    report = await buildBlueprint(payload.birthdate);
  } catch (e) {
    engineError = e instanceof Error ? e.message : "unknown engine error";
  }

  if (!report) {
    return <EngineErrorPage reference={engineError} />;
  }

  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper">
          <div className="mx-auto w-full max-w-4xl px-5 py-[clamp(3rem,7vw,5.5rem)] sm:px-8 lg:px-10">
            <Kicker className="mb-6">Your Personal Card Blueprint</Kicker>
            <BlueprintReportView report={report} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EngineErrorPage({ reference }: { reference: string }) {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper">
          <div className="mx-auto max-w-[42rem] px-5 py-24 sm:px-8">
            <Kicker className="mb-4">Your year</Kicker>
            <h1 className="type-display text-brand-ink">
              We couldn&rsquo;t build this year.
            </h1>
            <p className="type-body-lg mt-5 text-brand-ink-soft">
              The birth date on this purchase isn&rsquo;t one the Cardology
              engine can read. Reply to your receipt email with a corrected
              date and we&rsquo;ll unlock the right year.
            </p>
            <p className="mt-4 text-xs text-brand-ink-faint">
              Reference: {reference}
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
