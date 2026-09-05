import type { Metadata } from "next";

import { ContentEngineForm } from "@/components/content-engine/ContentEngineForm";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

const TITLE = "Content Engine | Card Blueprints";
const DESCRIPTION =
  "A content calendar with a reason for every day. Tell it your business. Get 52 days of themes, posts, and formats.";

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
            Tell it your business. It gives you 52 days of themes, posts and formats,
            each one on a fixed daily pattern you can check.
          </p>
        </header>
        <ContentEngineForm />
      </main>
      <SiteFooter />
    </div>
  );
}
