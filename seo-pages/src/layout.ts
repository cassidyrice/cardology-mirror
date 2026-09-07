import { escapeHtml, serializeJsonLd } from "./escape";
import { articleJsonLd, type JsonLdRecord } from "./jsonld";
import { SITE_NAME, SITE_URL, type Breadcrumb } from "./types";
import { abs } from "./urls";

/** Build date, used when a hub does not supply its own provenance dates. */
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

/**
 * Inline stylesheet. Hub pages are served from their own Pages origin through
 * the path-split Worker, which routes only /{hub}* and the hub sitemap — a
 * root-relative <link href="/styles.css"> resolves against the Next app and
 * 404s. Tokens mirror app/globals.css (the warm-paper system) so a hub page
 * reads as the same site as /birth-card/*.
 */
const HUB_CSS = `:root {
  --font-serif: "Iowan Old Style", "Palatino Linotype", "Georgia", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --paper: #f6f1e8;
  --paper-deep: #efe8dc;
  --ivory: #fffcf7;
  --ink: #14110d;
  --ink-soft: #5b5148;
  --ink-faint: #756c61;
  --line: rgba(20, 17, 13, 0.12);
  --line-strong: rgba(20, 17, 13, 0.22);
  --bronze: #735624;
  --gold: #b8893d;
  --gold-soft: rgba(184, 137, 61, 0.14);
  --oxblood: #8e321f;
  --oxblood-deep: #6f2618;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--paper); color: var(--ink); font-family: var(--font-sans); font-size: 1.0625rem; line-height: 1.6; -webkit-font-smoothing: antialiased; }
::selection { background: rgba(184, 137, 61, 0.32); color: var(--ink); }
a { color: var(--oxblood); text-decoration-thickness: 1px; text-underline-offset: 0.15em; }
a:hover { color: var(--oxblood-deep); }
:where(a, button, summary):focus-visible { outline: 2px solid var(--oxblood); outline-offset: 2px; }
h1, h2, h3, .hero h1 { font-family: var(--font-serif); font-weight: 400; color: var(--ink); letter-spacing: -0.01em; line-height: 1.15; }
h1 { font-size: clamp(2rem, 4.5vw, 2.85rem); margin: 0.35rem 0 0.6rem; }
h2 { font-size: clamp(1.4rem, 2.4vw, 1.75rem); margin: 0 0 0.6rem; }
h3 { font-size: 1.15rem; margin: 0 0 0.4rem; }
p { margin: 0 0 1rem; }
.skip { position: absolute; left: -999px; top: 0; }
.skip:focus { left: 1rem; top: 1rem; background: var(--paper); padding: 0.4rem 0.7rem; z-index: 20; }
.site-header { border-bottom: 1px solid var(--line); background: var(--paper); }
.site-header .bar { width: min(72rem, 100%); margin-inline: auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
.brand { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--ink); text-decoration: none; }
.brand svg { width: 1.5rem; height: 1.5rem; }
.brand .wordmark { font-family: var(--font-sans); font-weight: 600; font-size: 1.05rem; letter-spacing: 0.01em; color: var(--ink); text-decoration: none; }
.site-nav { display: flex; gap: 1.5rem; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.site-nav a { color: var(--ink-soft); text-decoration: none; white-space: nowrap; }
.site-nav a:hover { color: var(--ink); }
main { width: min(52rem, calc(100% - 2.5rem)); margin-inline: auto; padding: 2rem 0 3rem; }
.kicker, .eyebrow { color: var(--bronze); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 0.5rem; }
.crumbs { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin: 0 0 1.75rem; }
.crumbs a { color: inherit; text-decoration: none; }
.crumbs a:hover { color: var(--ink); }
.meta, .archetype { color: var(--ink-soft); }
.meta { margin: 0 0 0.35rem; }
section { margin: 2.25rem 0; }
.hero { margin: 0 0 2rem; }
.hero .archetype { font-family: var(--font-serif); font-size: 1.2rem; color: var(--bronze); }
.example-banner, .method-banner, .coordinate-note, .callout, .joker-lineage, .disputed, .life-path {
  border: 1px solid var(--line-strong); background: var(--ivory); padding: 1rem 1.15rem; margin: 1.25rem 0; font-size: 0.95rem; }
.example-banner { border-color: var(--oxblood); }
.callout, .joker-lineage, .disputed { border-style: dashed; border-color: var(--gold); }
.life-path { background: var(--paper-deep); }
.life-path h3 { font-family: var(--font-serif); }
.life-path ul { margin: 0 0 0.75rem; padding-left: 1.2rem; }
.life-path li { margin: 0.2rem 0; }
.note, .notes { color: var(--ink-soft); font-size: 0.92rem; }
blockquote { margin: 1.25rem 0; padding: 0.25rem 0 0.25rem 1.1rem; border-left: 2px solid var(--gold); font-family: var(--font-serif); font-size: 1.12rem; line-height: 1.5; }
blockquote footer { font-family: var(--font-sans); font-size: 0.82rem; color: var(--ink-faint); margin-top: 0.35rem; }
.cta, .paper-button { display: inline-block; background: var(--oxblood); color: #fff; border: 0; text-decoration: none; padding: 0.85rem 1.4rem; font-family: var(--font-sans); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; }
.cta:hover { background: var(--oxblood-deep); color: #fff; }
.og-slot img { width: 100%; height: auto; border: 1px solid var(--line); }
.og-slot figcaption, .sources, .attribution, .page-provenance, .site-footer { color: var(--ink-faint); font-size: 0.85rem; }
.table-wrap { overflow-x: auto; }
table, .president-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
th, td, .president-table th, .president-table td { text-align: left; border-bottom: 1px solid var(--line); padding: 0.5rem 0.45rem; vertical-align: top; }
th, .president-table th { color: var(--ink-faint); font-weight: 600; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }
.card-group h3 { margin-bottom: 0.4rem; }
dl { margin: 0 0 1rem; }
dl dt { font-weight: 600; font-size: 0.82rem; letter-spacing: 0.02em; color: var(--ink-soft); margin-top: 0.6rem; }
dl dd { margin: 0.15rem 0 0.4rem; }
.facts { list-style: none; padding: 0; margin: 0 0 1rem; color: var(--ink-soft); }
.facts li { margin: 0.15rem 0; }
details summary { cursor: pointer; }
.site-footer { border-top: 1px solid var(--line); margin-top: 3rem; }
.site-footer .bar { width: min(72rem, 100%); margin-inline: auto; padding: 2.5rem 1.25rem 3rem; }
.site-footer .footer-nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin: 1rem 0 1.25rem; font-size: 0.85rem; }
.site-footer .footer-nav a { color: var(--ink-soft); text-decoration: none; }
.site-footer .footer-nav a:hover { color: var(--ink); text-decoration: underline; }
.site-footer p { margin: 0 0 0.5rem; }
@media (max-width: 640px) { .site-nav { display: none; } main { padding-top: 1.5rem; } }`;

