import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL, VIDEO_URL } from "@/lib/site";
import {
  CARDOLOGY_VIDEO_CHANNEL,
  CARDOLOGY_VIDEOS,
  youtubeEmbed,
  youtubeThumbnail,
} from "@/lib/videos";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Videos - Shadow Reading Films and Explainers",
  description:
    "Watch Cardology Pro video explainers and shadow-reading films for birth cards, famous-person patterns, timing, compatibility, and relationship dynamics.",
  alternates: { canonical: "/videos" },
  openGraph: {
    title: "Cardology Videos - Shadow Reading Films and Explainers",
    description:
      "A crawlable hub for Cardology Pro videos: birth-card shadow readings, explainers, timing, compatibility, famous-person patterns, and relationship dynamics.",
    url: "/videos",
    type: "website",
  },
};

export default function VideosPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cardology Pro Videos",
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
            Cardology Pro videos explain birth-card meanings, shadow patterns, timing,
            compatibility, famous-person examples, and practical relationship dynamics.
            The written pages on this site are the stable citation source; the hosted
            video library is the place to watch.
          </p>
        </div>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d]">
          Use this page as the crawlable main-domain video hub. It links each public
          film back into the same educational system as the calculators, card meanings,
          compatibility pages, and blog guides.
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
          {CARDOLOGY_VIDEOS.map((video) => (
            <article key={video.url} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase text-[#9e3d24]">
                    {video.card} · published {video.uploadDate}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl leading-none text-[#14110d]">
                    <a href={video.url} className="hover:text-[#9e3d24]">
                      {video.title}
                    </a>
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5b5148]">
                    {video.description}
                  </p>
                </div>
                <a href={video.url} className="paper-button small-button shrink-0">
                  Watch
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

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
