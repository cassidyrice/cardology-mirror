import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  allBlogPosts,
  isCelebrityBirthCardProfile,
  type BlogPost,
} from "../lib/blog";

const root = join(import.meta.dir, "..");
const page = readFileSync(join(root, "app/blog/[slug]/page.tsx"), "utf8");
const harvest = readFileSync(join(root, "pipeline/celebs/harvest.py"), "utf8");

function celebPosts(): BlogPost[] {
  return allBlogPosts().filter(isCelebrityBirthCardProfile);
}

test("grounds the existing celebrity blog profiles and leaves CTA link-only", () => {
  const posts = celebPosts();
  expect(posts).toHaveLength(57);
  const verified = posts.filter((post) => post.citations?.status === "verified");
  const flagged = posts.filter((post) => post.citations?.status === "flagged");
  expect(verified).toHaveLength(56);
  expect(flagged).toHaveLength(1);
  expect(flagged[0]?.slug).toBe("lady-gaga-birth-card-profile");

  for (const post of posts) {
    expect(post.slug.endsWith("-birth-card-profile")).toBe(true);
    const headings = post.sections.map((section) => section.heading);
    expect(headings).toContain("Public date sources");
    const howTo = post.sections.find((section) => section.heading === "How to use this profile");
    expect(howTo?.links?.some((link) => link.href === "/products/personal-card-blueprint")).toBe(true);
    expect(post.coreLinks.some((link) => link.href === "/products/personal-card-blueprint")).toBe(true);
    expect(JSON.stringify(post.coreLinks)).not.toContain("/checkout/");
    expect(JSON.stringify(post.faqs).toLowerCase()).toContain("not fortune-telling");
  }

  const taylor = posts.find((post) => post.slug === "taylor-swift-birth-card-profile");
  expect(taylor?.citations?.qid).toBe("Q26876");
  expect(taylor?.citations?.birthDate).toBe("1989-12-13");
  expect(taylor?.citations?.wikidataUrl).toBe("https://www.wikidata.org/wiki/Q26876");
  expect(taylor?.citations?.wikipediaUrl).toContain("Taylor_Swift");
  expect(JSON.stringify(taylor?.sections)).toContain("Wikidata P569");
  expect(JSON.stringify(taylor?.sections)).toContain("calendar coordinate");
});

test("blog renderer cites Wikidata/Wikipedia and does not add checkout forms", () => {
  expect(page).toContain("data-slot=\"sources\"");
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain('"@type": "Person"');
  expect(page).not.toContain("/create-checkout");
  expect(page).not.toContain("stripe");
});

test("does not activate a celeb path-split onto /birth-card person slugs", () => {
  expect(harvest).toContain("Existing /blog/{slug} celebrity profiles only");
  expect(harvest).toContain("No path-split");
});
