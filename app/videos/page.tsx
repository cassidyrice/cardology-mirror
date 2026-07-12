import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { VideoEmbed } from "@/components/seo/VideoEmbed";
import { SITE_URL, VIDEO_URL } from "@/lib/site";
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
    "Watch Card Blueprints video explainers and shadow-reading films for birth cards, famous-person patterns, timing, compatibility, and relationship dynamics.",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "Cardology Videos - Shadow Reading Films and Explainers",
    description:
      "Card Blueprints videos on birth-card shadow readings, explainers, timing, compatibility, famous-person patterns, and relationship dynamics.",
    url: "/videos",
    type: "website",
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
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Cardology videos for birth cards, people, shadow patterns, and relationships.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Card Blueprints videos explain birth-card meanings, shadow patterns, timing,
            compatibility, famous-person examples, and practical relationship dynamics.
            Start with the card that is active in your life, then watch how the shadow
            pattern shows up in choices, timing, and relationships.
          </p>
        </div>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d]">
          The videos are for the moments when a written meaning is not enough: when
          you want to hear the card named out loud, with the gift, distortion, and
          real-life behavior made obvious.
        </p>
        <p className="mt-5">
          <a href={CARDOLOGY_VIDEO_CHANNEL} className="ink-button large-button inline-flex">
            Open the hosted video channel
          </a>
        </p>
      </header>

      <section>
        <h2 className="oracle-eyebrow mb-4">Recent shadow-reading films</h2>
        <div className="grid gap-4">
          {CARDOLOGY_VIDEOS.map((video) => {
            const cardSlug = videoCardSlug(video);
            return (
              <article key={video.url} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
                <p className="text-[0.68rem] font-bold uppercase text-[#9e3d24]">
                  {video.card} · published {video.uploadDate}
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-none text-[#14110d]">
                  {video.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5b5148]">
                  {video.description}
                </p>
                <div className="mt-4 max-w-2xl">
                  <VideoEmbed
                    videoId={youtubeId(video.url)}
                    title={video.title}
                    frameClassName="border border-[#14110d]/20"
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
                    className="text-xs font-bold uppercase text-[#5b5148] underline underline-offset-4 hover:text-[#9e3d24]"
                  >
                    Watch on the channel
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <ReadingBridge variant="general" className="mt-12" />

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link href="/birth-card" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          All 52 birth cards
        </Link>
        <Link href="/blog/pillar/birth-card-meanings" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Birth-card meaning guides
        </Link>
        <a href={VIDEO_URL} className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Hosted video subdomain
        </a>
      </section>
    </SeoShell>
  );
}
