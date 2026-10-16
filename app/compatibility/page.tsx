import type { Metadata } from "next";

import { WorkerPageView } from "@/components/seo/WorkerPageView";
import { compatIndexPage, compatMetadata } from "@/lib/compatibility-pages";

const INDEX = compatIndexPage();

export const metadata: Metadata = compatMetadata(INDEX);

export default function CompatibilityIndexPage() {
  return <WorkerPageView page={INDEX} kind="compatibility" />;
}
