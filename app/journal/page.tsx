import type { Metadata } from "next";

import JournalClient from "@/components/app/JournalClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Journal";
const description =
  "Use daily Cardology reflection prompts and a private on-device journal to notice card patterns, recurring choices, and what the day's mirror brings up.";

export const metadata: Metadata = {
  title: "Cardology Journal: Daily Reflection Prompts",
  description,
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "Cardology Journal: Daily Reflection Prompts",
    description,
    url: "/journal",
  },
  robots: { index: false, follow: true },
};

export default function JournalPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/journal"
      eyebrow="Reflection page"
      points={[
        "A secondary reflection page after the public daily, timing, and meaning content.",
        "Private on-device writing once a visitor creates a local profile.",
        "Mobile-first prompt and entry surfaces that remain part of the main website.",
      ]}
    >
      <JournalClient />
    </AppFeaturePage>
  );
}
