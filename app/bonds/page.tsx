import type { Metadata } from "next";

import BondsClient from "@/components/app/BondsClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Bonds";
const description =
  "Compare two birth cards as relationship patterns: shared language, friction, suit dynamics, and reflective questions without reducing compatibility to a score.";

export const metadata: Metadata = {
  title: "Cardology Bonds: Relationship Pattern Comparison",
  description,
  alternates: { canonical: "/bonds" },
  openGraph: {
    title: "Cardology Bonds: Relationship Pattern Comparison",
    description,
    url: "/bonds",
  },
};

export default function BondsPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/bonds"
      eyebrow="Compatibility app page"
      points={[
        "A public relationship-pattern page that can be indexed on cardologypro.com.",
        "A working comparison tool for two birthdays, with or without a saved profile.",
        "Internal links back to the birth-card calculator and core Cardology explainers.",
      ]}
    >
      <BondsClient />
    </AppFeaturePage>
  );
}
