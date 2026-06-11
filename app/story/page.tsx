import type { Metadata } from "next";

import StoryClient from "@/components/app/StoryClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Story Arc";
const description =
  "Trace the Cardology year as a story arc: current chapter, deeper turn, and horizon, framed as reflective timing language rather than fixed destiny.";

export const metadata: Metadata = {
  title: "Cardology Story Arc: Your Year Reading",
  description,
  alternates: { canonical: "/story" },
  openGraph: {
    title: "Cardology Story Arc: Your Year Reading",
    description,
    url: "/story",
  },
};

export default function StoryPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/story"
      eyebrow="Annual arc page"
      points={[
        "A public page for the annual Cardology story-arc feature.",
        "A profile-aware arc rail and written reading that load without leaving the website.",
        "Plain-language framing that keeps timing reflective rather than predictive.",
      ]}
    >
      <StoryClient />
    </AppFeaturePage>
  );
}
