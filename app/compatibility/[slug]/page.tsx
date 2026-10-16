import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkerPageView } from "@/components/seo/WorkerPageView";
import { compatMetadata, compatPage, compatSlugs } from "@/lib/compatibility-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return compatSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = compatPage(slug);
  return page ? compatMetadata(page) : {};
}

export default async function CompatibilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = compatPage(slug);
  if (!page) notFound();
  return <WorkerPageView page={page} kind="compatibility" />;
}
