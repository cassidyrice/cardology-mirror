import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Content Engine | Card Blueprints",
  description: "A content calendar with a reason for every day.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/content-engine" },
};

/** Stub until E1 lands the sample form + paid calendar. Header link must not 404. */
export default function ContentEngineStubPage() {
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Content Engine", href: "/content-engine" }]}>
      <header className="max-w-2xl pb-6">
        <h1 className="display text-4xl leading-none text-brand-ink sm:text-5xl">
          Content Engine
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-brand-ink-soft">
          A content calendar with a reason for every day. The sample form ships next.
        </p>
      </header>
      <p className="text-sm text-brand-ink-soft">
        Meanwhile:{" "}
        <Link href="/" className="underline underline-offset-4">
          find your birth card
        </Link>
        .
      </p>
    </SeoShell>
  );
}
