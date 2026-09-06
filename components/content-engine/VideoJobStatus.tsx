"use client";

import Link from "next/link";

import type { StoredVideoJob } from "@/lib/content-engine/video-jobs";
import { pieceKindLabel } from "@/lib/content-engine/write-prompt";

const STATUS_LABELS: Record<StoredVideoJob["status"], string> = {
  awaiting_assets: "Waiting for your uploads",
  queued: "Queued for production",
  processing: "In production",
  review: "In quality review",
  delivered: "Delivered",
  failed: "Needs attention",
};

export function VideoJobStatusView({ job }: { job: StoredVideoJob }) {
  const photoCount = job.assets.photos.length;
  const docCount = job.assets.documents.length;
  const logoCount = job.assets.logos.length;

  return (
    <div className="space-y-6">
      <div className="border border-brand-line bg-brand-paper-deep p-6">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-brand-ink-soft">
          Order {job.jobId.slice(0, 12)}…
        </p>
        <h2 className="type-h2 mt-2 text-brand-ink">{STATUS_LABELS[job.status]}</h2>
        <p className="mt-2 text-sm text-brand-ink-soft">
          {job.status === "delivered"
            ? "Your video link was emailed to you. Save this page to check status again."
            : "Turnaround is usually 24 hours, promised within 48. We'll email you when it's ready."}
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-brand-ink">Package</dt>
          <dd className="text-brand-ink-soft">{job.offerSlug}</dd>
        </div>
        <div>
          <dt className="font-medium text-brand-ink">Format</dt>
          <dd className="text-brand-ink-soft">{job.format}</dd>
        </div>
        {job.day ? (
          <div>
            <dt className="font-medium text-brand-ink">Calendar day</dt>
            <dd className="text-brand-ink-soft">Day {job.day}</dd>
          </div>
        ) : null}
        {job.pieceKind ? (
          <div>
            <dt className="font-medium text-brand-ink">Script type</dt>
            <dd className="text-brand-ink-soft">{pieceKindLabel(job.pieceKind)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium text-brand-ink">Voice add-on</dt>
          <dd className="text-brand-ink-soft">{job.voiceAddon ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="font-medium text-brand-ink">Assets</dt>
          <dd className="text-brand-ink-soft">
            {photoCount} photo{photoCount === 1 ? "" : "s"}
            {job.assets.audio ? ", voice track" : ""}
            {docCount ? `, ${docCount} doc${docCount === 1 ? "" : "s"}` : ""}
            {logoCount ? `, ${logoCount} logo${logoCount === 1 ? "" : "s"}` : ""}
          </dd>
        </div>
      </dl>

      {job.scriptContent ? (
        <section>
          <h3 className="type-h3 text-brand-ink">Script</h3>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap border border-brand-line bg-brand-paper p-4 text-sm">
            {job.scriptContent}
          </pre>
        </section>
      ) : null}

      <p className="text-sm text-brand-ink-soft">
        <Link href="/checkout/success" className="editorial-link text-brand-ink">
          Back to your calendar
        </Link>
        {" · "}
        <Link href="/contact" className="editorial-link text-brand-ink">
          Contact support
        </Link>
      </p>
    </div>
  );
}
