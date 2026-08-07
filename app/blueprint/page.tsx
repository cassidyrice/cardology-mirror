import type { Metadata } from "next";

import { BlueprintReportView } from "@/components/blueprint/BlueprintReportView";
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
            <Kicker className="mb-6">Your Personal Card Blueprint</Kicker>
            <BlueprintReportView report={report} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
