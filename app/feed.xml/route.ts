// RSS 2.0 feed of all blog posts. Statically generated at build time (the GET
// runs once during `next build` in Node, so fs access is safe) and served as a
// static asset. Every item carries an <enclosure> + <media:content> image —
// the 2:3 Pinterest pin for the post's birth card when available, else the
// card's OG image, else the default OG card — so Pinterest auto-publish and
// feed readers can pull a pin image straight from the feed.

import { statSync } from "node:fs";
import { join } from "node:path";

import {
  BLOG_UPDATED,
  allBlogPosts,
  blogPillarBySlug,
  blogPostPath,
  type BlogPost,
} from "@/lib/blog";
import { allCardSlugs } from "@/lib/seo-cards";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const CARD_SLUGS = new Set(allCardSlugs());

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rssDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

// Find the birth card a post is about via its internal /birth-card/<slug>
// links (generated profiles always link their card first in coreLinks).
function cardSlugFor(post: BlogPost): string | null {
  const links = [...post.coreLinks, ...post.sections.flatMap((s) => s.links ?? [])];
  for (const link of links) {
    const match = /^\/birth-card\/([a-z0-9-]+)\/?$/.exec(link.href);
    if (match && CARD_SLUGS.has(match[1])) return match[1];
  }
  return null;
}

type FeedImage = { url: string; length: number; width: number; height: number };

// Resolve the best on-disk image for a post at build time. Preference order:
// 1000x1500 Pinterest pin -> 1200x630 card OG -> default OG. length is the
// real byte size required by the <enclosure> spec.
function feedImageFor(post: BlogPost): FeedImage {
  const card = cardSlugFor(post);
  const candidates: { rel: string; width: number; height: number }[] = [];
  if (card) {
    candidates.push({ rel: `/pins/${card}.png`, width: 1000, height: 1500 });
    candidates.push({ rel: `/og/${card}.png`, width: 1200, height: 630 });
  }
  candidates.push({ rel: "/og/default.png", width: 1200, height: 630 });

  for (const candidate of candidates) {
    try {
      const { size } = statSync(join(process.cwd(), "public", candidate.rel));
      return {
        url: `${SITE_URL}${candidate.rel}`,
        length: size,
        width: candidate.width,
        height: candidate.height,
      };
    } catch {
      // Candidate not on disk; fall through to the next one.
    }
  }
  return { url: `${SITE_URL}/og/default.png`, length: 0, width: 1200, height: 630 };
}

export function GET(): Response {
  const posts = [...allBlogPosts()].sort((a, b) =>
    (b.datePublished || BLOG_UPDATED).localeCompare(a.datePublished || BLOG_UPDATED),
  );

  const lastBuild = posts.reduce((max, post) => {
    const date = post.dateModified || post.datePublished || BLOG_UPDATED;
    return date > max ? date : max;
  }, BLOG_UPDATED);

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${blogPostPath(post)}`;
      const image = feedImageFor(post);
      const pillar = blogPillarBySlug(post.pillar);
      const category = pillar ? `\n<category>${escapeXml(pillar.title)}</category>` : "";
      return `<item>
<title>${escapeXml(post.title)}</title>
<link>${escapeXml(url)}</link>
<guid isPermaLink="true">${escapeXml(url)}</guid>
<description>${escapeXml(post.description)}</description>
<pubDate>${escapeXml(rssDate(post.datePublished || BLOG_UPDATED))}</pubDate>${category}
<enclosure url="${escapeXml(image.url)}" length="${image.length}" type="image/png"/>
<media:content url="${escapeXml(image.url)}" medium="image" type="image/png" width="${image.width}" height="${image.height}"/>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${escapeXml(`${SITE_NAME} — Cardology Blog`)}</title>
<link>${escapeXml(`${SITE_URL}/blog`)}</link>
<description>${escapeXml(
    "Educational Cardology guides on birth cards, suits, ranks, compatibility, karma cards, 52-day periods, and real-life dynamics — a mirror, not a forecast.",
  )}</description>
<language>en</language>
<lastBuildDate>${escapeXml(rssDate(lastBuild))}</lastBuildDate>
<atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
