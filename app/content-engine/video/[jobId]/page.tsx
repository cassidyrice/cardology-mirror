import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoJobStatusView } from "@/components/content-engine/VideoJobStatus";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { readVideoJob } from "@/lib/content-engine/video-jobs";
import { videoJobsKv } from "@/lib/content-engine/video-kv";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Video order status",
  description: "Track your Content Calendar video order.",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function VideoJobStatusPage({ params }: PageProps) {
  const { jobId } = await params;
  const kv = videoJobsKv();
  const job = await readVideoJob(jobId, kv);
  if (!job) notFound();

  return (
    <SeoShell
      crumb={[
        { label: "Content Calendar", href: "/content-engine" },
        { label: "Video order", href: `/content-engine/video/${jobId}` },
      ]}
    >
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Kicker>Content Calendar · Video</Kicker>
        <h1 className="type-h1 mt-3 text-brand-ink">Your video order</h1>
        <div className="mt-8">
          <VideoJobStatusView job={job} />
        </div>
      </div>
    </SeoShell>
  );
}
