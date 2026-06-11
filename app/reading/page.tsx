import type { Metadata } from "next";

import ReadingClient from "@/components/app/ReadingClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Reading";
const description =
  "Generate a deeper Cardology reading from a fixed birth-card structure, with access gating for the written report and public context for how the reading works.";

export const metadata: Metadata = {
  title: "Cardology Reading: Deep Dive Birth Card Report",
  description,
  alternates: { canonical: "/reading" },
  openGraph: {
    title: "Cardology Reading: Deep Dive Birth Card Report",
    description,
    url: "/reading",
  },
};

export default function ReadingPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/reading"
      eyebrow="Deep-dive report"
      points={[
        "A crawlable page describing the deep reading before any personalized generation begins.",
        "A profile-aware report area that stays on the website instead of acting like a separate app.",
        "Clear access-gate handling for paid or code-unlocked readings.",
      ]}
    >
      <ReadingClient />
    </AppFeaturePage>
  );
}
