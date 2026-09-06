import type { Metadata } from "next";

import { ExploreDirectory } from "@/components/explore/ExploreDirectory";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

const EXPLORE_TITLE = "Explore Card Blueprints";
const EXPLORE_DESCRIPTION =
  "Find your birth card, read all 52 meanings, compare two people, check timing tools, and see what is free vs paid.";

export const metadata: Metadata = {
  title: { absolute: EXPLORE_TITLE },
  description: EXPLORE_DESCRIPTION,
  alternates: { canonical: "/explore" },
  openGraph: {
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
    url: "/explore",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Card Blueprints — explore the library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
    images: ["/og/default.png"],
  },
};

export default function ExplorePage() {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <ExploreDirectory />
      </main>
      <SiteFooter />
    </div>
  );
}
