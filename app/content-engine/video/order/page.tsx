import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoOrderForm } from "@/components/content-engine/VideoOrderForm";
import { videoTierEnabled } from "@/lib/content-engine/video-flag";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { contentCalendarsKv } from "@/lib/content-engine/kv";
import { readStoredCalendar } from "@/lib/content-engine/storage";
import { VIDEO_SINGLE_SLUG, videoVoiceAddonPriceId } from "@/lib/content-video";
import {
  availableVideoProducts,
  checkoutProductBySlug,
  isVideoOffer,
  isVideoService,
} from "@/lib/products";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Order video",
  description: "Turn your Content Calendar scripts into faceless shorts.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    offer?: string;
    calendarSessionId?: string;
  }>;
};

export default async function VideoOrderPage({ searchParams }: PageProps) {
  if (!videoTierEnabled()) {
    return (
      <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Content Calendar", href: "/content-engine" }]}>
        <h1 className="type-h1 mt-3 text-brand-ink">Video is coming after the first calendars ship.</h1>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Faceless shorts made from your calendar's scripts are being tested. The Content Calendar is available now.
        </p>
      </SeoShell>
    );
  }
  const sp = await searchParams;
  const offerSlug = sp.offer?.trim() || VIDEO_SINGLE_SLUG;
  const calendarSessionId = sp.calendarSessionId?.trim() ?? "";

  const product = checkoutProductBySlug(offerSlug);
  if (!product || !isVideoService(product) || !isVideoOffer(product)) {
    notFound();
  }

  const kv = contentCalendarsKv();
  const calendar = calendarSessionId
    ? await readStoredCalendar(calendarSessionId, kv)
    : null;

  const videoProducts = availableVideoProducts().filter(
    (p) => p.slug !== "video-voice-addon",
  );

  return (
    <SeoShell
      crumb={[
        { label: "Content Calendar", href: "/content-engine" },
        { label: "Order video", href: "/content-engine/video/order" },
      ]}
    >
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Kicker>Content Calendar · Video</Kicker>
        <h1 className="type-h1 mt-3 text-brand-ink">{product.name}</h1>
        <p className="mt-3 text-base text-brand-ink-soft">{product.oneLine}</p>

        {!calendar ? (
          <div
            role="alert"
            className="mt-8 border border-brand-oxblood bg-brand-ivory p-5"
          >
            <h2 className="type-h3 text-brand-ink">Content Calendar required</h2>
            <p className="mt-2 text-sm text-brand-ink-soft">
              Video orders need a paid calendar with written scripts. Open your calendar
              confirmation page, then use the Order video link from there.
            </p>
            <p className="mt-4">
              <Link href="/content-engine" className="editorial-link text-brand-ink">
                Get the Content Calendar →
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <VideoOrderForm
              offer={product}
              calendarSessionId={calendarSessionId}
              calendar={calendar}
              voiceAddonAvailable={Boolean(videoVoiceAddonPriceId())}
            />
          </div>
        )}

        {videoProducts.length > 1 ? (
          <aside className="mt-12 border-t border-brand-line pt-8">
            <h2 className="type-h3 text-brand-ink">Other video packs</h2>
            <ul className="mt-4 space-y-3">
              {videoProducts
                .filter((p) => p.slug !== product.slug)
                .map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/content-engine/video/order?offer=${p.slug}&calendarSessionId=${encodeURIComponent(calendarSessionId)}`}
                      className="editorial-link text-brand-ink"
                    >
                      {p.name} — {p.priceLabel}
                    </Link>
                  </li>
                ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </SeoShell>
  );
}
