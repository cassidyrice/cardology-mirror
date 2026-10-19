import type { Metadata } from "next";

import StoryClient from "@/components/app/StoryClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Cardology Story Arc";
const description =
  "Trace the Cardology year as a story arc: current chapter, deeper turn, result horizon, timing pressure, and the pattern asking to mature.";

export const metadata: Metadata = {
  title: "Cardology Story Arc: Your Year Reading",
  description,
  alternates: { canonical: "/story" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Story Arc: Your Year Reading",
    description,
    url: "/story",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  robots: { index: false, follow: true },
};

export default function StoryPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/story"
      eyebrow="Annual arc page"
      points={[
        "Explore the long-range, Pluto, and result cards in your yearly spread.",
        "Read themes from both your birth card and ruling card.",
        "Reflect on what you want to continue, change, or leave behind this year.",
      ]}
    >
      <StoryClient />
    </AppFeaturePage>
  );
}
