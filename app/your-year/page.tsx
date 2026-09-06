import type { Metadata } from "next";

import { SeoShell } from "@/components/seo/SeoShell";
import { YourYearView } from "@/components/seo/YourYearView";
import { allPeriodCardSeeds } from "@/lib/period-card-seeds";
import { SITE_NAME } from "@/lib/site";

const canonicalPath = "/your-year";
const title = "Your year in cards";
const description =
  "See the seven 52-day periods of your Cardology year — current stretch, upcoming cards, and today's card — free, from your birthday.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false },
  alternates: { canonical: canonicalPath },
  openGraph: {
    siteName: SITE_NAME,
    title,
    description,
    url: canonicalPath,
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og/default.png"],
  },
};

export default function YourYearPage() {
  const seeds = allPeriodCardSeeds();

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Calculator", href: "/birth-card-calculator" },
        { label: "Your year", href: canonicalPath },
      ]}
    >
      <header className="mx-auto max-w-lg pb-6 text-center">
        <h1 className="display text-4xl leading-none text-brand-ink sm:text-5xl">
          Your year in cards
        </h1>
        <p className="mt-3 font-serif text-lg leading-relaxed text-brand-ink-soft">
          Seven 52-day stretches from birthday to birthday.
        </p>
      </header>

      <YourYearView seeds={seeds} />
    </SeoShell>
  );
}
