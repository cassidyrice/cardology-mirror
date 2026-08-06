import { NextRequest, NextResponse } from "next/server";

import { verifyDownloadToken } from "@/lib/download-token";
import { digitalBySlug } from "@/lib/products";

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

  const product = digitalBySlug(slug);
  if (!product) {
    return NextResponse.json(
      { error: "unknown digital product" },
      { status: 404 },
    );
  }

  const assetKey = product.downloadAssetKey;

  try {
    let bytes: ArrayBuffer | null = null;

    // Edge runtime: R2 binding, or fetch from a configured public asset origin.
    // No node:fs — this route must build under next-on-pages edge.
    // @ts-expect-error — R2 binding injected by Cloudflare
    if (typeof EBOOK_BUCKET !== "undefined") {
      // @ts-expect-error
      const obj = await EBOOK_BUCKET.get(assetKey);
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
        "Content-Disposition": `attachment; filename="${product.fileName}"`,
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