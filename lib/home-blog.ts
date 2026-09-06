import {
  allBlogPosts,
  blogPillarBySlug,
  blogPostBySlug,
  type BlogPost,
} from "@/lib/blog";

/** Empty until the flagship post ships. When set, that slug occupies slot 1. */
export const HOME_BLOG_PINNED_SLUG = "" as const;

function publishedMs(post: BlogPost): number {
  return Date.parse(post.dateModified || post.datePublished);
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] ?? trimmed).trim();
}

export type HomeBlogCard = {
  slug: string;
  title: string;
  href: string;
  category: string;
  hook: string;
  readTime: string;
  imageSrc: string | null;
};

export function latestHomeBlogPosts(limit = 3): HomeBlogCard[] {
  const pinned =
    HOME_BLOG_PINNED_SLUG !== ""
      ? blogPostBySlug(HOME_BLOG_PINNED_SLUG)
      : null;

  const rest = allBlogPosts()
    .filter((p) => !pinned || p.slug !== pinned.slug)
    // Spec §3.3: no celebrity profiles unless pinned on purpose.
    .filter((p) => !p.slug.endsWith("-birth-card-profile"))
    .sort((a, b) => publishedMs(b) - publishedMs(a));

  const ordered = pinned ? [pinned, ...rest] : rest;
  return ordered.slice(0, limit).map((post) => {
    const pillar = blogPillarBySlug(post.pillar);
    return {
      slug: post.slug,
      title: post.title,
      href: `/blog/${post.slug}`,
      category: pillar?.shortTitle ?? post.pillar,
      hook: firstSentence(post.description || post.dek),
      readTime: post.readTime,
      imageSrc: null,
    };
  });
}
