/** Content Calendar video tier checkout helpers. Prices come only from env (fail-closed). */

import type { PieceKind } from "@/lib/content-engine/write-prompt";

export const VIDEO_SINGLE_SLUG = "video-single";
export const VIDEO_WEEKLY_7_SLUG = "video-weekly-7";
export const VIDEO_DAILY_52_SLUG = "video-daily-52";
export const VIDEO_VOICE_ADDON_SLUG = "video-voice-addon";

export const VIDEO_OFFER_SLUGS = [
  VIDEO_SINGLE_SLUG,
  VIDEO_WEEKLY_7_SLUG,
  VIDEO_DAILY_52_SLUG,
  VIDEO_VOICE_ADDON_SLUG,
] as const;

export type VideoOfferSlug = (typeof VIDEO_OFFER_SLUGS)[number];

export type VideoFormat = "vertical-short-30" | "vertical-short-60";

export const VIDEO_FORMATS: { value: VideoFormat; label: string }[] = [
  { value: "vertical-short-30", label: "30-second vertical short" },
  { value: "vertical-short-60", label: "60-second vertical short" },
];

export function isVideoOfferSlug(slug: string): slug is VideoOfferSlug {
  return (VIDEO_OFFER_SLUGS as readonly string[]).includes(slug);
}

export function videoSinglePriceId(): string {
  return process.env.STRIPE_PRICE_VIDEO_SINGLE || "";
}

export function videoWeekly7PriceId(): string {
  return process.env.STRIPE_PRICE_VIDEO_WEEKLY_7 || "";
}

export function videoDaily52PriceId(): string {
  return process.env.STRIPE_PRICE_VIDEO_DAILY_52 || "";
}

export function videoVoiceAddonPriceId(): string {
  return process.env.STRIPE_PRICE_VIDEO_VOICE_ADDON || "";
}

export function videoPriceIdForSlug(slug: string): string {
  switch (slug) {
    case VIDEO_SINGLE_SLUG:
      return videoSinglePriceId();
    case VIDEO_WEEKLY_7_SLUG:
      return videoWeekly7PriceId();
    case VIDEO_DAILY_52_SLUG:
      return videoDaily52PriceId();
    case VIDEO_VOICE_ADDON_SLUG:
      return videoVoiceAddonPriceId();
    default:
      return "";
  }
}

export function videoOfferAvailable(slug: string): boolean {
  if (slug === VIDEO_DAILY_52_SLUG) {
    return Boolean(videoDaily52PriceId());
  }
  if (slug === VIDEO_VOICE_ADDON_SLUG) {
    return Boolean(videoVoiceAddonPriceId());
  }
  if (slug === VIDEO_SINGLE_SLUG) {
    return Boolean(videoSinglePriceId());
  }
  if (slug === VIDEO_WEEKLY_7_SLUG) {
    return Boolean(videoWeekly7PriceId());
  }
  return false;
}

export type VideoAssetKeys = {
  photos: string[];
  audio?: string;
  documents: string[];
  logos: string[];
};

export function videoSessionMetadata(opts: {
  offerSlug: VideoOfferSlug;
  calendarSessionId: string;
  day?: number;
  pieceKind?: PieceKind;
  format: VideoFormat;
  voiceAddon?: boolean;
  assetKeys?: VideoAssetKeys;
  source?: string;
}): Record<string, string> {
  const meta: Record<string, string> = {
    sku: opts.offerSlug,
    offer_slug: opts.offerSlug,
    calendar_session_id: opts.calendarSessionId,
    video_format: opts.format,
    voice_addon: opts.voiceAddon ? "true" : "false",
    source: opts.source || "content-engine",
    product_kind: "video_service",
  };
  if (opts.day !== undefined) {
    meta.video_day = String(opts.day);
  }
  if (opts.pieceKind) {
    meta.piece_kind = opts.pieceKind;
  }
  if (opts.assetKeys) {
    meta.asset_keys = JSON.stringify(opts.assetKeys).slice(0, 500);
  }
  return meta;
}

export function parseVideoAssetKeys(raw: string | undefined): VideoAssetKeys {
  if (!raw) {
    return { photos: [], documents: [], logos: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<VideoAssetKeys>;
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos.filter(Boolean) : [],
      audio: typeof parsed.audio === "string" ? parsed.audio : undefined,
      documents: Array.isArray(parsed.documents)
        ? parsed.documents.filter(Boolean)
        : [],
      logos: Array.isArray(parsed.logos) ? parsed.logos.filter(Boolean) : [],
    };
  } catch {
    return { photos: [], documents: [], logos: [] };
  }
}
