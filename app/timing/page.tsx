import type { Metadata } from "next";

import TimingClient from "@/components/app/TimingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Cardology Yearly Spread";
const description =
  "Explore the Cardology yearly spread, seven planetary seasons, your current chapter, and timing cards as prompts for choices and recurring themes.";

export const metadata: Metadata = {
  title: "Cardology Yearly Spread and 52-Day Periods",
  description,
  alternates: { canonical: "/timing" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Yearly Spread and 52-Day Periods",
    description,
    url: "/timing",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
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
        "See the dated seasons of your birthday year.",
        "Create a local profile to see the cards for your birthday.",
        "Read each card as a theme to consider, with your own experience in view.",
      ]}
    >
      <TimingClient />
    </AppFeaturePage>
  );
}
