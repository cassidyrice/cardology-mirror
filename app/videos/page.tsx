import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { VideoEmbed } from "@/components/seo/VideoEmbed";
import { SITE_NAME, SITE_URL, VIDEO_URL } from "@/lib/site";
import {
  CARDOLOGY_VIDEO_CHANNEL,
  CARDOLOGY_VIDEOS,
  videoCardSlug,
  youtubeEmbed,
  youtubeId,
  youtubeThumbnail,
} from "@/lib/videos";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Videos - Shadow Reading Films and Explainers",
  description:
    "Cardology videos: explainers and shadow-reading films on birth cards, famous-person patterns, timing, compatibility. Your relationship dynamics, out loud.",
  alternates: { canonical: "/videos" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Videos - Shadow Reading Films and Explainers",
    description:
      "Card Blueprints videos on birth-card shadow readings, timing, compatibility, famous-person patterns, and relationship dynamics. Headphones on.",
    url: "/videos",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function VideosPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Card Blueprints Videos",
      description: metadata.description,
      url: `${SITE_URL}/videos`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: CARDOLOGY_VIDEOS.map((video, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: video.title,
          url: video.url,
        })),
      },
    },
    ...CARDOLOGY_VIDEOS.map((video) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: video.description,
      thumbnailUrl: [youtubeThumbnail(video.url)],
      uploadDate: video.uploadDate,
      embedUrl: youtubeEmbed(video.url),
      url: video.url,
      publisher: { "@id": `${SITE_URL}/#organization` },
    })),
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Videos", href: "/videos" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology video library</p>
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Cardology videos for birth cards, people, shadow patterns, and relationships.
        </h1>
        <div className="mt-6 border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-brand-ink">
            Card Blueprints videos explain birth-card meanings, shadow patterns, timing,
            compatibility, famous-person examples, and how relationships actually go.
            Start with the card that is active in your life. Then watch the shadow
            pattern show up in your choices, your timing, your relationships.
            Uncomfortable. Useful.
          </p>
        </div>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-brand-ink">
          The videos are for when a written meaning is not enough. When you need
          to hear the card named out loud. The gift. The distortion. The real-life
          behavior, made obvious. Like listening to your own voice memo.
        </p>
        <p className="mt-5">
          <a href={CARDOLOGY_VIDEO_CHANNEL} className="ink-button large-button inline-flex">
            Open the video channel
          </a>
        </p>
      </header>

      <section>
        <h2 className="oracle-eyebrow mb-4">Recent shadow-reading films. Yours might be here.</h2>
        <div className="grid gap-4">
          {CARDOLOGY_VIDEOS.map((video) => {
            const cardSlug = videoCardSlug(video);
            return (
              <article key={video.url} className="border border-brand-line bg-brand-paper p-5">
                <p className="text-[0.68rem] font-bold uppercase text-brand-oxblood">
                  {video.card} · published {video.uploadDate}
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-none text-brand-ink">
                  {video.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">
                  {video.description}
                </p>
                <div className="mt-4 max-w-2xl">
                  <VideoEmbed
                    videoId={youtubeId(video.url)}
                    title={video.title}
                    frameClassName="border border-brand-line-strong"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {cardSlug && (
                    <Link href={`/birth-card/${cardSlug}`} className="paper-button small-button shrink-0">
                      Read the {video.card} meaning
                    </Link>
                  )}
                  <a
                    href={video.url}
                    className="text-xs font-bold uppercase text-brand-ink-soft underline underline-offset-4 hover:text-brand-oxblood"
                  >
                    Watch on the channel
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>


      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link href="/birth-card" className="border border-brand-line bg-brand-paper-deep p-4 text-sm font-bold uppercase text-brand-ink transition hover:bg-brand-ivory">
          All 52 birth cards
        </Link>
        <Link href="/blog/pillar/birth-card-meanings" className="border border-brand-line bg-brand-paper-deep p-4 text-sm font-bold uppercase text-brand-ink transition hover:bg-brand-ivory">
          Birth-card meaning guides
        </Link>
        <a href={VIDEO_URL} className="border border-brand-line bg-brand-paper-deep p-4 text-sm font-bold uppercase text-brand-ink transition hover:bg-brand-ivory">
          Hosted video subdomain
        </a>
      </section>
    </SeoShell>
  );
}