/** Same mark the Next header renders (components brand-logo). */
const BRAND_MARK = `<svg class="brand-logo-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-opacity="0.45" stroke-width="1.1" fill="none" stroke-linecap="round"><path d="M7 23 12.5 10.5 20.5 16.5 25.5 8"></path><path d="M7 23 14.5 26.5 20.5 16.5"></path></g><g fill="currentColor"><circle cx="7" cy="23" r="2"></circle><circle cx="12.5" cy="10.5" r="2.3"></circle><circle cx="20.5" cy="16.5" r="2"></circle><circle cx="25.5" cy="8" r="1.7"></circle><circle cx="14.5" cy="26.5" r="1.5"></circle></g></svg>`;

const METHODOLOGY_URL = abs("/methodology");
const EDITORIAL_POLICY_URL = abs("/editorial-policy");

function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m - 1];
  return `${month} ${d}, ${y}`;
}

/**
 * Adds the E-E-A-T Article node to a page's JSON-LD graph. Every hub page gets
 * author, publisher, datePublished and dateModified from one place.
 */
function withArticleNode(
  jsonLd: JsonLdRecord,
  article: JsonLdRecord,
): JsonLdRecord {
  const graph = jsonLd["@graph"];
  if (Array.isArray(graph)) {
    return { ...jsonLd, "@graph": [article, ...graph] };
  }
  return jsonLd;
}

