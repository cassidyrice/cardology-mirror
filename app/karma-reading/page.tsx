import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterSignupForm } from "@/components/seo/NewsletterSignupForm";
import { SeoShell } from "@/components/seo/SeoShell";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

// The waitlist page is noindex and out of the sitemap, so it has no entry in the dated-page map.
const UPDATED = PAGE_UPDATED_DATES["/karma-reading"] ?? "2026-09-05";

const TITLE = "Reading Day waitlist | Card Blueprints";
const DESCRIPTION =
  "The first Reading Day didn't fill. Join the list for the next one.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: "/karma-reading" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/karma-reading",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function KarmaReadingWaitlistPage() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Reading Day waitlist", href: "/karma-reading" },
      ]}
    >
      <header className="max-w-3xl pb-8">
        <h1 className="display text-4xl leading-none text-brand-ink sm:text-5xl">
          The first Reading Day didn&rsquo;t fill.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-brand-ink-soft">
          Join the list for the next one.
        </p>
        <p className="mt-4 text-xs text-brand-ink-soft">
          By{" "}
          <Link href="/about" className="underline underline-offset-4">
            Cassidy Rice
          </Link>
          {" · "}
          {updatedLabel(UPDATED)}
        </p>
      </header>

      <div className="max-w-xl">
        <NewsletterSignupForm
          source="home-reading-waitlist"
          heading="One email when the next date opens"
          body="That's it. No Monday card pitch on this list."
          buttonLabel="Notify me"
          finePrint="Unsubscribe anytime."
        />
      </div>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-brand-ink-soft">
        Meanwhile: look up your pair on the{" "}
        <Link href="/karma-cards" className="underline underline-offset-4">
          karma cards table
        </Link>
        , or take the{" "}
        <Link href="/products/birth-card-deep-dive" className="underline underline-offset-4">
          $9 Birth Card Deep Dive
        </Link>
        .
      </p>
    </SeoShell>
  );
}
