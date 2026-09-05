import type { PieceKind } from "./write-prompt";
import type { VideoAssetKeys, VideoFormat, VideoOfferSlug } from "@/lib/content-video";

export type VideoJobStatus =
  | "awaiting_assets"
  | "queued"
  | "processing"
  | "review"
  | "delivered"
  | "failed";

export type StoredVideoJob = {
  jobId: string;
  checkoutSessionId: string;
  calendarSessionId: string;
  offerSlug: VideoOfferSlug;
  status: VideoJobStatus;
  format: VideoFormat;
  voiceAddon: boolean;
  day?: number;
  pieceKind?: PieceKind;
  scriptContent?: string;
  business?: string;
  assets: VideoAssetKeys;
  outputMp4Key?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type VideoJobsKv = {
  get(key: string, type?: "text"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

/** 60 days — buyer can reopen the status page through delivery + buffer. */
export const VIDEO_JOB_KV_TTL_SECONDS = 60 * 24 * 60 * 60;

export function videoJobKvKey(jobId: string): string {
  return `video-job:${jobId}`;
}

export function isValidVideoJobStatus(value: string): value is VideoJobStatus {
  return [
    "awaiting_assets",
    "queued",
    "processing",
    "review",
    "delivered",
    "failed",
  ].includes(value);
}

export async function readVideoJob(
  jobId: string,
  kv: VideoJobsKv | null,
): Promise<StoredVideoJob | null> {
  if (!kv || !jobId) return null;
  const raw = await kv.get(videoJobKvKey(jobId));
  if (!raw) return null;
  try {
    const job = JSON.parse(raw) as StoredVideoJob;
    if (!job.jobId || !job.checkoutSessionId || !job.offerSlug) return null;
    return job;
  } catch {
    return null;
  }
}

export async function writeVideoJob(
  job: StoredVideoJob,
  kv: VideoJobsKv | null,
): Promise<boolean> {
  if (!kv) return false;
  await kv.put(videoJobKvKey(job.jobId), JSON.stringify(job), {
    expirationTtl: VIDEO_JOB_KV_TTL_SECONDS,
  });
  return true;
}

export function createVideoJobFromCheckout(opts: {
  checkoutSessionId: string;
  calendarSessionId: string;
  offerSlug: VideoOfferSlug;
  format: VideoFormat;
  voiceAddon: boolean;
  day?: number;
  pieceKind?: PieceKind;
  scriptContent?: string;
  business?: string;
  assets?: VideoAssetKeys;
  customerEmail?: string;
}): StoredVideoJob {
  const now = new Date().toISOString();
  const assets = opts.assets ?? { photos: [], documents: [], logos: [] };
  const hasAssets =
    assets.photos.length > 0 ||
    Boolean(assets.audio) ||
    assets.documents.length > 0 ||
    assets.logos.length > 0;

  return {
    jobId: opts.checkoutSessionId,
    checkoutSessionId: opts.checkoutSessionId,
    calendarSessionId: opts.calendarSessionId,
    offerSlug: opts.offerSlug,
    status: hasAssets ? "queued" : "awaiting_assets",
    format: opts.format,
    voiceAddon: opts.voiceAddon,
    day: opts.day,
    pieceKind: opts.pieceKind,
    scriptContent: opts.scriptContent,
    business: opts.business,
    assets,
    customerEmail: opts.customerEmail,
    createdAt: now,
    updatedAt: now,
  };
}
