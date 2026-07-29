import type { Metadata } from "next";

import ReadingClient from "@/components/app/ReadingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Reading";
const description =
  "Generate a deeper Cardology reading from a fixed birth-card structure, with access gating for paid readers and public context for how the reading works.";

export const metadata: Metadata = {
  title: "Cardology Reading: Your Birth Card, Read in Depth",
  description,
  alternates: { canonical: "/reading" },
  openGraph: {
    title: "Cardology Reading: Your Birth Card, Read in Depth",
    description,
    url: "/reading",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  robots: { index: false, follow: true },
};

export default function ReadingPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/reading"
      eyebrow="Deep reading"
      points={[
        "A secondary deep-reading page after the public calculator and card meaning pages.",
        "A profile-aware report area that stays on the website instead of acting like a separate app.",
        "Clear access-gate handling for paid or code-unlocked readings.",
      ]}
    >
      <ReadingClient />
    </AppFeaturePage>
  );
}
