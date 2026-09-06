import type { Metadata } from "next";

import { ContentEngineForm } from "@/components/content-engine/ContentEngineForm";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

const TITLE = "Content Calendar | Card Blueprints";
const DESCRIPTION =
  "52 days of content, written for you. Not a spreadsheet: tap any day and it writes the post.";

const BAKERY_DAY_ONE = {
  theme: "Sharing the good stuff",
  why: "This week is about explaining how the bakery works, and today's angle is about sharing resources generously but sustainably.",
  post: `"We're giving our partners at [Cafe A] and [Cafe B] an extra dozen croissants this week. We love supporting other local spots."`,
  format: "Photo",
} as const;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/content-engine" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/content-engine",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ContentEnginePage() {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <header className="max-w-2xl pb-8">
          <h1 className="font-serif text-4xl leading-none text-brand-ink sm:text-5xl">
            A content calendar with a reason for every day.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-ink-soft">
            52 days of content, written for you. Not a spreadsheet: tap any day and it writes
            the post. Try seven days free below.
          </p>
        </header>

        <section
          className="mb-10 max-w-3xl border border-brand-ink bg-brand-ivory p-5 text-sm leading-relaxed text-brand-ink-soft"
          aria-labelledby="calendar-product-heading"
        >
          <h2 id="calendar-product-heading" className="font-serif text-2xl text-brand-ink">
            Content Calendar — $29 one-time
          </h2>
          <p className="mt-3">
            <strong className="text-brand-ink">What you get:</strong> a 52-day plan plus one
            written piece per day, with two regenerations per day if you want a fresh take.
          </p>
          <p className="mt-2">
            <strong className="text-brand-ink">Access:</strong> this page plus a CSV download,
            good for 52 days from your start date.
          </p>
          <p className="mt-2">
            <strong className="text-brand-ink">Limits:</strong> one calendar per purchase; the
            business description you enter is capped at 240 characters.
          </p>
          <p className="mt-2">
            <strong className="text-brand-ink">Support and refunds:</strong> digital delivery —
            if generation fails or access breaks, reply to your receipt email. See the{" "}
            <a href="/refund-policy" className="underline underline-offset-4">
              refund policy
            </a>
            .
          </p>

          <h3 className="mt-6 font-serif text-lg text-brand-ink">
            Sample — day 1 (neighborhood bakery)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-brand-line text-brand-ink">
                  <th className="p-2 font-mono uppercase tracking-wide">Day</th>
                  <th className="p-2">Theme</th>
                  <th className="p-2">Why</th>
                  <th className="p-2">Post</th>
                  <th className="p-2">Format</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-line align-top">
                  <td className="p-2 font-mono">1</td>
                  <td className="p-2">{BAKERY_DAY_ONE.theme}</td>
                  <td className="p-2">{BAKERY_DAY_ONE.why}</td>
                  <td className="p-2">{BAKERY_DAY_ONE.post}</td>
                  <td className="p-2">{BAKERY_DAY_ONE.format}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs">
            Default format in the calendar matches the sample column above.
          </p>
        </section>

        <ContentEngineForm />
      </main>
      <SiteFooter />
    </div>
  );
}
