import type { Metadata } from "next";

import ReadingClient from "@/components/app/ReadingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Cardology Reading";
const description =
  "Generate a deeper Cardology reading from a fixed birth-card structure, with access gating for paid readers and public context for how the reading works.";

export const metadata: Metadata = {
  title: "Cardology Reading: Your Birth Card, Read in Depth",
  description,
  alternates: { canonical: "/reading" },
  openGraph: {
    siteName: SITE_NAME,
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
        "Return to the reading connected to your saved birthday.",
        "Use the access link or code from your purchase to open eligible readings.",
        "Keep your cards beside the text and take time with the reflection questions.",
      ]}
    >
      <ReadingClient />
    </AppFeaturePage>
  );
}
