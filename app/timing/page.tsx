import type { Metadata } from "next";

import TimingClient from "@/components/app/TimingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Yearly Spread";
const description =
  "Explore the Cardology yearly spread, seven 52-day periods, current planetary chapter, and timing cards as a reflection system rather than a prediction engine.";

export const metadata: Metadata = {
  title: "Cardology Yearly Spread and 52-Day Periods",
  description,
  alternates: { canonical: "/timing" },
  openGraph: {
    title: "Cardology Yearly Spread and 52-Day Periods",
    description,
    url: "/timing",
  },
};

export default function TimingPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/timing"
      eyebrow="Timing page"
      points={[
        "An indexable explanation of the yearly spread and seven-period Cardology cycle.",
        "A personalized timing map when a visitor creates a local profile.",
        "A mobile-first timeline that keeps the app experience on the main website.",
      ]}
    >
      <TimingClient />
    </AppFeaturePage>
  );
}
