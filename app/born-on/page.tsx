import type { Metadata } from "next";

import { BornOnPageView } from "@/components/seo/BornOnPageView";
import { bornOnMetadata, bornOnPage } from "@/lib/born-on";

const INDEX = bornOnPage("")!;

export const metadata: Metadata = bornOnMetadata(INDEX);

export default function BornOnIndexPage() {
  return <BornOnPageView page={INDEX} />;
}
