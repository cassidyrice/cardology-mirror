import { describe, expect, test } from "bun:test";

import {
  buildVideoAssetKey,
  safeUploadFilename,
  validateAssetKeyForSession,
  validateUploadFile,
} from "../lib/content-engine/video-upload";
import {
  createVideoJobFromCheckout,
  readVideoJob,
  videoJobKvKey,
  writeVideoJob,
  type VideoJobsKv,
} from "../lib/content-engine/video-jobs";
import {
  parseVideoAssetKeys,
  videoOfferAvailable,
  videoSessionMetadata,
} from "../lib/content-video";
import {
  availableVideoProducts,
  checkoutProductBySlug,
  isVideoOffer,
} from "../lib/products";

function mockVideoJobsKv(): VideoJobsKv & {
  store: Map<string, { value: string; expirationTtl?: number }>;
} {
  const store = new Map<string, { value: string; expirationTtl?: number }>();
  return {
    store,
    async get(key: string) {
      return store.get(key)?.value ?? null;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, { value, expirationTtl: options?.expirationTtl });
    },
  };
}

describe("video upload validation", () => {
  test("accepts jpeg photo under limit", () => {
    const result = validateUploadFile("photos", {
      name: "shop.jpg",
      type: "image/jpeg",
      size: 1024,
    });
    expect(result.ok).toBe(true);
  });

  test("rejects oversize photo", () => {
    const result = validateUploadFile("photos", {
      name: "big.jpg",
      type: "image/jpeg",
      size: 11 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("too large");
  });

  test("rejects unsafe mime for audio field", () => {
    const result = validateUploadFile("audio", {
      name: "evil.exe",
      type: "application/octet-stream",
      size: 100,
    });
    expect(result.ok).toBe(false);
  });

  test("builds session-scoped asset keys", () => {
    const key = buildVideoAssetKey("cs_test_123", "photos", "my pic.jpg");
    expect(key).toMatch(/^video-assets\/cs_test_123\/photos\//);
    expect(validateAssetKeyForSession(key, "cs_test_123")).toBe(true);
    expect(validateAssetKeyForSession(key, "other_session")).toBe(false);
  });

  test("sanitizes filenames", () => {
    expect(safeUploadFilename("../../secret.pdf")).toBe("secret.pdf");
    expect(safeUploadFilename("")).toBe("file");
  });
});

describe("video job KV shape", () => {
  test("round-trips a queued job", async () => {
    const kv = mockVideoJobsKv();
    const job = createVideoJobFromCheckout({
      checkoutSessionId: "cs_vid_001",
      calendarSessionId: "cs_cal_001",
      offerSlug: "video-single",
      format: "vertical-short-60",
      voiceAddon: false,
      day: 3,
      pieceKind: "short-video",
      scriptContent: "Hook line here.",
      business: "Test bakery",
      assets: { photos: ["video-assets/cs_cal_001/photos/a.jpg"], documents: [], logos: [] },
    });
    expect(job.status).toBe("queued");
    expect(videoJobKvKey(job.jobId)).toBe("video-job:cs_vid_001");

    await writeVideoJob(job, kv);
    const read = await readVideoJob("cs_vid_001", kv);
    expect(read?.offerSlug).toBe("video-single");
    expect(read?.day).toBe(3);
    expect(read?.assets.photos).toHaveLength(1);
  });

  test("awaiting_assets when no uploads yet", () => {
    const job = createVideoJobFromCheckout({
      checkoutSessionId: "cs_vid_002",
      calendarSessionId: "cs_cal_002",
      offerSlug: "video-weekly-7",
      format: "vertical-short-30",
      voiceAddon: true,
    });
    expect(job.status).toBe("awaiting_assets");
    expect(job.voiceAddon).toBe(true);
  });
});

describe("video session metadata", () => {
  test("includes calendar session and format", () => {
    const meta = videoSessionMetadata({
      offerSlug: "video-single",
      calendarSessionId: "cs_cal_abc",
      day: 5,
      pieceKind: "short-video",
      format: "vertical-short-60",
      voiceAddon: true,
      assetKeys: { photos: ["k1"], documents: [], logos: [] },
    });
    expect(meta.calendar_session_id).toBe("cs_cal_abc");
    expect(meta.video_day).toBe("5");
    expect(meta.voice_addon).toBe("true");
    expect(parseVideoAssetKeys(meta.asset_keys).photos).toEqual(["k1"]);
  });
});

describe("video products", () => {
  test("checkout lookup includes video-single when env set", () => {
    const prev = process.env.STRIPE_PRICE_VIDEO_SINGLE;
    process.env.STRIPE_PRICE_VIDEO_SINGLE = "price_test_single";
    expect(videoOfferAvailable("video-single")).toBe(true);
    const product = checkoutProductBySlug("video-single");
    expect(product?.slug).toBe("video-single");
    expect(isVideoOffer(product)).toBe(true);
    process.env.STRIPE_PRICE_VIDEO_SINGLE = prev;
  });

  test("daily pack hidden without env", () => {
    const prev = process.env.STRIPE_PRICE_VIDEO_DAILY_52;
    delete process.env.STRIPE_PRICE_VIDEO_DAILY_52;
    expect(availableVideoProducts().some((p) => p.slug === "video-daily-52")).toBe(
      false,
    );
    process.env.STRIPE_PRICE_VIDEO_DAILY_52 = prev;
  });
});
