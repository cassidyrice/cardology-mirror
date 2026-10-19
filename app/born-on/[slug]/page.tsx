import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BornOnPageView } from "@/components/seo/BornOnPageView";
import { bornOnMetadata, bornOnPage, bornOnSlugs } from "@/lib/born-on";

export const dynamicParams = false;

export function generateStaticParams() {
  return bornOnSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = bornOnPage(slug);
  return page ? bornOnMetadata(page) : {};
}

export default async function BornOnDayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = bornOnPage(slug);
  if (!page) notFound();
  return <BornOnPageView page={page} />;
}
