import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

import { verifyDownloadToken } from "@/lib/download-token";
import { deepDiveBonusBySlug } from "@/lib/deep-dive";
import { digitalBySlug } from "@/lib/products";

type EbookBucket = {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

// GET /api/download/[slug]?token=...
// Streams a purchased PDF. Token must be valid, slug-matched, and unexpired.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const payload = await verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "invalid or expired download token" },
      { status: 401 },
    );
  }

  if (payload.slug !== slug) {
    return NextResponse.json(
      { error: "token does not match requested product" },
      { status: 403 },
    );
  }

  const bonus = deepDiveBonusBySlug(slug);
  const product = digitalBySlug(slug);
  if (!bonus && !product) {
    return NextResponse.json(
      { error: "unknown digital product" },
      { status: 404 },
    );
  }

  const assetKey = bonus?.key || product?.downloadAssetKey;
  const fileName = bonus?.fileName || product?.fileName;
  if (!assetKey || !fileName) {
    return NextResponse.json(
      { error: "download not configured for this product" },
      { status: 404 },
    );
  }

  try {
    let bytes: ArrayBuffer | null = null;

    // Edge runtime: the R2 binding lives on the Pages request context (wrangler.toml
    // [[r2_buckets]] EBOOK_BUCKET), never on the global scope. Fallback: a public asset origin.
    const bucket = (getOptionalRequestContext()?.env as { EBOOK_BUCKET?: EbookBucket } | undefined)?.EBOOK_BUCKET;
    if (bucket) {
      const obj = await bucket.get(assetKey);
      if (!obj) throw new Error("R2 object not found");
      bytes = await obj.arrayBuffer();
    } else if (process.env.EBOOK_ASSET_BASE_URL) {
      const res = await fetch(
        `${process.env.EBOOK_ASSET_BASE_URL.replace(/\/$/, "")}/${assetKey}`,
      );
      if (!res.ok) throw new Error(`asset fetch ${res.status}`);
      bytes = await res.arrayBuffer();
    }

    if (!bytes) {
      return NextResponse.json(
        { error: "digital download not configured" },
        { status: 503 },
      );
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (e) {
    console.error(`[download] failed for slug=${slug}`, e);
    return NextResponse.json(
      { error: "download unavailable" },
      { status: 503 },
    );
  }
}