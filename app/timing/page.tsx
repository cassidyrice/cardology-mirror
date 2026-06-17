import type { Metadata } from "next";

import TimingClient from "@/components/app/TimingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Yearly Spread";
const description =
  "Explore the Cardology yearly spread, seven 52-day periods, current planetary chapter, and timing cards as pattern language for current pressure, choices, relationships, and recurring themes.";

export const metadata: Metadata = {
  title: "Cardology Yearly Spread and 52-Day Periods",
  description,
  alternates: { canonical: "/timing" },
  openGraph: {
    title: "Cardology Yearly Spread and 52-Day Periods",
    description,
    url: "/timing",
  },
  robots: { index: false, follow: true },
};

export default function TimingPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/timing"
      eyebrow="Timing page"
      points={[
        "A secondary timing view after the public 52-day period meaning tool.",
        "A personalized timing map when a visitor creates a local profile.",
        "A mobile-first timeline that keeps the app experience on the main website.",
      ]}
    >
      <TimingClient />
    </AppFeaturePage>
  );
}
