import type { Metadata } from "next";

import { SeoShell } from "@/components/seo/SeoShell";
import { YourYearView } from "@/components/seo/YourYearView";
import { allPeriodCardSeeds } from "@/lib/period-card-seeds";
import { SITE_NAME } from "@/lib/site";

const canonicalPath = "/your-year";
const title = "Your Year in Cards: Free 52-Day Planetary Timing Spread";
const description =
  "The seven planetary seasons of your Cardology year. Where you are, what's next, today's card. Free, from your birthday. No spoilers, just cards.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title,
  description,
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
      <header className="flex flex-col gap-4 pb-2">
        <p className="bp-label">Your year · seven 52-day periods</p>
        <h1 className="bp-display">
          Which period are you in <span className="bp-red">right now?</span>
        </h1>
        <p className="bp-lead">
          Six 52-day seasons, then Neptune through the eve of your next birthday.
          You are somewhere in there. Let&rsquo;s find out where.
        </p>
      </header>

      <YourYearView seeds={seeds} />
    </SeoShell>
  );
}
