import type { Metadata } from "next";

import StoryClient from "@/components/app/StoryClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Story Arc";
const description =
  "Trace the Cardology year as a story arc: current chapter, deeper turn, result horizon, timing pressure, and the pattern asking to mature.";

export const metadata: Metadata = {
  title: "Cardology Story Arc: Your Year Reading",
  description,
  alternates: { canonical: "/story" },
  openGraph: {
    title: "Cardology Story Arc: Your Year Reading",
    description,
    url: "/story",
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
        "A year-reading view that follows the current chapter, Pluto turn, and result horizon.",
        "A profile-aware arc rail and written reading for the birth-card and ruling-card strands.",
        "Plain-language timing that names the pressure, choice, release, and direction of the year.",
      ]}
    >
      <StoryClient />
    </AppFeaturePage>
  );
}