export function renderLayout(input: {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  ogImageAlt: string;
  jsonLd: JsonLdRecord;
  crumbs: readonly Breadcrumb[];
  body: string;
  kicker?: string;
  footer?: string;
  footerNote?: string;
  /** Date the page's underlying dates were verified against primary sources. */
  dateVerified?: string;
  /** Date this page was last rebuilt. */
  dateModified?: string;
  datePublished?: string;
  /** Primary source URLs, emitted as schema.org citation. */
  citations?: readonly string[];
}): string {
  const canonical = abs(input.canonicalPath);
  const footerNote =
    input.footerNote ??
    input.footer ??
    `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`;
  const dateVerified = input.dateVerified ?? BUILD_DATE;
  const dateModified = input.dateModified ?? BUILD_DATE;
  const datePublished = input.datePublished ?? dateModified;
  const article = articleJsonLd({
    headline: input.title,
    urlPath: input.canonicalPath,
    description: input.description,
    datePublished,
    dateModified,
    citations: input.citations,
  });
  const provenance = `<p class="page-provenance">Dates verified <time datetime="${escapeHtml(dateVerified)}">${escapeHtml(longDate(dateVerified))}</time> against the primary sources cited on this page · page updated <time datetime="${escapeHtml(dateModified)}">${escapeHtml(longDate(dateModified))}</time> · written and checked by <a href="${escapeHtml(abs("/about"))}" rel="author">Cassidy Rice</a> · <a href="${escapeHtml(METHODOLOGY_URL)}">Methodology</a> · <a href="${escapeHtml(EDITORIAL_POLICY_URL)}">Editorial policy</a></p>`;
  const crumbNav = input.crumbs
    .map((crumb, index) => {
      const current = index === input.crumbs.length - 1;
      const label = escapeHtml(crumb.name);
      if (current) {
        return `<span aria-current="page">${label}</span>`;
      }
      return `<a href="${escapeHtml(crumb.href)}">${label}</a>`;
    })
    .join(` <span aria-hidden="true">/</span> `);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
  <meta name="description" content="${escapeHtml(input.description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(input.title)}" />
  <meta property="og:description" content="${escapeHtml(input.description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(abs(input.ogImage))}" data-slot="og-image-meta" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(input.ogImageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(input.title)}" />
  <meta name="twitter:description" content="${escapeHtml(input.description)}" />
  <meta name="twitter:image" content="${escapeHtml(abs(input.ogImage))}" />
  <style>${HUB_CSS}</style>
  <script type="application/ld+json">${serializeJsonLd(withArticleNode(input.jsonLd, article))}</script>
</head>
<body>
  <a class="skip" href="#main-content">Skip to content</a>
  <header class="site-header">
    <div class="bar">
      <a class="brand" href="${escapeHtml(SITE_URL)}" aria-label="${escapeHtml(SITE_NAME)} home">${BRAND_MARK}<span class="wordmark" aria-hidden="true">card blueprint</span></a>
      <nav class="site-nav" aria-label="Primary"><a href="${escapeHtml(abs("/explore"))}">Explore</a><a href="${escapeHtml(abs("/birth-card-directories"))}">Directories</a></nav>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbNav}</nav>
    ${input.body}
  </main>
  <footer class="site-footer">
    <div class="bar">
      <a class="brand" href="${escapeHtml(SITE_URL)}" aria-label="${escapeHtml(SITE_NAME)} home">${BRAND_MARK}<span class="wordmark" aria-hidden="true">card blueprint</span></a>
      <nav class="footer-nav" aria-label="Footer"><a href="${escapeHtml(abs("/explore"))}">Explore</a><a href="${escapeHtml(abs("/birth-card-directories"))}">Birth-card directories</a><a href="${escapeHtml(abs("/birth-card-calculator"))}">Find your card</a><a href="${escapeHtml(METHODOLOGY_URL)}">Methodology</a><a href="${escapeHtml(EDITORIAL_POLICY_URL)}">Editorial policy</a><a href="${escapeHtml(abs("/privacy-policy"))}">Privacy</a></nav>
      ${provenance}
      <p>${escapeHtml(footerNote)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

export function exampleBanner(): string {
  return `<p class="example-banner" data-example="true" role="note">EXAMPLE fixture page. Not a real biography. WP3 enrichment will replace placeholder copy.</p>`;
}

export function jokerLineageSlot(): string {
  return `<aside class="joker-lineage" data-slot="joker-lineage" data-cass-lock="D1">
  <h2>December 31 / Joker lineage</h2>
  <p>EXAMPLE slot — WP3 will fill the lineage note. December 31 resolves to solar value 0 (the Joker), outside the 1–52 deck. Do not invent a celebrity bio here.</p>
</aside>`;
}
