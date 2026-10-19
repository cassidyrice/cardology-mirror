import type { Metadata } from "next";

import JournalClient from "@/components/app/JournalClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Cardology Journal";
const description =
  "Use daily Cardology reflection prompts and a private on-device journal to notice card patterns, recurring choices, and what the day's mirror brings up.";

export const metadata: Metadata = {
  title: "Cardology Journal: Daily Reflection Prompts",
  description,
  alternates: { canonical: "/journal" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Journal: Daily Reflection Prompts",
    description,
    url: "/journal",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
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
        "Choose a prompt from your cards or begin with your own question.",
        "Save private journal entries on this device.",
        "Return to earlier entries and notice what has changed.",
      ]}
    >
      <JournalClient />
    </AppFeaturePage>
  );
}
